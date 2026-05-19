namespace Domain.Interfaces.Repositories;

// Base domain model constraint
public abstract class AggregateRoot<TId>
{
    public TId Id { get; protected set; } = default!;
}

public interface IGenericRepository<TDomain, TId> where TDomain : AggregateRoot<TId>
{
    Task<TDomain?> GetByIdAsync(TId id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TDomain>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(TDomain domain, CancellationToken cancellationToken = default);
    void Update(TDomain domain);
    void Delete(TDomain domain);
}
