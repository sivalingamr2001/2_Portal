using Application.Common;
using Application.DTOs.Department;

namespace Application.Interfaces;

public interface IDepartmentService
{
    Task<Result<DepartmentResponseDto>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Result<List<DepartmentResponseDto>>> GetAllAsync(CancellationToken ct = default);
    Task<Result<DepartmentResponseDto>> CreateAsync(CreateDepartmentDto dto, CancellationToken ct = default);
    Task<Result<DepartmentResponseDto>> UpdateAsync(UpdateDepartmentDto dto, CancellationToken ct = default);
}