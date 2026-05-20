using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

/// <summary>Maps to Jan_Access_Details. Actual folder access records provisioned after IT approval.</summary>
[Table("Jan_Access_Details")]
public sealed class AccessDetail : AuditableEntity
{
    [Column("ticket_number")]
    public string TicketNumber { get; private set; } = string.Empty;

    [Column("accessreq_id")]
    public int AccessReqId { get; private set; }

    [Column("status")]
    public RequestStatus Status { get; private set; }

    [Column("folder_path")]
    public string FolderPath { get; private set; } = string.Empty;

    [Column("access_type")]
    public AccessTypes AccessType { get; private set; }

    [Column("confirm_access_type")]
    public AccessTypes ConfirmAccessType { get; private set; }

    [Column("reason")]
    public string Reason { get; private set; } = string.Empty;

    private AccessDetail() { }

    public static AccessDetail Create(
        string ticketNumber,
        string folderPath,
        AccessTypes accessType,
        string reason,
        string createdBy)
    {
        return new AccessDetail
        {
            TicketNumber = ticketNumber,
            FolderPath = folderPath.Trim(),
            AccessType = accessType,
            ConfirmAccessType = accessType, // Default initialization
            Status = RequestStatus.Submited,
            Reason = reason.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }

    public void UpdateStatus(RequestStatus status, string updatedBy)
    {
        Status = status;
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = updatedBy;
    }

    public void ConfirmFinalAccessType(AccessTypes confirmedType, string updatedBy)
    {
        ConfirmAccessType = confirmedType;
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = updatedBy;
    }
}
