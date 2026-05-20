using Web.Features.Hod;

namespace Web.Features.Department;

public sealed record DepartmentRecord
{
    public int DeptId { get; init; }
    public string DeptName { get; init; } = string.Empty;
    public int? HodUserId { get; init; }
    public HodRecord? Hod { get; init; }
}

public sealed record DepartmentCreateRequest
{
    public int? DeptId { get; init; }
    public string DeptName { get; init; } = string.Empty;
    public int? HodUserId { get; init; }
}

public sealed record DepartmentUpdateRequest
{
    public string DepartmentCode { get; init; } = string.Empty;
    public string DeptName { get; init; } = string.Empty;
    public int? HodUserId { get; init; }
}