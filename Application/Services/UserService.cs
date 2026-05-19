using Application.Contracts;
using Application.DTOs.Request;
using Application.DTOs.Response;
using Dapper;
using Domain.DomainEnums;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MySqlConnector;

namespace Application.Services;

/// <summary>
/// User service implementation.
/// Authenticates against the CMPL database and persists identity into the application database.
/// </summary>
public class UserService(IUserRepository userRepository, IUnitOfWork unitOfWork, ILogger<UserService> logger, IConfiguration configuration) : IUserService
{
    private static readonly string[] AccessReqRoleQueries = new[]
    {
        "SELECT role_name FROM jan_itaccessreq_db.user_roles WHERE user_id = @id LIMIT 1",
        "SELECT role FROM jan_itaccessreq_db.user_roles WHERE user_id = @id LIMIT 1",
        "SELECT user_role FROM jan_itaccessreq_db.users WHERE user_id = @id LIMIT 1",
        "SELECT role FROM jan_itaccessreq_db.users WHERE user_id = @id LIMIT 1"
    };

    private async Task<CmplUserRecord?> GetCmplUserAsync(string identifier, string password, CancellationToken ct)
    {
        var connectionString = configuration.GetConnectionString("MySqlConnectionString_Cmpl");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogError("Missing MySqlConnectionString_Cmpl configuration.");
            return null;
        }

        const string sql = @"
            SELECT
                CMPL_USER_ID AS UserId,
                emp_id AS EmployeeId,
                CMPL_USER_NAME AS UserName,
                MAIL_ID AS Email,
                MOB_NO AS Mobile,
                DEPT_IT AS DeptId,
                LOCATION AS Location,
                ROLE AS Role,
                DEPARTMENT_ID AS DepartmentId
            FROM it_inventory_db_new.jan_complaint_login
            WHERE deleted_flag = 0
              AND (CMPL_USER_NAME = @id OR emp_id = @id OR MAIL_ID = @id)
              AND CMPL_USER_KEY = @pwd
            LIMIT 1;";

        try
        {
            await using var connection = new MySqlConnection(connectionString);
            return await connection.QueryFirstOrDefaultAsync<CmplUserRecord>(
                new CommandDefinition(sql, new { id = identifier, pwd = password }, cancellationToken: ct));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "CMPL database connection failed.");
            return null;
        }
    }

    private async Task<CmplUserRecord?> GetCmplUserByIdAsync(int userId, CancellationToken ct)
    {
        var connectionString = configuration.GetConnectionString("MySqlConnectionString_Cmpl");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogError("Missing MySqlConnectionString_Cmpl configuration.");
            return null;
        }

        const string sql = @"
            SELECT
                CMPL_USER_ID AS UserId,
                emp_id AS EmployeeId,
                CMPL_USER_NAME AS UserName,
                MAIL_ID AS Email,
                MOB_NO AS Mobile,
                DEPT_IT AS DeptId,
                LOCATION AS Location,
                ROLE AS Role,
                DEPARTMENT_ID AS DepartmentId
            FROM it_inventory_db_new.jan_complaint_login
            WHERE deleted_flag = 0
              AND CMPL_USER_ID = @id
            LIMIT 1;";

        try
        {
            await using var connection = new MySqlConnection(connectionString);
            return await connection.QueryFirstOrDefaultAsync<CmplUserRecord>(
                new CommandDefinition(sql, new { id = userId }, cancellationToken: ct));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "CMPL database lookup failed by user ID.");
            return null;
        }
    }

    private async Task<string?> GetAccessReqRoleAsync(int userId, CancellationToken ct)
    {
        var connectionString = configuration.GetConnectionString("MySqlConnectionString");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogDebug("Missing MySqlConnectionString configuration for accessreq role lookup.");
            return null;
        }

        try
        {
            await using var connection = new MySqlConnection(connectionString);
            foreach (var query in AccessReqRoleQueries)
            {
                try
                {
                    var role = await connection.QueryFirstOrDefaultAsync<string?>(
                        new CommandDefinition(query, new { id = userId }, cancellationToken: ct));

                    if (!string.IsNullOrWhiteSpace(role))
                    {
                        return role.Trim();
                    }
                }
                catch (MySqlException ex)
                {
                    logger.LogDebug(ex, "Accessreq role query failed for SQL: {Query}", query);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Accessreq database connection failed.");
        }

        return null;
    }

    private static UserResponseDto BuildUserResponse(User? localUser, CmplUserRecord? cmplUser, string? accessReqRole)
    {
        if (localUser == null && cmplUser == null)
        {
            throw new InvalidOperationException("Unable to build a user response without source data.");
        }

        var userId = cmplUser?.UserId ?? localUser!.UserId;
        var employeeId = cmplUser?.EmployeeId ?? localUser?.EmployeeId ?? string.Empty;
        var userName = cmplUser?.UserName ?? localUser?.UserName ?? string.Empty;
        var email = cmplUser?.Email ?? localUser?.Email ?? string.Empty;
        var phoneNumber = cmplUser?.Mobile;
        var deptId = cmplUser?.DeptId;
        var location = cmplUser?.Location;
        var departmentId = cmplUser?.DepartmentId;

        var role = accessReqRole;
        if (string.IsNullOrWhiteSpace(role))
        {
            role = cmplUser?.Role ?? localUser?.UserRole?.ToString();
        }

        return new UserResponseDto(userId, employeeId, userName, email, phoneNumber, deptId, location, role, departmentId);
    }

    private async Task SaveLocalUserAsync(CmplUserRecord cmplUser, CancellationToken ct)
    {
        var localUser = await userRepository.GetByIdAsync(cmplUser.UserId, ct);

        if (localUser == null)
        {
            localUser = new User
            {
                UserId = cmplUser.UserId,
                EmployeeId = cmplUser.EmployeeId,
                UserName = cmplUser.UserName,
                Email = cmplUser.Email ?? string.Empty
            };

            await userRepository.AddAsync(localUser, ct);
        }
        else
        {
            localUser.EmployeeId = cmplUser.EmployeeId;
            localUser.UserName = cmplUser.UserName;
            localUser.Email = cmplUser.Email ?? string.Empty;
            userRepository.Update(localUser);
        }

        var accessReqRole = await GetAccessReqRoleAsync(cmplUser.UserId, ct);
        var roleText = accessReqRole ?? cmplUser.Role;
        if (!string.IsNullOrWhiteSpace(roleText) && Enum.TryParse<UserRole>(roleText, true, out var parsedRole))
        {
            localUser.UserRole = parsedRole;
        }

        await unitOfWork.SaveChangesAsync(ct);
    }

    public async Task<UserResponseDto> LoginAsync(LoginRequestDto loginRequest, CancellationToken cancellation)
    {
        var identifier = loginRequest.Identifier?.Trim();
        if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(loginRequest.Password))
        {
            logger.LogWarning("Login request missing identifier or password.");
            throw new UnauthorizedAccessException("Identifier and password are required.");
        }

        var cmplUser = await GetCmplUserAsync(identifier, loginRequest.Password, cancellation);
        if (cmplUser == null)
        {
            logger.LogWarning("Authentication failed for identifier: {Identifier}", identifier);
            throw new UnauthorizedAccessException("Invalid username or password.");
        }

        await SaveLocalUserAsync(cmplUser, cancellation);

        var accessReqRole = await GetAccessReqRoleAsync(cmplUser.UserId, cancellation);
        return BuildUserResponse(null, cmplUser, accessReqRole);
    }

    public async Task<UserResponseDto?> GetByIdAsync(int userId, CancellationToken cancellation)
    {
        var localUser = await userRepository.GetByIdAsync(userId, cancellation);
        var cmplUser = await GetCmplUserByIdAsync(userId, cancellation);
        var accessReqRole = await GetAccessReqRoleAsync(userId, cancellation);

        if (cmplUser != null && localUser == null)
        {
            await SaveLocalUserAsync(cmplUser, cancellation);
        }

        if (localUser == null && cmplUser == null)
        {
            return null;
        }

        return BuildUserResponse(localUser, cmplUser, accessReqRole);
    }
}
