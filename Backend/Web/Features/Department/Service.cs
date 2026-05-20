using System.IO;
using Shared.Helpers;
using Web.Features.Hod;
using Web.Infrastructure.Repositories;
using Web.Shared.Helpers;

namespace Web.Features.Department;

public class DepartmentService(
    IConfiguration configuration,
    IUnitOfWork uow,
    HodService hodService,
    ILogger<DepartmentService> logger)
{
    private readonly IConfiguration _configuration = configuration;
    private readonly IUnitOfWork _uow = uow;
    private readonly HodService _hodService = hodService;
    private readonly ILogger<DepartmentService> _logger = logger;

    public async Task<List<DepartmentRecord>> GetDepartmentsAsync(
        CancellationToken cancellationToken = default)
    {
        // First check local DB
        var localDepartments = await _uow.Departments
            .GetAllAsync(cancellationToken);

        if (localDepartments.Any())
        {
            var hodCache = (await _hodService.GetHodsAsync(cancellationToken))
                .ToDictionary(x => x.UserId, x => x);

            return localDepartments
                .Select(x => new DepartmentRecord
                {
                    DeptId = x.DeptId,
                    DeptName = x.DepartmentName ?? string.Empty,
                    HodUserId = x.HodId,
                    Hod = x.HodId.HasValue &&
                          hodCache.TryGetValue(x.HodId.Value, out var hod)
                        ? hod
                        : null
                })
                .OrderBy(x => x.DeptId)
                .ToList();
        }

        List<DepartmentRecord> departments;

        // SQLITE
        if (Constants.IsSqlite(_configuration))
        {
            departments = GetDepartmentsFromCsv();

            // Store only DeptId in local DB
            foreach (var dept in departments)
            {
                var exists = await _uow.Departments
                    .FirstOrDefaultAsync(
                        x => x.DeptId == dept.DeptId,
                        cancellationToken);

                if (exists is not null)
                    continue;

                var departmentEntity = Domain.Entities.Department.Create(
                    dept.DeptId,
                    string.Empty,
                    "system");

                departmentEntity.HodId = null;

                await _uow.Departments.AddAsync(
                    departmentEntity,
                    cancellationToken);
            }

            await _uow.SaveChangesAsync(cancellationToken);

            return departments;
        }

        // MYSQL
        var connectionString =
            _configuration["Database:MySqlConnectionString_Cmpl"];

        departments = (await _uow.Dapper.QueryAsync<DepartmentRecord>(
            Queries.GetDepartmentIdQuery,
            null,
            connectionString,
            null,
            cancellationToken)).ToList();

        // Store in local DB
        foreach (var dept in departments)
        {
            var exists = await _uow.Departments
                .FirstOrDefaultAsync(
                    x => x.DeptId == dept.DeptId,
                    cancellationToken);

            if (exists is not null)
                continue;

            var departmentEntity = Domain.Entities.Department.Create(
                dept.DeptId,
                dept.DeptName ?? string.Empty,
                "system");

            departmentEntity.HodId = dept.HodUserId;

            await _uow.Departments.AddAsync(
                departmentEntity,
                cancellationToken);
        }

        await _uow.SaveChangesAsync(cancellationToken);

        return departments;
    }

    public async Task<DepartmentRecord?> GetDepartmentByIdAsync(
        int deptId,
        CancellationToken cancellationToken)
    {
        var localDept = await _uow.Departments
            .FirstOrDefaultAsync(
                x => x.DeptId == deptId,
                cancellationToken);

        if (localDept is not null)
        {
            return new DepartmentRecord
            {
                DeptId = localDept.DeptId,
                DeptName = localDept.DepartmentName ?? string.Empty,
                HodUserId = localDept.HodId,
                Hod = await GetHodAsync(
                    localDept.HodId,
                    cancellationToken)
            };
        }

        var departments = await GetDepartmentsAsync(cancellationToken);

        return departments.FirstOrDefault(x => x.DeptId == deptId);
    }

    public async Task<DepartmentRecord?> GetDepartmentByHodUserIdAsync(
        int hodUserId,
        CancellationToken cancellationToken)
    {
        var localDept = await _uow.Departments
            .FirstOrDefaultAsync(
                x => x.HodId == hodUserId,
                cancellationToken);

        if (localDept is not null)
        {
            return new DepartmentRecord
            {
                DeptId = localDept.DeptId,
                DeptName = localDept.DepartmentName ?? string.Empty,
                HodUserId = localDept.HodId,
                Hod = await GetHodAsync(
                    localDept.HodId,
                    cancellationToken)
            };
        }

        var departments = await GetDepartmentsAsync(cancellationToken);

        return departments.FirstOrDefault(x => x.HodUserId == hodUserId);
    }

    public async Task<DepartmentRecord> CreateDepartmentAsync(
        DepartmentCreateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        ArgumentException.ThrowIfNullOrWhiteSpace(
            request.DeptName);

        if (request.HodUserId.HasValue)
        {
            var hod = await _hodService.GetHodByIdAsync(
                request.HodUserId.Value,
                cancellationToken);

            if (hod is null)
            {
                throw new InvalidOperationException(
                    $"HOD with user ID {request.HodUserId.Value} was not found.");
            }
        }

        var entity = Domain.Entities.Department.Create(
            request.DeptId ?? 0,
            request.DeptName.Trim(),
            "system");

        entity.HodId = request.HodUserId;

        await _uow.Departments.AddAsync(
            entity,
            cancellationToken);

        await _uow.SaveChangesAsync(cancellationToken);

        return new DepartmentRecord
        {
            DeptId = entity.DeptId,
            DeptName = entity.DepartmentName ?? string.Empty,
            HodUserId = entity.HodId,
            Hod = await GetHodAsync(
                entity.HodId,
                cancellationToken)
        };
    }

    public async Task<DepartmentRecord> UpdateDepartmentAsync(
        int deptId,
        DepartmentUpdateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        ArgumentException.ThrowIfNullOrWhiteSpace(
            request.DeptName);

        ArgumentException.ThrowIfNullOrWhiteSpace(
            request.DepartmentCode);

        var entity = await _uow.Departments
            .FirstOrDefaultAsync(
                x => x.DeptId == deptId,
                cancellationToken);

        if (entity is null)
        {
            throw new KeyNotFoundException(
                $"Department with ID {deptId} was not found.");
        }

        if (request.HodUserId.HasValue)
        {
            var hod = await _hodService.GetHodByIdAsync(
                request.HodUserId.Value,
                cancellationToken);

            if (hod is null)
            {
                throw new InvalidOperationException(
                    $"HOD with user ID {request.HodUserId.Value} was not found.");
            }
        }

        entity.DepartmentName = request.DeptName.Trim();
        entity.HodId = request.HodUserId;

        _uow.Departments.Update(entity);

        await _uow.SaveChangesAsync(cancellationToken);

        return new DepartmentRecord
        {
            DeptId = entity.DeptId,
            DeptName = entity.DepartmentName,
            HodUserId = entity.HodId,
            Hod = await GetHodAsync(
                entity.HodId,
                cancellationToken)
        };
    }

    public async Task<bool> DeleteDepartmentAsync(
        int deptId,
        CancellationToken cancellationToken)
    {
        var entity = await _uow.Departments
            .FirstOrDefaultAsync(
                x => x.DeptId == deptId,
                cancellationToken);

        if (entity is null)
            return false;

        _uow.Departments.Delete(entity);

        await _uow.SaveChangesAsync(cancellationToken);

        return true;
    }

    private async Task<HodRecord?> GetHodAsync(
        int? hodUserId,
        CancellationToken cancellationToken)
    {
        return hodUserId.HasValue
            ? await _hodService.GetHodByIdAsync(
                hodUserId.Value,
                cancellationToken)
            : null;
    }

    private List<DepartmentRecord> GetDepartmentsFromCsv()
    {
        var csvFilePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "Infrastructure",
            "Persistence",
            "Userdata_SQL.csv");

        if (!File.Exists(csvFilePath))
        {
            _logger.LogError(
                "CSV file not found at path: {Path}",
                csvFilePath);

            return [];
        }

        try
        {
            using var reader = new StreamReader(csvFilePath);

            // Skip header
            reader.ReadLine();

            var departmentIds = new HashSet<int>();

            while (reader.ReadLine() is { } line)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var columns = line.Split(',');

                // DEPT_ID = column index 10
                if (columns.Length <= 10)
                    continue;

                var deptValue = columns[10].Trim();

                if (int.TryParse(deptValue, out var deptId))
                {
                    departmentIds.Add(deptId);
                }
            }

            return departmentIds
                .Select(x => new DepartmentRecord
                {
                    DeptId = x,
                    DeptName = string.Empty,
                    HodUserId = null,
                    Hod = null
                })
                .OrderBy(x => x.DeptId)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error reading department CSV file.");

            return [];
        }
    }
}