namespace Web.Domain.Common;

/// <summary>
/// Base entity with primary key and soft-delete support.
/// All domain entities derive from this — ensures consistent identity and lifecycle management.
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; protected set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }
    public string? DeletedBy { get; private set; }
    public void SoftDelete(string deletedBy)
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        DeletedBy = deletedBy;
    }
}
