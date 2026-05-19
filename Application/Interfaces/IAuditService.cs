namespace Application.Interfaces;

public interface IAuditService
{
    Task RecordAsync(int accessReqId, string eventType, string message,
        int recipientUserId, string recipientName, string recipientRole,
        int? accessItemId = null, int? approvalId = null,
        CancellationToken ct = default);
}