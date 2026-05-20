using System.IO;
using Shared.Helpers;
using Web.Domain.Enums;
using Web.Features.Department;
using Web.Features.Hod;
using Web.Infrastructure.Repositories;
using Web.Shared.Helpers;

namespace Web.Features.Auth.Me;

public sealed class UserService(
    IUnitOfWork uow,
    HodService hodService,
    ILogger<UserService> logger,
    IConfiguration configuration)
{
    private readonly IUnitOfWork _uow = uow;
    private readonly HodService _hodService = hodService;
    private readonly ILogger<UserService> _logger = logger;
    private readonly IConfiguration _configuration = configuration;

    public async Task<UserResponse?> GetCurrentUserAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var localUser = await _uow.Users
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (localUser is null)
        {
            _logger.LogWarning("Local user with ID {UserId} not found.", userId);
            return null;
        }

        CmplUserRecord? cmplUser;

        if (!Constants.IsSqlite(_configuration))
        {
            cmplUser = await GetCmplUserByIdAsync(userId, cancellationToken);
        }
        else
        {
            var csvFilePath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "Infrastructure",
                "Persistence",
                "Userdata_SQL.csv");

            if (!File.Exists(csvFilePath))
            {
                _logger.LogError("CSV file not found at path: {Path}", csvFilePath);
                return null;
            }

            cmplUser = GetUserFromCsv(csvFilePath, userId);
        }

        if (cmplUser is null)
        {
            _logger.LogWarning("CMPL user details not found for UserId: {UserId}", userId);
            return null;
        }

        var userDepartment = await _uow.Departments
            .FirstOrDefaultAsync(x => x.DeptId == cmplUser.DeptId, cancellationToken);

        HodRecord? hod = null;
        DepartmentRecord? department = null;

        if (userDepartment is not null)
        {
            department = new DepartmentRecord
            {
                DeptId = userDepartment.DeptId,
                DeptName = userDepartment.DepartmentName ?? string.Empty,
                HodUserId = userDepartment.HodId,
                Hod = userDepartment.HodId.HasValue
                    ? await _hodService.GetHodByIdAsync(userDepartment.HodId.Value, cancellationToken)
                    : null
            };

            if (userDepartment.HodId.HasValue)
            {
                hod = await _hodService.GetHodByIdAsync(userDepartment.HodId.Value, cancellationToken);
            }
        }

        return new UserResponse
        {
            UserId = cmplUser.UserId,
            UserName = cmplUser.UserName,
            Email = cmplUser.Email,
            Mobile = cmplUser.Mobile,
            DeptId = cmplUser.DeptId,
            UserRole = localUser.UserRole ?? UserRole.User,
            Location = localUser.Location ?? string.Empty,
            Department = department,
            Hod = hod
        };
    }

    private CmplUserRecord? GetUserFromCsv(
        string filePath,
        int userId)
    {
        try
        {
            using var reader = new StreamReader(filePath);
            reader.ReadLine();

            while (reader.ReadLine() is { } line)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var columns = line.Split(',');
                if (columns.Length < 30)
                    continue;

                var csvUserId = columns[0].Trim();
                if (!int.TryParse(csvUserId, out var parsedUserId))
                    continue;
                if (parsedUserId != userId)
                    continue;

                var csvUserName = columns[1].Trim();
                var csvMobile = columns[8].Trim();
                var csvEmail = columns[9].Trim();
                var csvDeptId = columns[10].Trim();
                var csvEmployeeId = columns[29].Trim();

                long.TryParse(csvMobile, out var mobile);
                int.TryParse(csvDeptId, out var deptId);

                return new CmplUserRecord
                {
                    UserId = parsedUserId,
                    UserName = csvUserName,
                    EmployeeId = csvEmployeeId,
                    Email = csvEmail,
                    Mobile = mobile,
                    DeptId = deptId
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading user data from CSV.");
        }

        return null;
    }

    private async Task<CmplUserRecord?> GetCmplUserByIdAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var connectionString = _configuration["Database:MySqlConnectionString_Cmpl"];
        return await _uow.Dapper.QuerySingleOrDefaultAsync<CmplUserRecord>(
            Queries.CmplUserQuery,
            new { userId },
            connectionString,
            null,
            cancellationToken);
    }
}
