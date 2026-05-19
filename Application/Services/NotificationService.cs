using Application.Contracts;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Writes in-app notifications to the audit log.
/// Swap PersistAsync for email/SignalR push without changing callers.
/// </summary>
public sealed class NotificationService(
    IAccessRequestRepository repo,
    IUserService userRepo,   // inject your user lookup
    ILogger<NotificationService> logger
) : INotificationService
{
    public async Task NotifyUserAsync(
        int userId, string eventType, string message,
        int accessReqId, int? accessItemId = null, int? approvalId = null,
        CancellationToken ct = default)
    {
        var user = await userRepo.GetByIdAsync(userId, ct);
        var audit = new AccessReqAuditEntity
        {
            AccessReqId     = accessReqId,
            AccessItemId    = accessItemId,
            AccessApproveId = approvalId,
            EventType       = eventType,
            Message         = message,
            RecipientUserId = userId,
            RecipientName   = user?.UserName ?? userId.ToString(),
            RecipientRole   = user?.Role?.ToString() ?? "User",
            IsRead          = false,
            CreatedBy       = "system"
        };

        await repo.AddAuditAsync(audit, ct);

        // TODO: plug in email/SignalR here
        logger.LogInformation("[NOTIFY] → userId={UserId} event={Event}: {Message}", userId, eventType, message);
    }

    public async Task NotifyRoleAsync(UserRole roleName, string eventType, string message, int accessReqId, int? accessItemId = null, CancellationToken ct = default)
    {
        var usersInRole = await userRepo.GetByRoleAsync(roleName, ct);
        foreach (var user in usersInRole)
            await NotifyUserAsync(user.UserId, eventType, message, accessReqId, accessItemId, ct: ct);
    }
}