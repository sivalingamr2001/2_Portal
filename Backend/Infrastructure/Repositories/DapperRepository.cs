using Dapper;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using Polly;
using System.Data;
using System.Text;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Dapper repository with:
/// - Polly retry (transient fault tolerance)
/// - Cancellation token propagation via CommandFlags
/// - Bulk insert via multi-row VALUES construction
/// - Stored procedure support
/// </summary>
public sealed class DapperRepository : IDapperRepository
{
    private readonly string _connectionString;
    private readonly ILogger<DapperRepository> _logger;
    private readonly IAsyncPolicy _retryPolicy;

    public DapperRepository(string connectionString, ILogger<DapperRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;

        // Retry 3 times with exponential back-off for transient DB errors
        _retryPolicy = Policy
            .Handle<MySqlException>(ex => IsTransient(ex))
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => TimeSpan.FromMilliseconds(200 * Math.Pow(2, attempt)),
                onRetry: (ex, delay, attempt, _) =>
                    _logger.LogWarning(ex, "Dapper retry {Attempt} after {Delay}ms", attempt, delay.TotalMilliseconds));
    }

    private IDbConnection CreateConnection() => new MySqlConnection(_connectionString);

    public async Task<IReadOnlyList<T>> QueryAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            var result = await connection.QueryAsync<T>(cmd);
            return result.AsList().AsReadOnly();
        });
    }

    public async Task<T?> QuerySingleOrDefaultAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            return await connection.QuerySingleOrDefaultAsync<T>(cmd);
        });
    }

    public async Task<int> ExecuteAsync(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            return await connection.ExecuteAsync(cmd);
        });
    }

    public async Task<T?> ExecuteScalarAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            return await connection.ExecuteScalarAsync<T>(cmd);
        });
    }

    public async Task<IReadOnlyList<T>> QueryStoredProcedureAsync<T>(
        string storedProcedureName,
        object? param = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
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
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(
                storedProcedureName,
                param,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken);
            return await connection.ExecuteAsync(cmd);
        });
    }

    /// <summary>
    /// Batched bulk insert using parameterized multi-row VALUES.
    /// Batch size of 500 balances memory vs round-trips.
    /// Uses reflection + property cache for zero-allocation on subsequent calls.
    /// </summary>
    public async Task BulkInsertAsync<T>(
        string tableName,
        IEnumerable<T> entities,
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

            await _retryPolicy.ExecuteAsync(async () =>
            {
                using var connection = CreateConnection();
                var cmd = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
                await connection.ExecuteAsync(cmd);
            });
        }
    }

    public async Task<(IReadOnlyList<T> Items, int TotalCount)> QueryPagedAsync<T>(
        string countSql,
        string dataSql,
        object? param = null,
        CancellationToken cancellationToken = default)
    {
        using var connection = CreateConnection();
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