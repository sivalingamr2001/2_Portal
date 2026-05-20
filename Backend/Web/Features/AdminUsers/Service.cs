using System.IO;
using Shared.Helpers;
using Web.Common.Exceptions;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Features.Auth.Login;
using Web.Features.Department;
using Web.Infrastructure.Repositories;
using Web.Shared.Helpers;

namespace Web.Features.AdminUsers;

public sealed class AdminUserService(
    IUnitOfWork uow,
    DepartmentService departmentService,
    IConfiguration configuration,
    ILogger<AdminUserService> logger)
{
    private readonly IUnitOfWork _uow = uow;
    private readonly DepartmentService _departmentService = departmentService;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<AdminUserService> _logger = logger;

    public async Task<List<AdminUserRecord>> GetUsersAsync(
        string? search,
        string? role,
        CancellationToken cancellationToken)
    {
        var localUsers = await _uow.Users.GetAllAsync(cancellationToken);
        var externalUsers = await GetExternalUsersAsync(cancellationToken);
        var departments = (await _departmentService.GetDepartmentsAsync(cancellationToken))
            .ToDictionary(x => x.DeptId, x => x.DeptName);

        var query = localUsers
            .Select(local =>
            {
                externalUsers.TryGetValue(local.UserId, out var external);
                var deptId = external?.DeptId ?? 0;
                return new AdminUserRecord
                {
                    UserId = local.UserId,
                    EmployeeId = external?.EmployeeId ?? string.Empty,
                    UserName = external?.UserName ?? $"User {local.UserId}",
                    Email = external?.Email ?? string.Empty,
                    Mobile = external?.Mobile ?? 0,
                    DeptId = deptId,
                    DepartmentName = departments.TryGetValue(deptId, out var departmentName)
                        ? departmentName
                        : string.Empty,
                    UserRole = local.UserRole ?? UserRole.User,
                    Location = local.Location ?? string.Empty,
                    CreatedAt = local.CreatedAt
                };
            })
            .OrderBy(x => x.UserName)
            .AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.UserName.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                x.Email.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                x.EmployeeId.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                x.UserId.ToString().Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(role) &&
            Enum.TryParse<UserRole>(role, true, out var parsedRole))
        {
            query = query.Where(x => x.UserRole == parsedRole);
        }

        return query.ToList();
    }

    public async Task<AdminUserRecord> CreateUserAsync(
        AdminUserCreateRequest request,
        CancellationToken cancellationToken)
    {
        var externalUser = await ResolveExternalUserAsync(request.Identifier, cancellationToken)
            ?? throw new NotFoundException("Employee", request.Identifier);

        var exists = await _uow.Users.ExistsAsync(x => x.UserId == externalUser.UserId, cancellationToken);
        if (exists)
            throw new ConflictException($"Employee '{request.Identifier}' already exists in the admin workspace.");

        var user = Users.Create(
            externalUser.UserId,
            request.UserRole,
            request.Location.Trim(),
            "system");

        await _uow.Users.AddAsync(user, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return await BuildAdminUserRecordAsync(user, externalUser, cancellationToken);
    }

    public async Task<AdminUserRecord?> UpdateUserAsync(
        int userId,
        AdminUserUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _uow.Users.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (user is null)
            return null;

        user.UpdateProfile(user.UserId, request.UserRole, request.Location.Trim(), "system");
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync(cancellationToken);

        var externalUser = await ResolveExternalUserAsync(userId.ToString(), cancellationToken);
        return await BuildAdminUserRecordAsync(user, externalUser, cancellationToken);
    }

    public async Task<bool> DeleteUserAsync(int userId, CancellationToken cancellationToken)
    {
        var user = await _uow.Users.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (user is null)
            return false;

        _uow.Users.SoftDelete(user, "system");
        await _uow.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<AdminUserRecord> BuildAdminUserRecordAsync(
        Users user,
        CmplUserRecord? externalUser,
        CancellationToken cancellationToken)
    {
        var departmentName = string.Empty;
        if (externalUser?.DeptId is > 0)
        {
            var department = await _departmentService.GetDepartmentByIdAsync(externalUser.DeptId, cancellationToken);
            departmentName = department?.DeptName ?? string.Empty;
        }

        return new AdminUserRecord
        {
            UserId = user.UserId,
            EmployeeId = externalUser?.EmployeeId ?? string.Empty,
            UserName = externalUser?.UserName ?? $"User {user.UserId}",
            Email = externalUser?.Email ?? string.Empty,
            Mobile = externalUser?.Mobile ?? 0,
            DeptId = externalUser?.DeptId ?? 0,
            DepartmentName = departmentName,
            UserRole = user.UserRole ?? UserRole.User,
            Location = user.Location ?? string.Empty,
            CreatedAt = user.CreatedAt
        };
    }

    private async Task<CmplUserRecord?> ResolveExternalUserAsync(
        string identifier,
        CancellationToken cancellationToken)
    {
        var users = await GetExternalUsersAsync(cancellationToken);
        return users.Values.FirstOrDefault(x =>
            string.Equals(x.UserId.ToString(), identifier, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(x.EmployeeId, identifier, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(x.Email, identifier, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(x.UserName, identifier, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<Dictionary<int, CmplUserRecord>> GetExternalUsersAsync(CancellationToken cancellationToken)
    {
        var users = Constants.IsSqlite(_configuration)
            ? GetUsersFromCsv()
            : (await _uow.Dapper.QueryAsync<CmplUserRecord>(
                Queries.CmplUserQuery,
                null,
                _configuration["Database:MySqlConnectionString_Cmpl"],
                null,
                cancellationToken)).ToList();

        return users
            .Where(x => x.UserId > 0)
            .GroupBy(x => x.UserId)
            .ToDictionary(x => x.Key, x => x.First());
    }

    private List<CmplUserRecord> GetUsersFromCsv()
    {
        var csvFilePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "Infrastructure",
            "Persistence",
            "Userdata_SQL.csv");

        if (!File.Exists(csvFilePath))
        {
            _logger.LogWarning("User CSV not found at {Path}", csvFilePath);
            return [];
        }

        var users = new List<CmplUserRecord>();

        using var reader = new StreamReader(csvFilePath);
        reader.ReadLine();

        while (reader.ReadLine() is { } line)
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;

            var columns = line.Split(',');
            if (columns.Length < 29)
                continue;

            int.TryParse(columns[0].Trim(), out var userId);
            long.TryParse(columns[8].Trim(), out var mobile);
            int.TryParse(columns[10].Trim(), out var deptId);

            if (userId <= 0)
                continue;

            users.Add(new CmplUserRecord
            {
                UserId = userId,
                UserName = columns[1].Trim(),
                Email = columns[9].Trim(),
                Mobile = mobile,
                DeptId = deptId,
                EmployeeId = columns[28].Trim()
            });
        }

        return users;
    }
}
