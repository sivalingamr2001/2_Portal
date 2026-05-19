using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository;

public abstract class GenericRepository<TDomain, TEntity, TId>(AppDbContext context) : IGenericRepository<TDomain, TId>
    where TDomain : AggregateRoot<TId>
    where TEntity : class
{
    protected readonly AppDbContext _context = context;
    protected readonly DbSet<TEntity> DbSetConfig = context.Set<TEntity>();

    public virtual async Task<TDomain?> GetByIdAsync(TId id, CancellationToken cancellationToken = default)
    {
        // Find the EF entity using the provided key
        var entity = await DbSetConfig.FindAsync([id!], cancellationToken);

        return entity is null ? null : MapToDomain(entity);
    }

    public virtual async Task<IReadOnlyList<TDomain>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // AsNoTracking optimizes performance for read-only enterprise queries
        var entities = await DbSetConfig.AsNoTracking().ToListAsync(cancellationToken);

        return entities.Select(MapToDomain).ToList();
    }

    public virtual async Task AddAsync(TDomain domain, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(domain);

        var entity = MapToEntity(domain);
        await DbSetConfig.AddAsync(entity, cancellationToken);
    }

    public virtual void Update(TDomain domain)
    {
        ArgumentNullException.ThrowIfNull(domain);

        var entity = MapToEntity(domain);
        DbSetConfig.Update(entity);
    }

    public virtual void Delete(TDomain domain)
    {
        ArgumentNullException.ThrowIfNull(domain);

        var entity = MapToEntity(domain);
        DbSetConfig.Remove(entity);
    }

    protected abstract TDomain MapToDomain(TEntity entity);
    protected abstract TEntity MapToEntity(TDomain domain);
}
