using System.Data;
using Web.Domain.Entities;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Unit of Work coordinates multiple repository operations in a single atomic transaction.
/// Single SaveChangesAsync call commits everything — no partial saves.
/// </summary>
public interface IUnitOfWork : IAsyncDisposable
{
    IRepository<Users> Users { get; }
    IRepository<Department> Departments { get; }
    IRepository<AccessRequest> AccessRequests { get; }
    IRepository<AccessApproval> AccessApprovals { get; }
    IRepository<AccessDetail> AccessDetails { get; }
    IRepository<AuditLog> AuditLogs { get; }
    IDapperRepository Dapper { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    bool HasActiveTransaction { get; }
}
