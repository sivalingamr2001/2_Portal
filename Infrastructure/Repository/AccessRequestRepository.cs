using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces.Repositories;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository;

public sealed class AccessRequestRepository(AppDbContext db) : IAccessRequestRepository
{
    // -- AccessRequest ----------------------------------------------------------

    public Task<AccessRequestEntity?> GetByIdAsync(int id, CancellationToken ct) =>
        db.AccessRequests.AsNoTracking().FirstOrDefaultAsync(x => x.AccessReqId == id, ct);

    public Task<AccessRequestEntity?> GetWithItemsAsync(int id, CancellationToken ct) =>
        db.AccessRequests
          .Include(r => r.AccessItems)
          .AsNoTracking()
          .FirstOrDefaultAsync(x => x.AccessReqId == id, ct);

    public Task<List<AccessRequestEntity>> GetByUserIdAsync(int userId, CancellationToken ct) =>
        db.AccessRequests
          .Where(r => r.UserId == userId)
          .Include(r => r.AccessItems)
          .AsNoTracking()
          .ToListAsync(ct);

    public async Task<List<AccessRequestEntity>> GetPendingByHodIdAsync(int hodId, CancellationToken ct) =>
        await db.AccessRequests
                .Where(r => r.ReqTo == hodId &&
                            r.AccessItems.Any(i => i.Status == RequestStatus.PendingHOD))
                .Include(r => r.AccessItems)
                .AsNoTracking()
                .ToListAsync(ct);

    public Task<List<AccessRequestEntity>> GetAllAsync(CancellationToken ct) =>
        db.AccessRequests.Include(r => r.AccessItems).AsNoTracking().ToListAsync(ct);

    public async Task<AccessRequestEntity> AddAsync(AccessRequestEntity entity, CancellationToken ct)
    {
        db.AccessRequests.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(AccessRequestEntity entity, CancellationToken ct)
    {
        db.AccessRequests.Update(entity);
        await db.SaveChangesAsync(ct);
    }

    // -- AccessItem -------------------------------------------------------------

    public Task<AccessItemEntity?> GetItemByIdAsync(int id, CancellationToken ct) =>
        db.AccessItems.AsNoTracking().FirstOrDefaultAsync(x => x.AccessItemId == id, ct);

    public Task<List<AccessItemEntity>> GetItemsByRequestIdAsync(int accessReqId, CancellationToken ct) =>
        db.AccessItems.Where(i => i.AccessReqId == accessReqId).AsNoTracking().ToListAsync(ct);

    public Task<List<AccessItemEntity>> GetItemsPendingHodAsync(int hodDeptId, CancellationToken ct) =>
        db.AccessItems.Where(i => i.Status == RequestStatus.PendingHOD).AsNoTracking().ToListAsync(ct);

    public Task<List<AccessItemEntity>> GetItemsPendingItAsync(CancellationToken ct) =>
        db.AccessItems.Where(i => i.Status == RequestStatus.PendingIT).AsNoTracking().ToListAsync(ct);

    public Task<List<AccessItemEntity>> GetItemsGrantedExpiringBeforeAsync(DateTime threshold, CancellationToken ct) =>
        db.AccessItems
          .Where(i => i.Status == RequestStatus.AccessGranted && i.UpdatedAt.HasValue
                      && i.UpdatedAt.Value.AddDays(90) <= threshold)
          .AsNoTracking()
          .ToListAsync(ct);

    public async Task UpdateItemAsync(AccessItemEntity entity, CancellationToken ct)
    {
        db.AccessItems.Update(entity);
        await db.SaveChangesAsync(ct);
    }

    // -- AccessApproval ---------------------------------------------------------

    public async Task<AccessApprovalEntity> AddApprovalAsync(AccessApprovalEntity entity, CancellationToken ct)
    {
        db.AccessApprovals.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }

    public Task<List<AccessApprovalEntity>> GetApprovalsByItemIdAsync(int accessItemId, CancellationToken ct) =>
        db.AccessApprovals.Where(a => a.AccessItemId == accessItemId).AsNoTracking().ToListAsync(ct);

    // -- Audit ------------------------------------------------------------------

    public async Task AddAuditAsync(AccessReqAuditEntity entity, CancellationToken ct)
    {
        db.AccessReqAudits.Add(entity);
        await db.SaveChangesAsync(ct);
    }

    public Task<List<AccessReqAuditEntity>> GetAuditsByRequestIdAsync(int accessReqId, CancellationToken ct) =>
        db.AccessReqAudits.Where(a => a.AccessReqId == accessReqId).AsNoTracking().ToListAsync(ct);

    public Task<List<AccessReqAuditEntity>> GetUnreadNotificationsAsync(int userId, CancellationToken ct) =>
        db.AccessReqAudits
          .Where(a => a.RecipientUserId == userId && !a.IsRead)
          .AsNoTracking()
          .ToListAsync(ct);

    public async Task MarkNotificationsReadAsync(int userId, CancellationToken ct)
    {
        await db.AccessReqAudits
                .Where(a => a.RecipientUserId == userId && !a.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsRead, true), ct);
    }
}