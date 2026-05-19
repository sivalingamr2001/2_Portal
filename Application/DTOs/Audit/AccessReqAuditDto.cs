namespace Application.DTOs.Audit;

public sealed record AccessReqAuditDto(
    int AuditId,
    int AccessReqId,
    int? AccessItemId,
    int? AccessApproveId,
    string EventType,
    string Message,
    int RecipientUserId,
    string RecipientName,
    string RecipientRole,
    bool IsRead,
    DateTime CreatedAt
);
