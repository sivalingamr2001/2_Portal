using Microsoft.EntityFrameworkCore.Storage;
using Web.Domain.Entities;
using Web.Infrastructure.Persistence;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Concrete UoW. Lazily initialises repositories — avoids object creation overhead
/// for features that only use a subset of repos.
/// Transaction management wraps EF Core's IDbContextTransaction.
/// </summary>
public sealed class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UnitOfWork> _logger;
    private readonly IDapperRepository _dapper;
    private IDbContextTransaction? _transaction;
    private bool _disposed;

    private IEFRepository<Users>? _users;
    private IEFRepository<Department>? _departments;
    private IEFRepository<AccessRequest>? _accessRequests;
    private IEFRepository<AccessApproval>? _accessApprovals;
    private IEFRepository<AccessDetail>? _accessDetails;
    private IEFRepository<AuditLog>? _auditLogs;
    private IEFRepository<FolderMapping>? _folderMappings;

    public UnitOfWork(
        ApplicationDbContext context,
        IDapperRepository dapper,
        ILogger<UnitOfWork> logger)
    {
        _context = context;
        _dapper = dapper;
        _logger = logger;
    }

    public IEFRepository<Users> Users => _users ??= new EfRepository<Users>(_context);
    public IEFRepository<Department> Departments => _departments ??= new EfRepository<Department>(_context);
    public IEFRepository<AccessRequest> AccessRequests => _accessRequests ??= new EfRepository<AccessRequest>(_context);
    public IEFRepository<AccessApproval> AccessApprovals => _accessApprovals ??= new EfRepository<AccessApproval>(_context);
    public IEFRepository<AccessDetail> AccessDetails => _accessDetails ??= new EfRepository<AccessDetail>(_context);
    public IEFRepository<AuditLog> AuditLogs => _auditLogs ??= new EfRepository<AuditLog>(_context);
    public IEFRepository<FolderMapping> FolderMappings => _folderMappings ??= new EfRepository<FolderMapping>(_context);
    public IDapperRepository Dapper => _dapper;
    public bool HasActiveTransaction => _transaction is not null;

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SaveChangesAsync failed.");
            throw;
        }
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is not null)
            throw new InvalidOperationException("A transaction is already in progress.");

        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        _logger.LogDebug("Database transaction begun: {TransactionId}", _transaction.TransactionId);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null)
            throw new InvalidOperationException("No active transaction to commit.");

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            await _transaction.CommitAsync(cancellationToken);
            _logger.LogDebug("Transaction committed: {TransactionId}", _transaction.TransactionId);
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null) return;

        try
        {
            await _transaction.RollbackAsync(cancellationToken);
            _logger.LogWarning("Transaction rolled back: {TransactionId}", _transaction.TransactionId);
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;

        if (_transaction is not null)
            await _transaction.DisposeAsync();

        await _context.DisposeAsync();
        _disposed = true;
        GC.SuppressFinalize(this);
    }
}
