using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Web.Domain.Common;
using Web.Infrastructure.Persistence;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Generic EF Core repository implementation.
/// Employs defensive try/catch blocks to delegate failures to the Unit of Work.
/// </summary>
public class EfRepository<T>(ApplicationDbContext context) : IEFRepository<T> where T : BaseEntity
{
    protected readonly ApplicationDbContext _context = context;
    protected readonly DbSet<T> _dbSet = context.Set<T>();

    public async Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbSet.FindAsync([id], cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error retrieving {typeof(T).Name} by ID: {id}", ex);
        }
    }

    public async Task<T?> GetByIdWithIncludesAsync(
        int id,
        CancellationToken cancellationToken = default,
        params Expression<Func<T, object>>[] includes)
    {
        try
        {
            IQueryable<T> query = _dbSet.AsNoTracking();

            foreach (var include in includes)
                query = query.Include(include);

            return await query.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error retrieving {typeof(T).Name} with includes for ID: {id}", ex);
        }
    }

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbSet.AsNoTracking().ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error fetching all records for {typeof(T).Name}", ex);
        }
    }

    public async Task<IReadOnlyList<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbSet.AsNoTracking().Where(predicate).ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Query expression failed on {typeof(T).Name}", ex);
        }
    }

    public async Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbSet.AsNoTracking().FirstOrDefaultAsync(predicate, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error fetching default record match for {typeof(T).Name}", ex);
        }
    }

    public async Task<bool> ExistsAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbSet.AsNoTracking().AnyAsync(predicate, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error verifying existence for {typeof(T).Name}", ex);
        }
    }

    public async Task<int> CountAsync(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return predicate is null
                ? await _dbSet.AsNoTracking().CountAsync(cancellationToken)
                : await _dbSet.AsNoTracking().CountAsync(predicate, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error executing count metric for {typeof(T).Name}", ex);
        }
    }

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbSet.AddAsync(entity, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error staging new {typeof(T).Name} entry", ex);
        }
    }

    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbSet.AddRangeAsync(entities, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error staging batch entries for {typeof(T).Name}", ex);
        }
    }

    public void Update(T entity)
    {
        try
        {
            _dbSet.Update(entity);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error marking modifications on {typeof(T).Name}", ex);
        }
    }

    public void UpdateRange(IEnumerable<T> entities)
    {
        try
        {
            _dbSet.UpdateRange(entities);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error marking batch modifications on {typeof(T).Name}", ex);
        }
    }

    public void Delete(T entity)
    {
        try
        {
            _dbSet.Remove(entity);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error removing entry for {typeof(T).Name}", ex);
        }
    }

    public void DeleteRange(IEnumerable<T> entities)
    {
        try
        {
            _dbSet.RemoveRange(entities);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error removing batch entries for {typeof(T).Name}", ex);
        }
    }

    public void SoftDelete(T entity, string deletedBy)
    {
        try
        {
            entity.SoftDelete(deletedBy);
            _dbSet.Update(entity);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error flags executing soft-deletion on {typeof(T).Name}", ex);
        }
    }
}
