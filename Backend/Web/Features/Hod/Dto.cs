using Web.Domain.Enums;

namespace Web.Features.Hod;

public sealed record HodRecord
{
    public int UserId { get; init; }
    public string EmployeeId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public int? DeptId { get; init; }
    public bool IsDepartmentHod { get; init; }
    public UserRole UserRole { get; init; } = UserRole.User;
    public string Location { get; init; } = string.Empty;
}

public sealed record HodCreateRequest
{
    public int UserId { get; init; }
    public string Location { get; init; } = string.Empty;
    public UserRole UserRole { get; init; } = UserRole.Hod;
}

public sealed record HodUpdateRequest
{
    public string Location { get; init; } = string.Empty;
    public UserRole? UserRole { get; init; }
}
