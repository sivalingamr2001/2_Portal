using Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities;

[Table("jan_accessrequest")]
public class AccessRequestEntity : BaseAuditableEntity
{
    [Key]
    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("req_to")]
    public int ReqTo { get; set; }

    [Column("is_agreed")]
    public bool IsAgreed { get; set; }

    [Column("itsr_no")]
    public string? ItsrNo { get; set; } = string.Empty;

    public virtual ICollection<AccessItemEntity> AccessItems { get; set; } = new List<AccessItemEntity>();
}

[Table("jan_accessitems")]
public class AccessItemEntity : BaseAuditableEntity
{
    [Key]
    [Column("accessitem_id")]
    public int AccessItemId { get; set; }

    [Column("ticket_number")]
    public string TicketNumber { get; set; } = string.Empty;

    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("status")]
    public RequestStatus Status { get; set; }

    [Column("folder_path")]
    public string FolderPath { get; set; } = string.Empty;

    [Column("access_type")]
    public AccessTypes AccessType { get; set; }

    [Column("confirm_access_type")]
    public AccessTypes ConfirmAccessType { get; set; }

    [Column("reason")]
    public string Reason { get; set; } = string.Empty;
}

[Table("jan_accessapproval")]
public sealed class AccessApprovalEntity : BaseAuditableEntity
{
    [Key]
    [Column("accessapprove_id")]
    public int AccessApproveId { get; set; }

    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("accessitem_id")]
    public int AccessItemId { get; set; }

    [Column("approver_id")]
    public int ApproverId { get; set; }

    [Column("approval_status")]
    public RequestStatus ApprovalStatus { get; set; }

    [Column("comments")]
    public string Comments { get; set; } = string.Empty;
}

[Table("jan_accessreqaudit")]
public sealed class AccessReqAuditEntity : BaseAuditableEntity
{
    [Key]
    [Column("audit_id")]
    public int AuditId { get; set; }

    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("accessitem_id")]
    public int? AccessItemId { get; set; }

    [Column("accessapprove_id")]
    public int? AccessApproveId { get; set; }

    [Column("event_type")]
    public string EventType { get; set; } = string.Empty;

    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("recipient_user_id")]
    public int RecipientUserId { get; set; }

    [Column("recipient_name")]
    public string RecipientName { get; set; } = string.Empty;

    [Column("recipient_role")]
    public string RecipientRole { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;
}
