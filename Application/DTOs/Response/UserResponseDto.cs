using Domain.Enums;

namespace Application.DTOs.Response;

/// <summary>
/// Example User Response DTO.
/// </summary>
public record UserResponseDto(
    int UserId,
    string EmployeeId,
    string UserName,
    string Email,
    object? PhoneNumber,
    string? Location,
    UserRole? Role,
    int? DepartmentId
);

// CHANGED: Converted to a standard class to bypass strict constructor positional restrictions in Dapper
public sealed class CmplUserRecord
{
    public int UserId { get; set; }
    public string? EmployeeId { get; set; }
    public string? UserName { get; set; }
    public int? DeptId { get; set; }
    public string? Email { get; set; }
    public object? Mobile { get; set; } 
    public string? Location { get; set; }
    public UserRole? Role { get; set; }
    public int? DepartmentId { get; set; }
}
