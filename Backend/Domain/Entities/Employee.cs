using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

/// <summary>
/// Users are the primary actors — requesters, HODs, IT approvers.
/// </summary>
[Table("jan_portal_users")]
public sealed class Users : AuditableEntity
{
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("user_role")]
    public UserRole? UserRole { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    // Navigation
    public Department Department { get; private set; } = null!;
    public ICollection<AccessRequest> AccessRequests { get; private set; } = [];

    private Users() { }

    public static Users Create(
        int userId,
        UserRole role,
        string location,
        string createdBy)
    {
        var user = new Users
        {
            UserId = userId,
            UserRole = role,
            Location = location.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        return user;
    }

    public void UpdateProfile(int userId, UserRole userRole,string location, string modifiedBy)
    {
        UserId = userId;
        UserRole = userRole;
        location = location.Trim();
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = modifiedBy;
    }
}
