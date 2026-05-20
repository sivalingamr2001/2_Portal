using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

/// <summary>
/// Users are the primary actors — requesters, HODs, IT approvers.
/// </summary>
[Table("jan_users")]
public sealed class Users : AuditableEntity
{
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("employee_id")]
    public string? EmployeeId { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("user_role")]
    public UserRole? UserRole { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    // Navigation
    public Department Department { get; private set; } = null!;
    public ICollection<AccessRequest> AccessRequests { get; private set; } = [];

    private Employee() { }

    public static Employee Create(
        string employeeCode,
        string fullName,
        string email,
        string role,
        int departmentId,
        string createdBy)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);

        var employee = new Employee
        {
            EmployeeCode = employeeCode.Trim().ToUpperInvariant(),
            FullName = fullName.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            Role = role.Trim().ToLowerInvariant(),
            DepartmentId = departmentId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        return employee;
    }

    public void UpdateProfile(string fullName, string email, string modifiedBy)
    {
        FullName = fullName.Trim();
        Email = email.Trim().ToLowerInvariant();
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = modifiedBy;
    }
}
