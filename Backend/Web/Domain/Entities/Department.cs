using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;

namespace Web.Domain.Entities;

[Table("jan_portal_departments")]
public sealed class Department : AuditableEntity
{
    [Column("dept_id")]
    public int DeptId { get; set; }

    [Column("department_name")]
    public string? DepartmentName { get; set; }

    [Column("hod_id")]
    public int? HodId { get; set; }

    // Navigation
    public Users? Hod { get; set; }

    private Department()
    {
    }

    public static Department Create(
        int deptId,
        string? name,
        string createdBy)
    {
        var department = new Department
        {
            DeptId = deptId,
            DepartmentName = string.IsNullOrWhiteSpace(name)
                ? null
                : name.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        return department;
    }

    public void Update(
        string? name,
        int? hodId,
        string modifiedBy)
    {
        DepartmentName = string.IsNullOrWhiteSpace(name)
            ? null
            : name.Trim();

        HodId = hodId;

        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = modifiedBy;
    }
}