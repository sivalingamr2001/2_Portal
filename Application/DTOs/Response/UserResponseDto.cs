namespace Application.DTOs.Response;

/// <summary>
/// Example User Response DTO.
/// </summary>
public record UserResponseDto(
    int UserId,
    string EmployeeId,
    string UserName,
    string Email,
    string? PhoneNumber,
    int? DeptId,
    string? Location,
    string? Role,
    int? DepartmentId
);

public sealed record CmplUserRecord(
    int UserId,
    string? EmployeeId,
    string? UserName,
    int? DeptId,
    string? Email = null,
    string? Mobile = null,
    string? Location = null,
    string? Role = null,
    int? DepartmentId = null
);
