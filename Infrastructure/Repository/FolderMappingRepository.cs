using Domain.Interfaces.Repositories;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Server.Domain.Entities;

namespace Infrastructure.Repository;

public sealed class FolderMappingRepository(AppDbContext db) : IFolderMappingRepository
{
    public Task<FolderMappingEntity?> GetByIdAsync(int id, CancellationToken ct) =>
        db.FolderMappings.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, ct);

    public Task<List<FolderMappingEntity>> GetAllAsync(CancellationToken ct) =>
        db.FolderMappings.AsNoTracking().ToListAsync(ct);

    public Task<List<FolderMappingEntity>> GetByHodIdAsync(string hodId, CancellationToken ct) =>
        db.FolderMappings
          .Where(f => f.PrimaryHodId == hodId || f.SecondaryHodId == hodId)
          .AsNoTracking()
          .ToListAsync(ct);

    public Task<FolderMappingEntity?> GetByFolderNameAsync(string folderName, CancellationToken ct) =>
        db.FolderMappings.AsNoTracking().FirstOrDefaultAsync(f => f.FolderName == folderName, ct);

    public async Task<FolderMappingEntity> AddAsync(FolderMappingEntity entity, CancellationToken ct)
    {
        db.FolderMappings.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(FolderMappingEntity entity, CancellationToken ct)
    {
        db.FolderMappings.Update(entity);
        await db.SaveChangesAsync(ct);
    }

    public Task<bool> ExistsAsync(string folderName, CancellationToken ct) =>
        db.FolderMappings.AnyAsync(f => f.FolderName == folderName, ct);
}