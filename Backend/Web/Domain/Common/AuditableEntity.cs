namespace Web.Domain.Common;

/// <summary>
/// Extends BaseEntity with full audit trail (created/modified).
/// EF Core interceptor or SaveChanges override stamps these automatically.
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? ModifiedAt { get; set; }
    public string? ModifiedBy { get; set; }
}
