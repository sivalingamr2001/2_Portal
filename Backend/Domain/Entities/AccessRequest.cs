using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

/// <summary>
/// Maps to Jan_Access_Request.
/// The aggregate root for the two-stage approval workflow.
/// State transitions are enforced here — never externally.
/// </summary>
[Table("Jan_Access_Request")]
public class AccessRequest : AuditableEntity
{
    [Column("request_number")]
    public string RequestNumber { get; private set; } = string.Empty;

    [Column("emp_id")]
    public int EmpId { get; private set; }

    [Column("req_to")]
    public int ReqTo { get; private set; }

    [Column("is_agreed")]
    public bool IsAgreed { get; private set; }

    [Column("itsr_no")]
    public string? ItsrNo { get; set; } = string.Empty;

    public virtual ICollection<AccessDetail> AccessItems { get; private set; } = new List<AccessDetail>();

    private AccessRequest() { }

    public static AccessRequest Create(
        int requesterId,
        int reqTo,
        bool isAgreed,
        string createdBy,
        List<(string FolderPath, AccessTypes AccessType, string Reason)> items)
    {
        var request = new AccessRequest
        {
            RequestNumber = GenerateRequestNumber(),
            EmpId = requesterId,
            ReqTo = reqTo,
            IsAgreed = isAgreed,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        foreach (var item in items)
        {
            request.AccessItems.Add(AccessDetail.Create(
                ticketNumber: GenerateTicketNumber(),
                folderPath: item.FolderPath,
                accessType: item.AccessType,
                reason: item.Reason,
                createdBy: createdBy
            ));
        }

        return request;
    }

    public void ApproveByHod(string approvedBy)
    {
        var pendingItems = AccessItems.Where(i => i.Status == RequestStatus.Submited).ToList();

        if (!pendingItems.Any())
            throw new InvalidOperationException("No items are in a valid state to be approved by HOD.");

        UpdateModificationDetails(approvedBy);

        foreach (var item in pendingItems)
        {
            item.UpdateStatus(RequestStatus.HodApproved, approvedBy);
        }
    }

    public void RejectByHod(string rejectedBy)
    {
        var pendingItems = AccessItems.Where(i => i.Status == RequestStatus.Submited).ToList();

        if (!pendingItems.Any())
            throw new InvalidOperationException("No items are in a valid state to be rejected by HOD.");

        UpdateModificationDetails(rejectedBy);

        foreach (var item in pendingItems)
        {
            item.UpdateStatus(RequestStatus.HodRejected, rejectedBy);
        }
    }

    public void ApproveByIt(string approvedBy, string itsrNo)
    {
        var hodApprovedItems = AccessItems.Where(i => i.Status == RequestStatus.HodApproved).ToList();

        if (!hodApprovedItems.Any())
            throw new InvalidOperationException("IT approval requires items with prior HOD approval.");

        ItsrNo = itsrNo;
        UpdateModificationDetails(approvedBy);

        foreach (var item in hodApprovedItems)
        {
            item.UpdateStatus(RequestStatus.OperatorApproved, approvedBy);
        }
    }

    public void RejectByIt(string rejectedBy)
    {
        var hodApprovedItems = AccessItems.Where(i => i.Status == RequestStatus.HodApproved).ToList();

        if (!hodApprovedItems.Any())
            throw new InvalidOperationException("IT rejection requires items with prior HOD approval.");

        UpdateModificationDetails(rejectedBy);

        foreach (var item in hodApprovedItems)
        {
            item.UpdateStatus(RequestStatus.OperatorRejected, rejectedBy);
        }
    }

    public void Cancel(string cancelledBy)
    {
        var cancellableItems = AccessItems.Where(i =>
            i.Status != RequestStatus.OperatorApproved &&
            i.Status != RequestStatus.OperatorRejected &&
            i.Status != RequestStatus.AccessGranted &&
            i.Status != RequestStatus.AccessRejected).ToList();

        if (!cancellableItems.Any())
            throw new InvalidOperationException("Cannot cancel a completed or fully processed request.");

        UpdateModificationDetails(cancelledBy);

        foreach (var item in cancellableItems)
        {
            item.UpdateStatus(RequestStatus.OperatorRejected, cancelledBy);
        }
    }

    private void UpdateModificationDetails(string user)
    {
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = user;
    }

    private static string GenerateRequestNumber()
        => $"REQ-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

    private static string GenerateTicketNumber()
        => $"TKT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
}
