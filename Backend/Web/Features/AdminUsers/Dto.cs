using Web.Domain.Enums;

namespace Web.Features.AdminUsers;

public sealed record AdminUserRecord
{
    public int UserId { get; init; }
    public string EmployeeId { get; init; } = string.Empty;
    public string UserName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public long Mobile { get; init; }
    public int DeptId { get; init; }
    public string DepartmentName { get; init; } = string.Empty;
    public UserRole UserRole { get; init; }
    public string Location { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed record AdminUserCreateRequest
{
    public string Identifier { get; init; } = string.Empty;
    public UserRole UserRole { get; init; } = UserRole.User;
    public string Location { get; init; } = string.Empty;
}

public sealed record AdminUserUpdateRequest
{
    public UserRole UserRole { get; init; } = UserRole.User;
    public string Location { get; init; } = string.Empty;
}
