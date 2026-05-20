using Web.Domain.Enums;

namespace Web.Features.Auth.Login;

public sealed record LoginRequest(string Identifier, string Password);

public sealed record LoginResponse
{
    public int UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public long Mobile { get; init; }
    public int DeptId { get; init; }
    public UserRole UserRole { get; init; }
    public string Location { get; init; } = string.Empty;
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
