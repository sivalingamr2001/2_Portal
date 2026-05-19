namespace Application.DTOs.Department;

public sealed record CreateDepartmentDto(
    string DepartmentName,
    int HodId
);

public sealed record UpdateDepartmentDto(
    int DepartmentId,
    string DepartmentName,
    int HodId
);

public sealed record DepartmentResponseDto(
    int DepartmentId,
    string DepartmentName,
    int HodId
);
