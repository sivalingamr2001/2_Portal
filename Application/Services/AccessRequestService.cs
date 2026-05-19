using Application.Common;
using Application.DTOs.AccessRequest;
using Application.DTOs.Audit;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Interfaces.Repositories;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class AccessRequestService(
    IAccessRequestRepository repo,
    IDepartmentRepository deptRepo,
    IAuditService audit,
    INotificationService notify,
    ILogger<AccessRequestService> logger
) : IAccessRequestService
{
    private const int AccessValidDays = 90;

    // ── Create ─────────────────────────────────────────────────────────────────

    public async Task<Result<AccessRequestResponseDto>> CreateRequestAsync(
        CreateAccessRequestDto dto, CancellationToken ct)
    {
        if (!dto.IsAgreed)
            return Result<AccessRequestResponseDto>.Failure("User must agree to terms.");

        // Resolve HOD from user's department
        var userDept = await deptRepo.GetByHodIdAsync(dto.ReqTo, ct);
        if (userDept is null)
            return Result<AccessRequestResponseDto>.NotFound("HOD / Department not found.");

        var request = new AccessRequestEntity
        {
            UserId    = dto.UserId,
            ReqTo     = dto.ReqTo,
            IsAgreed  = true,
            CreatedBy = dto.UserId.ToString(),
            AccessItems = dto.Items.Select(i => new AccessItemEntity
            {
                TicketNumber = GenerateTicket(),
                FolderPath   = i.FolderPath,
                AccessType   = i.AccessType,
                Status       = RequestStatus.PendingHOD,
                Reason       = i.Reason,
                CreatedBy    = dto.UserId.ToString()
            }).ToList()
        };

        var created = await repo.AddAsync(request, ct);

        // Audit + notify HOD
        foreach (var item in created.AccessItems)
        {
            await audit.RecordAsync(created.AccessReqId, "RequestSubmitted",
                $"Access request for '{item.FolderPath}' submitted by user {dto.UserId}.",
                dto.ReqTo, $"HOD-{dto.ReqTo}", "HOD",
                accessItemId: item.AccessItemId, ct: ct);

            await notify.NotifyUserAsync(dto.ReqTo, "NewRequest",
                $"New access request #{item.TicketNumber} awaiting your approval.",
                created.AccessReqId, item.AccessItemId, ct: ct);
        }

        // Notify requester
        await notify.NotifyUserAsync(dto.UserId, "RequestSubmitted",
            $"Your access request #{created.AccessReqId} has been submitted.",
            created.AccessReqId, ct: ct);

        return Result<AccessRequestResponseDto>.Success(MapToDto(created), 201);
    }

    // ── HOD Approval ───────────────────────────────────────────────────────────

    public async Task<Result<bool>> HodApproveItemAsync(HodApprovalDto dto, CancellationToken ct)
    {
        var item = await repo.GetItemByIdAsync(dto.AccessItemId, ct);
        if (item is null) return Result<bool>.NotFound("Access item not found.");
        if (item.Status != RequestStatus.PendingHOD)
            return Result<bool>.Failure("Item is not in PendingHOD state.");

        item.Status    = RequestStatus.PendingIT;  // moves to IT queue
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = dto.ApproverId.ToString();
        await repo.UpdateItemAsync(item, ct);

        var approval = new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = dto.ApproverId,
            ApprovalStatus = RequestStatus.ApprovedHOD,
            Comments       = dto.Comments,
            CreatedBy      = dto.ApproverId.ToString()
        };
        var saved = await repo.AddApprovalAsync(approval, ct);

        // Audit
        await audit.RecordAsync(item.AccessReqId, "HodApproved",
            $"HOD approved item {item.TicketNumber}. Comments: {dto.Comments}",
            dto.ApproverId, $"HOD-{dto.ApproverId}", "HOD",
            accessItemId: item.AccessItemId, approvalId: saved.AccessApproveId, ct: ct);

        // Notify IT team (role-based)
        await notify.NotifyRoleAsync(UserRole.Operator, "HodApproved",
            $"Ticket {item.TicketNumber} approved by HOD. Awaiting IT action.",
            item.AccessReqId, item.AccessItemId, ct);

        // Notify requester
        var req = await repo.GetByIdAsync(item.AccessReqId, ct);
        if (req is not null)
            await notify.NotifyUserAsync(req.UserId, "HodApproved",
                $"Ticket {item.TicketNumber} approved by HOD and forwarded to IT.",
                item.AccessReqId, item.AccessItemId, ct: ct);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> HodRejectItemAsync(HodApprovalDto dto, CancellationToken ct)
    {
        var item = await repo.GetItemByIdAsync(dto.AccessItemId, ct);
        if (item is null) return Result<bool>.NotFound("Access item not found.");
        if (item.Status != RequestStatus.PendingHOD)
            return Result<bool>.Failure("Item is not in PendingHOD state.");

        item.Status    = RequestStatus.RejectedHOD;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = dto.ApproverId.ToString();
        await repo.UpdateItemAsync(item, ct);

        var approval = new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = dto.ApproverId,
            ApprovalStatus = RequestStatus.RejectedHOD,
            Comments       = dto.Comments,
            CreatedBy      = dto.ApproverId.ToString()
        };
        await repo.AddApprovalAsync(approval, ct);

        await audit.RecordAsync(item.AccessReqId, "HodRejected",
            $"HOD rejected item {item.TicketNumber}. Reason: {dto.Comments}",
            dto.ApproverId, $"HOD-{dto.ApproverId}", "HOD",
            accessItemId: item.AccessItemId, ct: ct);

        var req = await repo.GetByIdAsync(item.AccessReqId, ct);
        if (req is not null)
            await notify.NotifyUserAsync(req.UserId, "HodRejected",
                $"Ticket {item.TicketNumber} was rejected by HOD: {dto.Comments}",
                item.AccessReqId, item.AccessItemId, ct: ct);

        return Result<bool>.Success(true);
    }

    // ── IT Operator Approval ───────────────────────────────────────────────────

    public async Task<Result<bool>> ItApproveItemAsync(ItApprovalDto dto, CancellationToken ct)
    {
        var item = await repo.GetItemByIdAsync(dto.AccessItemId, ct);
        if (item is null) return Result<bool>.NotFound("Access item not found.");
        if (item.Status != RequestStatus.PendingIT)
            return Result<bool>.Failure("Item is not in PendingIT state.");

        item.Status             = RequestStatus.AccessGranted;
        item.UpdatedAt          = DateTime.UtcNow;
        item.UpdatedBy          = dto.ApproverId.ToString();
        await repo.UpdateItemAsync(item, ct);

        var approval = new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = dto.ApproverId,
            ApprovalStatus = RequestStatus.AccessGranted,
            Comments       = dto.Comments,
            CreatedBy      = dto.ApproverId.ToString()
        };
        var saved = await repo.AddApprovalAsync(approval, ct);

        await audit.RecordAsync(item.AccessReqId, "AccessGranted",
            $"IT granted access for ticket {item.TicketNumber}. ITSR: {item.TicketNumber ?? "N/A"}. Expires: {item.UpdatedAt.Value.AddDays(90):yyyy-MM-dd}.",
            dto.ApproverId, $"IT-{dto.ApproverId}", "IT",
            accessItemId: item.AccessItemId, approvalId: saved.AccessApproveId, ct: ct);

        var req = await repo.GetByIdAsync(item.AccessReqId, ct);
        if (req is not null)
            await notify.NotifyUserAsync(req.UserId, "AccessGranted",
                $"Access granted for ticket {item.TicketNumber}. Valid for 90 days.",
                item.AccessReqId, item.AccessItemId, ct: ct);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ItRejectItemAsync(ItApprovalDto dto, CancellationToken ct)
    {
        var item = await repo.GetItemByIdAsync(dto.AccessItemId, ct);
        if (item is null) return Result<bool>.NotFound("Access item not found.");
        if (item.Status != RequestStatus.PendingIT)
            return Result<bool>.Failure("Item is not in PendingIT state.");

        item.Status    = RequestStatus.AccessRejected;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = dto.ApproverId.ToString();
        await repo.UpdateItemAsync(item, ct);

        var approval = new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = dto.ApproverId,
            ApprovalStatus = RequestStatus.AccessRejected,
            Comments       = dto.Comments,
            CreatedBy      = dto.ApproverId.ToString()
        };
        await repo.AddApprovalAsync(approval, ct);

        await audit.RecordAsync(item.AccessReqId, "AccessRejected",
            $"IT rejected ticket {item.TicketNumber}. Reason: {dto.Comments}",
            dto.ApproverId, $"IT-{dto.ApproverId}", "IT",
            accessItemId: item.AccessItemId, ct: ct);

        var req = await repo.GetByIdAsync(item.AccessReqId, ct);
        if (req is not null)
            await notify.NotifyUserAsync(req.UserId, "AccessRejected",
                $"Access request for ticket {item.TicketNumber} was rejected by IT: {dto.Comments}",
                item.AccessReqId, item.AccessItemId, ct: ct);

        return Result<bool>.Success(true);
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    public async Task<Result<AccessRequestResponseDto>> GetRequestAsync(int id, CancellationToken ct)
    {
        var req = await repo.GetWithItemsAsync(id, ct);
        return req is null
            ? Result<AccessRequestResponseDto>.NotFound()
            : Result<AccessRequestResponseDto>.Success(MapToDto(req));
    }

    public async Task<Result<List<AccessRequestResponseDto>>> GetMyRequestsAsync(int userId, CancellationToken ct)
    {
        var list = await repo.GetByUserIdAsync(userId, ct);
        return Result<List<AccessRequestResponseDto>>.Success(list.Select(MapToDto).ToList());
    }

    public async Task<Result<List<AccessRequestResponseDto>>> GetPendingForHodAsync(int hodId, CancellationToken ct)
    {
        var list = await repo.GetPendingByHodIdAsync(hodId, ct);
        return Result<List<AccessRequestResponseDto>>.Success(list.Select(MapToDto).ToList());
    }

    public async Task<Result<List<AccessItemResponseDto>>> GetPendingForItAsync(CancellationToken ct)
    {
        var items = await repo.GetItemsPendingItAsync(ct);
        return Result<List<AccessItemResponseDto>>.Success(items.Select(MapItemToDto).ToList());
    }

    public async Task<Result<List<AccessRequestResponseDto>>> GetAllRequestsAsync(CancellationToken ct)
    {
        var list = await repo.GetAllAsync(ct);
        return Result<List<AccessRequestResponseDto>>.Success(list.Select(MapToDto).ToList());
    }

    public async Task<Result<List<AccessReqAuditDto>>> GetAuditTrailAsync(int accessReqId, CancellationToken ct)
    {
        var audits = await repo.GetAuditsByRequestIdAsync(accessReqId, ct);
        return Result<List<AccessReqAuditDto>>.Success(
            audits.Select(a => new AccessReqAuditDto(
                a.AuditId, a.AccessReqId, a.AccessItemId, a.AccessApproveId,
                a.EventType, a.Message, a.RecipientUserId, a.RecipientName,
                a.RecipientRole, a.IsRead, a.CreatedAt
            )).ToList());
    }

    public async Task<Result<List<AccessReqAuditDto>>> GetUnreadNotificationsAsync(int userId, CancellationToken ct)
    {
        var audits = await repo.GetUnreadNotificationsAsync(userId, ct);
        return Result<List<AccessReqAuditDto>>.Success(
            audits.Select(a => new AccessReqAuditDto(
                a.AuditId, a.AccessReqId, a.AccessItemId, a.AccessApproveId,
                a.EventType, a.Message, a.RecipientUserId, a.RecipientName,
                a.RecipientRole, a.IsRead, a.CreatedAt
            )).ToList());
    }

    public async Task<Result<bool>> MarkNotificationsReadAsync(int userId, CancellationToken ct)
    {
        await repo.MarkNotificationsReadAsync(userId, ct);
        return Result<bool>.Success(true);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static string GenerateTicket() =>
        $"TKT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

    private static AccessRequestResponseDto MapToDto(AccessRequestEntity r) => new(
        r.AccessReqId, r.UserId, r.ReqTo, r.IsAgreed, r.ItsrNo, r.CreatedAt,
        r.AccessItems.Select(MapItemToDto).ToList()
    );

    private static AccessItemResponseDto MapItemToDto(AccessItemEntity i) => new(
        i.AccessItemId, i.TicketNumber, i.FolderPath, i.AccessType,
        i.ConfirmAccessType, i.Status, i.Reason, i.CreatedAt, i.UpdatedAt
    );
}