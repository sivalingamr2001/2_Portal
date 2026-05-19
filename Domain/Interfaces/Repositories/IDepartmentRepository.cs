// Application/Interfaces/Repositories/IDepartmentRepository.cs

// Application/Interfaces/Repositories/IDepartmentRepository.cs

// Application/Interfaces/Repositories/IDepartmentRepository.cs

// Application/Interfaces/Repositories/IDepartmentRepository.cs
using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IDepartmentRepository
{
    Task<DepartmentEntity?> GetByIdAsync(int departmentId, CancellationToken ct = default);
    Task<List<DepartmentEntity>> GetAllAsync(CancellationToken ct = default);
    Task<DepartmentEntity?> GetByHodIdAsync(int hodId, CancellationToken ct = default);
    Task<DepartmentEntity> AddAsync(DepartmentEntity entity, CancellationToken ct = default);
    Task UpdateAsync(DepartmentEntity entity, CancellationToken ct = default);
    Task<bool> ExistsAsync(int departmentId, CancellationToken ct = default);
}