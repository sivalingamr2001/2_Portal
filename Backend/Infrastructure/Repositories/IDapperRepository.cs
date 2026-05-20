using System.Data;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Dapper contract for high-performance raw SQL reads.
/// Intentionally separate from EF repo — keeps responsibility boundaries clear.
/// </summary>
public interface IDapperRepository
{
    Task<IReadOnlyList<T>> QueryAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default);

    Task<T?> QuerySingleOrDefaultAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default);

    Task<int> ExecuteAsync(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default);

    Task<T?> ExecuteScalarAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<T>> QueryStoredProcedureAsync<T>(
        string storedProcedureName,
        object? param = null,
        CancellationToken cancellationToken = default);

    Task<int> ExecuteStoredProcedureAsync(
        string storedProcedureName,
        object? param = null,
        CancellationToken cancellationToken = default);

    Task BulkInsertAsync<T>(string tableName, IEnumerable<T> entities, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<T> Items, int TotalCount)> QueryPagedAsync<T>(
        string countSql,
        string dataSql,
        object? param = null,
        CancellationToken cancellationToken = default);
}