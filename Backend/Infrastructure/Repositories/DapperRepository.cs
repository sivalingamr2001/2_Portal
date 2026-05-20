using System.Data;
using Dapper;
using Microsoft.Data.Sqlite;
using MySqlConnector;
using Polly;
using Web.Shared.Helpers;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Dapper repository supporting dynamic multi-database connection overrides with:
/// - Polly retry logic (transient fault tolerance on MySQL channels)
/// - Safe structural fallback routing directly via ConnectionStrings helper
/// - Comprehensive cancellation token propagation parameters
/// </summary>
public sealed class DapperRepository : IDapperRepository
{
    private readonly ConnectionStrings _connectionStrings;
    private readonly ILogger<DapperRepository> _logger;
    private readonly IAsyncPolicy _mySqlRetryPolicy;

    public DapperRepository(ConnectionStrings connectionStrings, ILogger<DapperRepository> logger)
    {
        _connectionStrings = connectionStrings;
        _logger = logger;

        // Establish transient fault retry rule profiles for live MySQL database engine contexts
        _mySqlRetryPolicy = Policy
            .Handle<MySqlException>(ex => IsTransient(ex))
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => TimeSpan.FromMilliseconds(200 * Math.Pow(2, attempt)),
                onRetry: (ex, delay, attempt, _) =>
                    _logger.LogWarning(ex, "Dapper database execution retry {Attempt} after {Delay}ms", attempt, delay.TotalMilliseconds));
    }

    /// <summary>
    /// Helper resolver to dynamically produce the correct IDbConnection string engine footprint.
    /// Falls back to using ConnectionStrings.Default if an explicit override parameter isn't passed.
    /// </summary>
    private IDbConnection GetConnection(string? overrideConnectionString)
    {
        var targetConnectionString = !string.IsNullOrWhiteSpace(overrideConnectionString)
            ? overrideConnectionString
            : _connectionStrings.Default;

        var isSqlite = targetConnectionString.TrimStart().StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase);

        return isSqlite
            ? new SqliteConnection(targetConnectionString)
            : new MySqlConnection(targetConnectionString);
    }

    /// <summary>
    /// Executes an execution policy wrapper block targeting MySQL engine context errors safely.
    /// Skips active network routing delays entirely if the input string evaluates to an inline SQLite context.
    /// </summary>
    private async Task<TResult> ExecuteWithPolicyAsync<TResult>(string? connectionString, Func<Task<TResult>> operation)
    {
        var activeString = !string.IsNullOrWhiteSpace(connectionString) ? connectionString : _connectionStrings.Default;
        var isSqlite = activeString.TrimStart().StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase);

        if (isSqlite)
        {
            return await operation();
        }

        return await _mySqlRetryPolicy.ExecuteAsync(operation);
    }

    public async Task<IReadOnlyList<T>> QueryAsync<T>(
        string sql,
        object? param = null,
        string? connectionString = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await ExecuteWithPolicyAsync(connectionString, async () =>
        {
            using var connection = GetConnection(connectionString);
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            var result = await connection.QueryAsync<T>(cmd);
            return result.AsList().AsReadOnly();
        });
    }

    public async Task<T?> QuerySingleOrDefaultAsync<T>(
        string sql,
        object? param = null,
        string? connectionString = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await ExecuteWithPolicyAsync(connectionString, async () =>
        {
            using var connection = GetConnection(connectionString);
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            return await connection.QuerySingleOrDefaultAsync<T>(cmd);
        });
    }

    public async Task<int> ExecuteAsync(
        string sql,
        object? param = null,
        string? connectionString = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await ExecuteWithPolicyAsync(connectionString, async () =>
        {
            using var connection = GetConnection(connectionString);
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            return await connection.ExecuteAsync(cmd);
        });
    }

    public async Task<T?> ExecuteScalarAsync<T>(
        string sql,
        object? param = null,
        string? connectionString = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await ExecuteWithPolicyAsync(connectionString, async () =>
        {
            using var connection = GetConnection(connectionString);
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            return await connection.ExecuteScalarAsync<T>(cmd);
        });
    }

    public async Task<IReadOnlyList<T>> QueryStoredProcedureAsync<T>(
        string storedProcedureName,
        object? param = null,
        string? connectionString = null,
        CancellationToken cancellationToken = default)
    {
        return await ExecuteWithPolicyAsync(connectionString, async () =>
        {
            using var connection = GetConnection(connectionString);
            var cmd = new CommandDefinition(
                storedProcedureName,
                param,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken);
            var result = await connection.QueryAsync<T>(cmd);
            return result.AsList().AsReadOnly();
        });
    }

    public async Task<int> ExecuteStoredProcedureAsync(
        string storedProcedureName,
        object? param = null,
        string? connectionString = null,
        CancellationToken cancellationToken = default)
    {
        return await ExecuteWithPolicyAsync(connectionString, async () =>
        {
            using var connection = GetConnection(connectionString);
            var cmd = new CommandDefinition(
                storedProcedureName,
                param,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken);
            return await connection.ExecuteAsync(cmd);
        });
    }

    public async Task BulkInsertAsync<T>(
        string tableName,
        IEnumerable<T> entities,
        string? connectionString = null,
        CancellationToken cancellationToken = default)
    {
        const int batchSize = 500;
        var entityList = entities.ToList();
        if (!entityList.Any()) return;

        var properties = typeof(T).GetProperties()
            .Where(p => p.CanRead && p.Name != "Id")
            .ToArray();

        var columns = string.Join(", ", properties.Select(p => $"`{p.Name}`"));

        foreach (var batch in entityList.Chunk(batchSize))
        {
            var parameters = new DynamicParameters();
            var valueRows = new List<string>();

            for (int i = 0; i < batch.Length; i++)
            {
                var rowParams = properties.Select(p =>
                {
                    var paramName = $"@p_{i}_{p.Name}";
                    parameters.Add(paramName, p.GetValue(batch[i]));
                    return paramName;
                });
                valueRows.Add($"({string.Join(", ", rowParams)})");
            }

            var sql = $"INSERT INTO `{tableName}` ({columns}) VALUES {string.Join(", ", valueRows)}";

            await ExecuteWithPolicyAsync(connectionString, async () =>
            {
                using var connection = GetConnection(connectionString);
                var cmd = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
                await connection.ExecuteAsync(cmd);
                return true;
            });
        }
    }

    public async Task<(IReadOnlyList<T> Items, int TotalCount)> QueryPagedAsync<T>(
        string countSql,
        string dataSql,
        object? param = null,
        string? connectionString = null,
        CancellationToken cancellationToken = default)
    {
        using var connection = GetConnection(connectionString);
        connection.Open();

        var countCmd = new CommandDefinition(countSql, param, cancellationToken: cancellationToken);
        var dataCmd = new CommandDefinition(dataSql, param, cancellationToken: cancellationToken);

        var totalCount = await connection.ExecuteScalarAsync<int>(countCmd);
        var items = await connection.QueryAsync<T>(dataCmd);

        return (items.AsList().AsReadOnly(), totalCount);
    }

    private static bool IsTransient(MySqlException ex)
        => ex.ErrorCode is MySqlErrorCode.LockDeadlock
            or MySqlErrorCode.LockWaitTimeout
            or MySqlErrorCode.UnableToConnectToHost;
}
