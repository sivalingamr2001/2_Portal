using Web.Domain.Enums;
using Web.Features.Department;
using Web.Features.Hod;

namespace Web.Features.Auth.Me;

public sealed record UserResponse
{
    public int UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public long Mobile { get; init; }
    public int DeptId { get; init; }
    public UserRole UserRole { get; init; }
    public string Location { get; init; } = string.Empty;
    public DepartmentRecord? Department { get; init; }
    public HodRecord? Hod { get; init; }
}

public sealed record CmplUserRecord
{
    public int UserId { get; init; }
    public string EmployeeId { get; init; } = string.Empty;
    public string UserName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public long Mobile { get; init; }
    public int DeptId { get; init; }
}