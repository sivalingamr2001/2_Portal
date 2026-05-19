using Application.Contracts;
using Application.DTOs.Request;
using Application.DTOs.Response;
using Dapper;
using Domain.DomainEnums; // Contains UserRole enum
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using System.Data;

namespace Application.Implementation;

/// <summary>
/// User service implementation.
/// Authenticates against the CMPL database and persists identity into the application database using EF Core.
/// </summary>
public class UserService(ILogger<UserService> logger, IConfiguration configuration, AppDbContext dbContext) : IUserService
{
    private string GetCmplConnectionString() => configuration.GetConnectionString("MySqlConnectionString_Cmpl") ?? string.Empty;

    private async Task<CmplUserRecord?> GetCmplUserAsync(string identifier, string? password, CancellationToken cancellationToken)
    {
        var connectionString = GetCmplConnectionString();
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogError("Missing MySqlConnectionString_Cmpl configuration.");
            return null;
        }

        string sql = @"
            SELECT 
                CMPL_USER_ID as UserId, 
                emp_id as EmployeeId, 
                CMPL_USER_NAME as UserName, 
                MAIL_ID as Email,
                MOB_NO as Mobile,
                DEPT_ID as DepartmentId
            FROM it_inventory_db_new.jan_complaint_login
            WHERE deleted_flag = 0 
              AND (CMPL_USER_NAME = @id OR emp_id = @id OR MAIL_ID = @id)";

        if (password != null)
        {
            sql += " AND CMPL_USER_KEY = @pwd";
        }

        sql += " LIMIT 1";

        try
        {
            using var connection = new MySqlConnection(connectionString);
            return await connection.QueryFirstOrDefaultAsync<CmplUserRecord>(
                new CommandDefinition(sql, new { id = identifier, pwd = password }, cancellationToken: cancellationToken));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "CMPL database connection failed for identifier: {Identifier}", identifier);
            return null;
        }
    }

    private async Task<UserRole?> GetLocalUserRoleAsync(int userId, CancellationToken cancellationToken)
    {
        try
        {
            var localUser = await dbContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

            return localUser?.UserRole;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch local user role via EF Core for UserId: {UserId}", userId);
            return null;
        }
    }

    private async Task SaveLocalUserAsync(CmplUserRecord cmplUser, UserRole? role, CancellationToken cancellationToken)
    {
        try
        {
            var existingUser = await dbContext.Users
                .FirstOrDefaultAsync(u => u.UserId == cmplUser.UserId, cancellationToken);

            if (existingUser == null)
            {
                var newUser = new User
                {
                    UserId = cmplUser.UserId,
                    UserRole = role
                };

                await dbContext.Users.AddAsync(newUser, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to sync user locally via EF Core for UserId: {UserId}", cmplUser.UserId);
        }
    }

    public async Task<UserResponseDto> LoginAsync(LoginRequestDto loginRequest, CancellationToken cancellationToken)
    {
        var identifier = loginRequest.Identifier?.Trim();
        if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(loginRequest.Password))
        {
            logger.LogWarning("Login request missing identifier or password.");
            throw new UnauthorizedAccessException("Identifier and password are required.");
        }

        var cmplUser = await GetCmplUserAsync(identifier, loginRequest.Password, cancellationToken);
        if (cmplUser == null)
        {
            logger.LogWarning("Authentication failed for identifier: {Identifier}", identifier);
            throw new UnauthorizedAccessException("Invalid username or password.");
        }

        var role = await GetLocalUserRoleAsync(cmplUser.UserId, cancellationToken);

        await SaveLocalUserAsync(cmplUser, role, cancellationToken);

        return new UserResponseDto(
            cmplUser.UserId,
            cmplUser.EmployeeId ?? string.Empty,
            cmplUser.UserName ?? string.Empty,
            cmplUser.Email ?? string.Empty,
            cmplUser.Mobile,
            cmplUser.Location,
            role,
            cmplUser.DepartmentId
        );
    }

    public async Task<UserResponseDto?> GetByIdAsync(int userId, CancellationToken cancellationToken)
    {
        var cmplUser = await GetCmplUserAsync(userId.ToString(), null, cancellationToken);
        if (cmplUser == null)
        {
            logger.LogWarning("User not found in CMPL DB for UserId: {UserId}", userId);
            return null;
        }

        var role = await GetLocalUserRoleAsync(cmplUser.UserId, cancellationToken);

        return new UserResponseDto(
            cmplUser.UserId,
            cmplUser.EmployeeId ?? string.Empty,
            cmplUser.UserName ?? string.Empty,
            cmplUser.Email ?? string.Empty,
            cmplUser.Mobile,
            cmplUser.Location,
            role,
            cmplUser.DepartmentId
        );
    }

    // ADDED: Implementation to fetch all users from CMPL DB and overlay local role records efficiently
    public async Task<IEnumerable<UserResponseDto>> GetAllEmployeesAsync(CancellationToken cancellationToken)
    {
        var connectionString = GetCmplConnectionString();
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogError("Missing MySqlConnectionString_Cmpl configuration inside GetAllEmployeesAsync.");
            return Enumerable.Empty<UserResponseDto>();
        }

        // 1. Query all active users from CMPL table using Dapper
        const string cmplSql = @"
            SELECT 
                CMPL_USER_ID as UserId, 
                emp_id as EmployeeId, 
                CMPL_USER_NAME as UserName, 
                MAIL_ID as Email,
                MOB_NO as Mobile,
                DEPT_ID as DepartmentId
            FROM it_inventory_db_new.jan_complaint_login
            WHERE deleted_flag = 0";

        IEnumerable<CmplUserRecord> cmplUsers;
        try
        {
            using var connection = new MySqlConnection(connectionString);
            cmplUsers = await connection.QueryAsync<CmplUserRecord>(
                new CommandDefinition(cmplSql, cancellationToken: cancellationToken));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to retrieve batch data list from CMPL master database table.");
            return Enumerable.Empty<UserResponseDto>();
        }

        // 2. Fetch all registered local context database roles into an optimized Dictionary lookup map via EF Core
        var localUserRolesMap = await dbContext.Users
            .AsNoTracking()
            .Select(u => new { u.UserId, u.UserRole })
            .ToDictionaryAsync(u => u.UserId, u => u.UserRole, cancellationToken);

        // 3. Merge data streams on the matching UserId primary link references
        var combinedList = cmplUsers.Select(cmplUser =>
        {
            localUserRolesMap.TryGetValue(cmplUser.UserId, out var localRole);

            return new UserResponseDto(
                cmplUser.UserId,
                cmplUser.EmployeeId ?? string.Empty,
                cmplUser.UserName ?? string.Empty,
                cmplUser.Email ?? string.Empty,
                cmplUser.Mobile,
                cmplUser.Location,
                localRole, // Maps UserRole enum or falls back cleanly to null if unmapped
                cmplUser.DepartmentId
            );
        });

        return combinedList;
    }
}
