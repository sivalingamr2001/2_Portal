// Application/Interfaces/Repositories/IFolderMappingRepository.cs
using Server.Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IFolderMappingRepository
{
    Task<FolderMappingEntity?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<FolderMappingEntity>> GetAllAsync(CancellationToken ct = default);
    Task<List<FolderMappingEntity>> GetByHodIdAsync(string hodId, CancellationToken ct = default);
    Task<FolderMappingEntity?> GetByFolderNameAsync(string folderName, CancellationToken ct = default);
    Task<FolderMappingEntity> AddAsync(FolderMappingEntity entity, CancellationToken ct = default);
    Task UpdateAsync(FolderMappingEntity entity, CancellationToken ct = default);
    Task<bool> ExistsAsync(string folderName, CancellationToken ct = default);
}