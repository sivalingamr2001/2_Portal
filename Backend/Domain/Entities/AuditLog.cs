using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;

namespace Web.Domain.Entities;

[Table("Jan_Audit_Log")]
public sealed class AuditLog : BaseEntity
{
    [Column("accessreq_id")]
    public int AccessReqId { get; private set; }

    [Column("accessitem_id")]
    public int? AccessItemId { get; private set; }

    [Column("accessapprove_id")]
    public int? AccessApproveId { get; private set; }

    [Column("event_type")]
    public string EventType { get; private set; } = string.Empty;

    [Column("message")]
    public string Message { get; private set; } = string.Empty;

    [Column("recipient_emp_id")]
    public int RecipientEmpId { get; private set; }

    [Column("recipient_name")]
    public string RecipientName { get; private set; } = string.Empty;

    [Column("recipient_role")]
    public string RecipientRole { get; private set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; private set; } = false;

    private AuditLog() { }

    public static AuditLog Create(
        int accessReqId,
        string eventType,
        string message,
        int recipientEmpId,
        string recipientName,
        string recipientRole,
        int? accessItemId = null,
        int? accessApproveId = null)
    {
        return new AuditLog
        {
            AccessReqId = accessReqId,
            AccessItemId = accessItemId,
            AccessApproveId = accessApproveId,
            EventType = eventType.Trim(),
            Message = message.Trim(),
            RecipientEmpId = recipientEmpId,
            RecipientName = recipientName.Trim(),
            RecipientRole = recipientRole.Trim(),
            IsRead = false
        };
    }

    public void MarkAsRead()
    {
        IsRead = true;
    }
}
