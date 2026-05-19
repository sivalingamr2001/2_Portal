namespace Domain.Entities
{
    public abstract class BaseAuditableEntity : BaseEntity
    {
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public string CreatedBy { get; set; } = "system";
        public string? UpdatedBy { get; set; }
    }
}
