using System.IO;
using Shared.Helpers;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Features.Auth.Login;
using Web.Infrastructure.Repositories;
using Web.Shared.Helpers;

namespace Web.Features.Hod;

public class HodService(IConfiguration configuration, IUnitOfWork uow)
{
    private readonly IConfiguration _configuration = configuration;
    private readonly IUnitOfWork _uow = uow;

    public async Task<List<HodRecord>> GetHodsAsync(
        CancellationToken cancellationToken = default)
    {
        var cmplHods = await (Constants.IsSqlite(_configuration)
            ? Task.FromResult(GetHodsFromCsv())
            : GetHodsFromDatabaseAsync(cancellationToken));

        var localHods = (await _uow.Users
                .FindAsync(x => x.UserRole == UserRole.Hod, cancellationToken))
            .ToDictionary(u => u.UserId);

        var result = cmplHods
            .Select(h => LocalizeHod(h, localHods.TryGetValue(h.UserId, out var local) ? local : null))
            .ToList();

        foreach (var local in localHods.Values)
        {
            if (result.Any(x => x.UserId == local.UserId))
                continue;

            result.Add(new HodRecord
            {
                UserId = local.UserId,
                EmployeeId = string.Empty,
                Name = string.Empty,
                Email = string.Empty,
                PhoneNumber = string.Empty,
                DeptId = null,
                IsDepartmentHod = true,
                UserRole = local.UserRole ?? UserRole.Hod,
                Location = local.Location ?? string.Empty
            });
        }

        return result;
    }

    public async Task<HodRecord?> GetHodByIdAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var localUser = await _uow.Users
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        var cmplHod = Constants.IsSqlite(_configuration)
            ? GetHodFromCsv(userId)
            : await GetHodFromDatabaseAsync(userId, cancellationToken);

        if (cmplHod is null && localUser is null)
            return null;

        var hod = cmplHod ?? new HodRecord
        {
            UserId = userId,
            EmployeeId = string.Empty,
            Name = string.Empty,
            Email = string.Empty,
            PhoneNumber = string.Empty,
            DeptId = null,
            IsDepartmentHod = localUser?.UserRole == UserRole.Hod,
            UserRole = localUser?.UserRole ?? UserRole.User,
            Location = localUser?.Location ?? string.Empty
        };

        return LocalizeHod(hod, localUser);
    }

    public async Task<HodRecord> CreateHodAsync(
        HodCreateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var localUser = await _uow.Users
            .FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);

        if (localUser is null)
        {
            localUser = Users.Create(
                request.UserId,
                request.UserRole,
                request.Location.Trim(),
                "system");

            await _uow.Users.AddAsync(localUser, cancellationToken);
        }
        else
        {
            localUser.UserRole = request.UserRole;
            localUser.Location = request.Location.Trim();
            _uow.Users.Update(localUser);
        }

        await _uow.SaveChangesAsync(cancellationToken);
        return await GetHodByIdAsync(request.UserId, cancellationToken)
            ?? throw new InvalidOperationException("Failed to create HOD record.");
    }

    public async Task<HodRecord?> UpdateHodAsync(
        int userId,
        HodUpdateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var localUser = await _uow.Users
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (localUser is null)
            return null;

        if (request.UserRole.HasValue)
            localUser.UserRole = request.UserRole.Value;

        localUser.Location = request.Location.Trim();

        _uow.Users.Update(localUser);
        await _uow.SaveChangesAsync(cancellationToken);

        return await GetHodByIdAsync(userId, cancellationToken);
    }

    public async Task<bool> DeleteHodAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var localUser = await _uow.Users
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (localUser is null)
            return false;

        var assignedDepartments = await _uow.Departments.FindAsync(
            x => x.HodId == userId,
            cancellationToken);

        foreach (var department in assignedDepartments)
        {
            department.HodId = null;
        }

        if (assignedDepartments.Any())
            _uow.Departments.UpdateRange(assignedDepartments);

        if (localUser.UserRole == UserRole.Hod)
        {
            localUser.UserRole = UserRole.User;
            _uow.Users.Update(localUser);
        }

        await _uow.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<HodRecord?> ValidateHodAsync(
        CmplUserRecord cmplUser,
        CancellationToken cancellationToken)
    {
        var hod = Constants.IsSqlite(_configuration)
            ? ValidateHodFromCsv(cmplUser)
            : await ValidateHodFromDatabaseAsync(cmplUser, cancellationToken);

        if (hod is null)
            return null;

        var localUser = await _uow.Users
            .FirstOrDefaultAsync(x => x.UserId == hod.UserId, cancellationToken);

        return LocalizeHod(hod, localUser);
    }

    private async Task<List<HodRecord>> GetHodsFromDatabaseAsync(
        CancellationToken cancellationToken)
    {
        var connectionString =
            _configuration["Database:MySqlConnectionString_Cmpl"];

        return (await _uow.Dapper.QueryAsync<HodRecord>(
            Queries.GetHodData,
            null,
            connectionString,
            null,
            cancellationToken)).ToList();
    }

    private static HodRecord LocalizeHod(
        HodRecord hod,
        Users? localUser)
    {
        return hod with
        {
            UserRole = localUser?.UserRole ?? hod.UserRole,
            Location = localUser?.Location ?? hod.Location,
            IsDepartmentHod = hod.IsDepartmentHod || localUser?.UserRole == UserRole.Hod
        };
    }

    private async Task<HodRecord?> GetHodFromDatabaseAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var hods = await GetHodsFromDatabaseAsync(cancellationToken);
        return hods.FirstOrDefault(x => x.UserId == userId);
    }

    private HodRecord? GetHodFromCsv(int userId)
    {
        return GetHodsFromCsv().FirstOrDefault(x => x.UserId == userId);
    }

    private static HodRecord? ValidateHodFromCsv(
        CmplUserRecord cmplUser)
    {
        var csvFilePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "Infrastructure",
            "Persistence",
            "Hoddata_SQL.csv");

        if (!File.Exists(csvFilePath))
            return null;

        try
        {
            using var reader = new StreamReader(csvFilePath);
            reader.ReadLine();
            var hods = new List<HodRecord>();

            while (reader.ReadLine() is { } line)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var columns = line.Split(',');
                if (columns.Length < 9)
                    continue;

                var deleted = columns[1].Trim();
                if (deleted == "1")
                    continue;

                int.TryParse(columns[8].Trim(), out var userId);

                hods.Add(new HodRecord
                {
                    UserId = userId,
                    EmployeeId = columns[4].Trim(),
                    Name = columns[0].Trim(),
                    Email = columns[6].Trim(),
                    PhoneNumber = columns[7].Trim(),
                    IsDepartmentHod = true
                });
            }

            return MatchHod(hods, cmplUser);
        }
        catch
        {
            return null;
        }
    }

    private async Task<HodRecord?> ValidateHodFromDatabaseAsync(
        CmplUserRecord cmplUser,
        CancellationToken cancellationToken)
    {
        var hods = await GetHodsFromDatabaseAsync(cancellationToken);
        return MatchHod(hods, cmplUser);
    }

    private List<HodRecord> GetHodsFromCsv()
    {
        var csvFilePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "Infrastructure",
            "Persistence",
            "Hoddata_SQL.csv");

        if (!File.Exists(csvFilePath))
            return new List<HodRecord>();

        try
        {
            using var reader = new StreamReader(csvFilePath);
            reader.ReadLine();
            var hods = new List<HodRecord>();

            while (reader.ReadLine() is { } line)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var columns = line.Split(',');
                if (columns.Length < 9)
                    continue;

                var deleted = columns[1].Trim();
                if (deleted == "1")
                    continue;

                int.TryParse(columns[8].Trim(), out var userId);

                hods.Add(new HodRecord
                {
                    UserId = userId,
                    EmployeeId = columns[4].Trim(),
                    Name = columns[0].Trim(),
                    Email = columns[6].Trim(),
                    PhoneNumber = columns[7].Trim(),
                    IsDepartmentHod = true
                });
            }

            return hods;
        }
        catch
        {
            return new List<HodRecord>();
        }
    }

    private static HodRecord? MatchHod(
        IEnumerable<HodRecord> hods,
        CmplUserRecord cmplUser)
    {
        var matchedHod = hods.FirstOrDefault(h =>
            (!string.IsNullOrWhiteSpace(h.EmployeeId) &&
             !string.IsNullOrWhiteSpace(cmplUser.EmployeeId) &&
             string.Equals(
                 h.EmployeeId.Trim(),
                 cmplUser.EmployeeId.Trim(),
                 StringComparison.OrdinalIgnoreCase))
            ||
            (!string.IsNullOrWhiteSpace(h.Email) &&
             !string.IsNullOrWhiteSpace(cmplUser.Email) &&
             string.Equals(
                 h.Email.Trim(),
                 cmplUser.Email.Trim(),
                 StringComparison.OrdinalIgnoreCase))
            ||
            (!string.IsNullOrWhiteSpace(h.PhoneNumber) &&
             cmplUser.Mobile > 0 &&
             string.Equals(
                 h.PhoneNumber.Trim(),
                 cmplUser.Mobile.ToString(),
                 StringComparison.OrdinalIgnoreCase)));

        if (matchedHod is null)
            return null;

        return matchedHod with
        {
            IsDepartmentHod = true
        };
    }
}
