using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;

namespace Web.Domain.Entities;

[Table("jan_departments")]
public sealed class Department : AuditableEntity
{
    [Required]
    [Column("dept_name")]
    public string DepartmentName { get; set; } = string.Empty;

    [Required]
    [Column("hod_id")]
    public int HodId { get; set; }

    public ICollection<Employee> Employees { get; private set; } = [];

    private Department() { }

    public static Department Create(string code, string name, string createdBy)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(code);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        return new Department
        {
            DepartmentCode = code.Trim().ToUpperInvariant(),
            Name = name.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }

    public void Rename(string name, string modifiedBy)
    {
        Name = name.Trim();
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = modifiedBy;
    }
}
