using Web.Common.Exceptions;
using Web.Domain.Entities;
using Web.Features.Hod;
using Web.Infrastructure.Repositories;

namespace Web.Features.FolderMappings;

public sealed class FolderMappingService(
    IUnitOfWork uow,
    HodService hodService)
{
    private readonly IUnitOfWork _uow = uow;
    private readonly HodService _hodService = hodService;

    public async Task<List<FolderMappingRecord>> GetFolderMappingsAsync(CancellationToken cancellationToken)
    {
        var mappings = await _uow.FolderMappings.GetAllAsync(cancellationToken);
        return await BuildRecordsAsync(mappings, cancellationToken);
    }

    public async Task<FolderMappingRecord> CreateAsync(
        FolderMappingCreateRequest request,
        CancellationToken cancellationToken)
    {
        await ValidateRequestAsync(request.FolderPath, request.PrimaryHodUserId, request.SecondaryHodUserId, cancellationToken);

        var exists = await _uow.FolderMappings.ExistsAsync(
            x => x.FolderPath == request.FolderPath.Trim(),
            cancellationToken);

        if (exists)
            throw new ConflictException($"A mapping already exists for folder '{request.FolderPath}'.");

        var entity = FolderMapping.Create(
            request.FolderPath,
            request.PrimaryHodUserId,
            request.SecondaryHodUserId,
            request.IsActive,
            "system");

        await _uow.FolderMappings.AddAsync(entity, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return await BuildRecordAsync(entity, cancellationToken);
    }

    public async Task<FolderMappingRecord?> UpdateAsync(
        int id,
        FolderMappingUpdateRequest request,
        CancellationToken cancellationToken)
    {
        await ValidateRequestAsync(request.FolderPath, request.PrimaryHodUserId, request.SecondaryHodUserId, cancellationToken);

        var entity = await _uow.FolderMappings.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return null;

        var conflict = await _uow.FolderMappings.ExistsAsync(
            x => x.Id != id && x.FolderPath == request.FolderPath.Trim(),
            cancellationToken);

        if (conflict)
            throw new ConflictException($"A mapping already exists for folder '{request.FolderPath}'.");

        entity.Update(
            request.FolderPath,
            request.PrimaryHodUserId,
            request.SecondaryHodUserId,
            request.IsActive,
            "system");

        _uow.FolderMappings.Update(entity);
        await _uow.SaveChangesAsync(cancellationToken);

        return await BuildRecordAsync(entity, cancellationToken);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var entity = await _uow.FolderMappings.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return false;

        _uow.FolderMappings.Delete(entity);
        await _uow.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<List<string>> GetFolderOptionsAsync(CancellationToken cancellationToken)
    {
        var accessFolders = (await _uow.AccessDetails.GetAllAsync(cancellationToken))
            .Select(x => x.FolderPath);

        return accessFolders
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x)
            .ToList();
    }

    private async Task ValidateRequestAsync(
        string folderPath,
        int primaryHodUserId,
        int? secondaryHodUserId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(folderPath))
            throw new InvalidOperationException("Folder path is required.");

        var primary = await _hodService.GetHodByIdAsync(primaryHodUserId, cancellationToken);
        if (primary is null)
            throw new NotFoundException("Hod", primaryHodUserId);

        if (secondaryHodUserId.HasValue)
        {
            var secondary = await _hodService.GetHodByIdAsync(secondaryHodUserId.Value, cancellationToken);
            if (secondary is null)
                throw new NotFoundException("Hod", secondaryHodUserId.Value);
        }
    }

    private async Task<List<FolderMappingRecord>> BuildRecordsAsync(
        IReadOnlyList<FolderMapping> entities,
        CancellationToken cancellationToken)
    {
        var hods = (await _hodService.GetHodsAsync(cancellationToken))
            .ToDictionary(x => x.UserId, x => x);

        return entities
            .OrderBy(x => x.FolderPath)
            .Select(entity => new FolderMappingRecord
            {
                Id = entity.Id,
                FolderPath = entity.FolderPath,
                PrimaryHodUserId = entity.PrimaryHodUserId,
                PrimaryHod = hods.GetValueOrDefault(entity.PrimaryHodUserId),
                SecondaryHodUserId = entity.SecondaryHodUserId,
                SecondaryHod = entity.SecondaryHodUserId.HasValue
                    ? hods.GetValueOrDefault(entity.SecondaryHodUserId.Value)
                    : null,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                CreatedBy = entity.CreatedBy,
                ModifiedAt = entity.ModifiedAt,
                ModifiedBy = entity.ModifiedBy
            })
            .ToList();
    }

    private async Task<FolderMappingRecord> BuildRecordAsync(
        FolderMapping entity,
        CancellationToken cancellationToken)
    {
        return (await BuildRecordsAsync([entity], cancellationToken)).Single();
    }
}
