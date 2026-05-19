using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository;

public sealed class DepartmentRepository(AppDbContext db) : IDepartmentRepository
{
    public Task<DepartmentEntity?> GetByIdAsync(int id, CancellationToken ct) =>
        db.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.DepartmentId == id, ct);

    public Task<List<DepartmentEntity>> GetAllAsync(CancellationToken ct) =>
        db.Departments.AsNoTracking().ToListAsync(ct);

    public Task<DepartmentEntity?> GetByHodIdAsync(int hodId, CancellationToken ct) =>
        db.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.HodId == hodId, ct);

    public async Task<DepartmentEntity> AddAsync(DepartmentEntity entity, CancellationToken ct)
    {
        db.Departments.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(DepartmentEntity entity, CancellationToken ct)
    {
        db.Departments.Update(entity);
        await db.SaveChangesAsync(ct);
    }

    public Task<bool> ExistsAsync(int id, CancellationToken ct) =>
        db.Departments.AnyAsync(d => d.DepartmentId == id, ct);
}