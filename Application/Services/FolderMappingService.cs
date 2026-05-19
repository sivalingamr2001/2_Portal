using Application.Common;
using Application.DTOs.FolderMapping;
using Application.Interfaces;
using Domain.Interfaces.Repositories;
using Microsoft.Extensions.Logging;
using Server.Domain.Entities;

namespace Application.Services;

public sealed class FolderMappingService(
    IFolderMappingRepository repo,
    ILogger<FolderMappingService> logger
) : IFolderMappingService
{
    public async Task<Result<FolderMappingResponseDto>> GetByIdAsync(int id, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(id, ct);
        return entity is null ? Result<FolderMappingResponseDto>.NotFound() : Result<FolderMappingResponseDto>.Success(Map(entity));
    }

    public async Task<Result<List<FolderMappingResponseDto>>> GetAllAsync(CancellationToken ct)
    {
        var list = await repo.GetAllAsync(ct);
        return Result<List<FolderMappingResponseDto>>.Success(list.Select(Map).ToList());
    }

    public async Task<Result<List<FolderMappingResponseDto>>> GetByHodIdAsync(string hodId, CancellationToken ct)
    {
        var list = await repo.GetByHodIdAsync(hodId, ct);
        return Result<List<FolderMappingResponseDto>>.Success(list.Select(Map).ToList());
    }

    public async Task<Result<FolderMappingResponseDto>> CreateAsync(
        CreateFolderMappingDto dto, string createdBy, CancellationToken ct)
    {
        if (await repo.ExistsAsync(dto.FolderName, ct))
            return Result<FolderMappingResponseDto>.Failure($"Folder '{dto.FolderName}' already exists.");

        var entity = new FolderMappingEntity
        {
            FolderName        = dto.FolderName,
            PrimaryHodId      = dto.PrimaryHodId,
            PrimaryHodName    = dto.PrimaryHodName,
            PrimaryHodEmail   = dto.PrimaryHodEmail,
            SecondaryHodId    = dto.SecondaryHodId,
            SecondaryHodName  = dto.SecondaryHodName,
            SecondaryHodEmail = dto.SecondaryHodEmail,
            CreatedBy         = createdBy
        };

        var created = await repo.AddAsync(entity, ct);
        return Result<FolderMappingResponseDto>.Success(Map(created), 201);
    }

    public async Task<Result<FolderMappingResponseDto>> UpdateAsync(
        UpdateFolderMappingDto dto, string updatedBy, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(dto.Id, ct);
        if (entity is null) return Result<FolderMappingResponseDto>.NotFound();

        entity.FolderName        = dto.FolderName;
        entity.PrimaryHodId      = dto.PrimaryHodId;
        entity.PrimaryHodName    = dto.PrimaryHodName;
        entity.PrimaryHodEmail   = dto.PrimaryHodEmail;
        entity.SecondaryHodId    = dto.SecondaryHodId;
        entity.SecondaryHodName  = dto.SecondaryHodName;
        entity.SecondaryHodEmail = dto.SecondaryHodEmail;
        entity.UpdatedAt         = DateTime.UtcNow;
        entity.UpdatedBy         = updatedBy;

        await repo.UpdateAsync(entity, ct);
        return Result<FolderMappingResponseDto>.Success(Map(entity));
    }

    public async Task<Result<FolderMappingResponseDto>> AssignHodAsync(
        int folderId,
        string? primaryHodId, string? primaryHodName, string? primaryHodEmail,
        string? secondaryHodId, string? secondaryHodName, string? secondaryHodEmail,
        string updatedBy, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(folderId, ct);
        if (entity is null) return Result<FolderMappingResponseDto>.NotFound();

        entity.PrimaryHodId      = primaryHodId;
        entity.PrimaryHodName    = primaryHodName;
        entity.PrimaryHodEmail   = primaryHodEmail;
        entity.SecondaryHodId    = secondaryHodId;
        entity.SecondaryHodName  = secondaryHodName;
        entity.SecondaryHodEmail = secondaryHodEmail;
        entity.UpdatedAt         = DateTime.UtcNow;
        entity.UpdatedBy         = updatedBy;

        await repo.UpdateAsync(entity, ct);
        return Result<FolderMappingResponseDto>.Success(Map(entity));
    }

    public async Task<Result<bool>> DeactivateAsync(int id, string updatedBy, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(id, ct);
        if (entity is null) return Result<bool>.NotFound();

        entity.IsActive  = false;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await repo.UpdateAsync(entity, ct);
        return Result<bool>.Success(true);
    }

    private static FolderMappingResponseDto Map(FolderMappingEntity e) => new(
        e.Id, e.FolderName,
        e.PrimaryHodId, e.PrimaryHodName, e.PrimaryHodEmail,
        e.SecondaryHodId, e.SecondaryHodName, e.SecondaryHodEmail,
        e.IsActive, e.CreatedAt
    );
}