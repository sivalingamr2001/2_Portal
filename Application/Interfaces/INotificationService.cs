using Domain.Enums;

namespace Application.Interfaces;

public interface INotificationService
{
    Task NotifyUserAsync(int userId, string eventType, string message, int accessReqId,
        int? accessItemId = null, int? approvalId = null, CancellationToken ct = default);

    Task NotifyRoleAsync(UserRole roleName, string eventType, string message, int accessReqId,
        int? accessItemId = null, CancellationToken ct = default);
}