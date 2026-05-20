using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Web.Domain.Common;
using Web.Domain.Entities;

namespace Web.Infrastructure.Persistence;

/// <summary>
/// Central EF Core DbContext.
/// IEntityTypeConfiguration classes handle mapping — keeps DbContext clean of fluent API noise.
/// Global query filter on IsDeleted ensures soft-deleted records are invisible everywhere.
/// </summary>
public sealed class ApplicationDbContext : DbContext
{
    private readonly ICurrentUserService _currentUser;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUser)
        : base(options)
    {
        _currentUser = currentUser;
    }

    public DbSet<Users> Users => Set<Users>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<AccessRequest> AccessRequests => Set<AccessRequest>();
    public DbSet<AccessApproval> AccessApprovals => Set<AccessApproval>();
    public DbSet<AccessDetail> AccessDetails => Set<AccessDetail>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(ConvertFilterExpression(entityType.ClrType));
            }
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void StampAuditFields()
    {
        var entries = ChangeTracker.Entries<AuditableEntity>().ToList();
        if (entries.Count == 0) return;

        var now = DateTime.UtcNow;
        var user = _currentUser.UserId ?? "system";

        for (var i = 0; i < entries.Count; i++)
        {
            var entry = entries[i];

            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.CreatedBy = user;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.ModifiedAt = now;
                entry.Entity.ModifiedBy = user;
            }
        }
    }

    // Helper to generate the lambda expression for the global soft delete filter
    private static System.Linq.Expressions.LambdaExpression ConvertFilterExpression(Type type)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(type, "e");
        var property = System.Linq.Expressions.Expression.Property(parameter, nameof(ISoftDelete.IsDeleted));
        var falseConstant = System.Linq.Expressions.Expression.Constant(false);
        var comparison = System.Linq.Expressions.Expression.Equal(property, falseConstant);

        return System.Linq.Expressions.Expression.Lambda(comparison, parameter);
    }
}

public interface ICurrentUserService
{
    string? UserId { get; }
}

public interface ISoftDelete
{
    bool IsDeleted { get; set; }
}
