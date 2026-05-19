using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces.Repositories;

namespace Application.Services;

public sealed class AuditService(IAccessRequestRepository repo) : IAuditService
{
    public Task RecordAsync(
        int accessReqId, string eventType, string message,
        int recipientUserId, string recipientName, string recipientRole,
        int? accessItemId = null, int? approvalId = null, CancellationToken ct = default)
    {
        var entry = new AccessReqAuditEntity
        {
            AccessReqId     = accessReqId,
            AccessItemId    = accessItemId,
            AccessApproveId = approvalId,
            EventType       = eventType,
            Message         = message,
            RecipientUserId = recipientUserId,
            RecipientName   = recipientName,
            RecipientRole   = recipientRole,
            IsRead          = false,
            CreatedBy       = "system"
        };

        return repo.AddAuditAsync(entry, ct);
    }
}