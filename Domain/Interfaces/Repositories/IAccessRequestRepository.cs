using Domain.Entities;

namespace Domain.Interfaces.Repositories;

public interface IAccessRequestRepository
{
    Task<AccessRequestEntity?> GetByIdAsync(int accessReqId, CancellationToken ct = default);
    Task<AccessRequestEntity?> GetWithItemsAsync(int accessReqId, CancellationToken ct = default);
    Task<List<AccessRequestEntity>> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task<List<AccessRequestEntity>> GetPendingByHodIdAsync(int hodId, CancellationToken ct = default);
    Task<List<AccessRequestEntity>> GetAllAsync(CancellationToken ct = default);
    Task<AccessRequestEntity> AddAsync(AccessRequestEntity entity, CancellationToken ct = default);
    Task UpdateAsync(AccessRequestEntity entity, CancellationToken ct = default);

    // --- AccessItem ---
    Task<AccessItemEntity?> GetItemByIdAsync(int accessItemId, CancellationToken ct = default);
    Task<List<AccessItemEntity>> GetItemsByRequestIdAsync(int accessReqId, CancellationToken ct = default);
    Task<List<AccessItemEntity>> GetItemsPendingHodAsync(int hodDeptId, CancellationToken ct = default);
    Task<List<AccessItemEntity>> GetItemsPendingItAsync(CancellationToken ct = default);
    Task<List<AccessItemEntity>> GetItemsGrantedExpiringBeforeAsync(DateTime threshold, CancellationToken ct = default);
    Task UpdateItemAsync(AccessItemEntity entity, CancellationToken ct = default);

    // --- AccessApproval ---
    Task<AccessApprovalEntity> AddApprovalAsync(AccessApprovalEntity entity, CancellationToken ct = default);
    Task<List<AccessApprovalEntity>> GetApprovalsByItemIdAsync(int accessItemId, CancellationToken ct = default);

    // --- Audit ---
    Task AddAuditAsync(AccessReqAuditEntity entity, CancellationToken ct = default);
    Task<List<AccessReqAuditEntity>> GetAuditsByRequestIdAsync(int accessReqId, CancellationToken ct = default);
    Task<List<AccessReqAuditEntity>> GetUnreadNotificationsAsync(int userId, CancellationToken ct = default);
    Task MarkNotificationsReadAsync(int userId, CancellationToken ct = default);
}