using Application.Common;
using Application.DTOs.FolderMapping;

namespace Application.Interfaces;

public interface IFolderMappingService
{
    Task<Result<FolderMappingResponseDto>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Result<List<FolderMappingResponseDto>>> GetAllAsync(CancellationToken ct = default);
    Task<Result<List<FolderMappingResponseDto>>> GetByHodIdAsync(string hodId, CancellationToken ct = default);
    Task<Result<FolderMappingResponseDto>> CreateAsync(CreateFolderMappingDto dto, string createdBy, CancellationToken ct = default);
    Task<Result<FolderMappingResponseDto>> UpdateAsync(UpdateFolderMappingDto dto, string updatedBy, CancellationToken ct = default);
    Task<Result<bool>> DeactivateAsync(int id, string updatedBy, CancellationToken ct = default);
    Task<Result<FolderMappingResponseDto>> AssignHodAsync(
        int folderId,
        string? primaryHodId, string? primaryHodName, string? primaryHodEmail,
        string? secondaryHodId, string? secondaryHodName, string? secondaryHodEmail,
        string updatedBy,
        CancellationToken ct = default);
}