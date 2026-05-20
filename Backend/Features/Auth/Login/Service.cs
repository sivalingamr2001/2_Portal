using System.IO;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Repositories;
using Web.Shared.Helpers;

namespace Web.Features.Auth.Login;

public sealed class LoginService(IUnitOfWork uow, ILogger<LoginService> logger, IConfiguration configuration)
{
    private readonly IUnitOfWork _uow = uow;
    private readonly ILogger<LoginService> _logger = logger;
    private readonly IConfiguration _configuration = configuration;

    public async Task<LoginResponse?> AuthenticateAsync(LoginRequest request, CancellationToken ct)
    {
        var identifier = request.Identifier?.Trim();
        if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(request.Password))
        {
            _logger.LogWarning("Login attempt with empty identifier or password.");
            return null;
        }

        var isSqlite = _configuration["Database:Provider"]?.Trim().ToLowerInvariant() == "sqlite";
        CmplUserRecord? cmplUser = null;

        if (!isSqlite)
        {
            cmplUser = await GetCmplUserLoginAsync(identifier, request.Password, ct);
            if (cmplUser == null)
            {
                _logger.LogWarning("CMPL authentication failed for identifier: {Identifier}", identifier);
                return null;
            }
        }
        else
        {
            _logger.LogInformation("SQLite provider detected. Skipping CMPL authentication and using local user store for identifier: {Identifier}", identifier);

            var csvFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Userdata_SQL.csv");
            if (!File.Exists(csvFilePath))
            {
                _logger.LogError("CSV file for SQLite user data not found at path: {CsvFilePath}", csvFilePath);
                return null;
            }

            // Read and parse CSV file line-by-line to validate credentials
            cmplUser = ValidateUserFromCsv(csvFilePath, identifier, request.Password);
            if (cmplUser == null)
            {
                _logger.LogWarning("CSV mock authentication failed for identifier: {Identifier}", identifier);
                return null;
            }
        }

        // 2. Query local database using distinct primary key UserId checking constraints
        var localUser = await _uow.Users.FirstOrDefaultAsync(u => u.UserId == cmplUser.UserId, ct);

        // 3. Just-In-Time synchronization managed via Unit of Work transaction wrapper
        if (localUser == null)
        {
            _logger.LogInformation("Local user record not found. Synchronizing CMPL user ID: {UserId}", cmplUser.UserId);

            await _uow.BeginTransactionAsync(ct);

            try
            {
                localUser = Users.Create(
                    userId: cmplUser.UserId,
                    role: UserRole.User,
                    location: string.Empty,
                    createdBy: "system"
                );

                await _uow.Users.AddAsync(localUser, ct);
                await _uow.SaveChangesAsync(ct);

                await _uow.CommitTransactionAsync(ct);
                _logger.LogInformation("Successfully synchronized and committed user ID: {UserId}", cmplUser.UserId);
            }
            catch (Exception ex)
            {
                await _uow.RollbackTransactionAsync(ct);
                _logger.LogError(ex, "Failed to synchronize user ID: {UserId}. Changes rolled back.", cmplUser.UserId);
                throw;
            }
        }

        // 4. Consolidate and compile verified dataset profile back as a single response object
        return new LoginResponse
        {
            UserId = localUser.UserId,
            UserName = cmplUser.UserName,
            Email = cmplUser.Email,
            Mobile = cmplUser.Mobile,
            DeptId = cmplUser.DeptId,
            UserRole = localUser.UserRole ?? UserRole.User,
            Location = localUser.Location ?? string.Empty
        };
    }

    /// <summary>
    /// Stream-reads the CSV backup file to safely isolate, match, and extract target credentials.
    /// Matches identity expressions against: UserId, Email, EmployeeId, or Username fields.
    /// </summary>
    private CmplUserRecord? ValidateUserFromCsv(string filePath, string identifier, string password)
    {
        try
        {
            using var reader = new StreamReader(filePath);
            string? headerLine = reader.ReadLine(); // Discard the first schema column layout header line

            if (string.IsNullOrWhiteSpace(headerLine)) return null;

            while (reader.ReadLine() is { } line)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                // Split safely by standard comma parameters
                var columns = line.Split(',');
                if (columns.Length < 6) continue;

                // Index maps matching standard table structure: 
                // 0: UserId, 1: EmployeeId, 2: UserName, 3: Email, 4: Mobile, 5: DeptId, 6: Password
                var csvUserId = columns[0].Trim();
                var csvEmployeeId = columns[1].Trim();
                var csvUserName = columns[2].Trim();
                var csvEmail = columns[3].Trim();
                var csvMobile = columns[4].Trim();
                var csvDeptId = columns[5].Trim();

                // Safety boundary constraint fallback mapping for trailing password data fields
                var csvPassword = columns.Length > 6 ? columns[6].Trim() : string.Empty;

                bool isMatch = string.Equals(csvUserId, identifier, StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(csvEmail, identifier, StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(csvEmployeeId, identifier, StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(csvUserName, identifier, StringComparison.OrdinalIgnoreCase);

                if (isMatch && string.Equals(csvPassword, password, StringComparison.Ordinal))
                {
                    _logger.LogInformation("Match located within CSV lookup dataset for token identifier: {Identifier}", identifier);

                    int.TryParse(csvUserId, out int uId);
                    long.TryParse(csvMobile, out long mob);
                    int.TryParse(csvDeptId, out int dId);

                    return new CmplUserRecord
                    {
                        UserId = uId,
                        EmployeeId = csvEmployeeId,
                        UserName = csvUserName,
                        Email = csvEmail,
                        Mobile = mob,
                        DeptId = dId
                    };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading or evaluating records from mock user data CSV file.");
        }

        return null;
    }

    private async Task<CmplUserRecord?> GetCmplUserLoginAsync(string identifier, string password, CancellationToken ct)
    {
        var parameters = new { id = identifier, pwd = password };
        var connectionString = _configuration["Database:MySqlConnectionString_Cmpl"];

        return await _uow.Dapper.QuerySingleOrDefaultAsync<CmplUserRecord>(
            Queries.CmplLoginUserQuery,
            parameters,
            connectionString,
            null,
            ct);
    }
}
