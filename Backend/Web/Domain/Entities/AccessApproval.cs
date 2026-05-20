using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

[Table("jan_accessapproval")]
public sealed class AccessApproval : AuditableEntity
{
    [Column("accessreq_id")]
    public int AccessRequestId { get; private set; }

    [Column("accessitem_id")]
    public int AccessItemId { get; private set; }

    [Column("approver_id")]
    public int ApproverId { get; private set; }

    [Column("approval_status")]
    public RequestStatus ApprovalStatus { get; private set; }

    [Column("comments")]
    public string Comments { get; private set; } = string.Empty;

    private AccessApproval() { }

    public static AccessApproval Create(
        int accessRequestId,
        int accessItemId,
        int approverId,
        RequestStatus status,
        string comments,
        string createdBy)
    {
        return new AccessApproval
        {
            AccessRequestId = accessRequestId,
            AccessItemId = accessItemId,
            ApproverId = approverId,
            ApprovalStatus = status,
            Comments = comments.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }
}
