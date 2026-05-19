using Application.Common;
using Application.DTOs.AccessRequest;
using Application.DTOs.Audit;

namespace Application.Interfaces;

public interface IAccessRequestService
{
    Task<Result<AccessRequestResponseDto>> CreateRequestAsync(CreateAccessRequestDto dto, CancellationToken ct = default);
    Task<Result<AccessRequestResponseDto>> GetRequestAsync(int accessReqId, CancellationToken ct = default);
    Task<Result<List<AccessRequestResponseDto>>> GetMyRequestsAsync(int userId, CancellationToken ct = default);

    // HOD actions — acts on each AccessItem individually
    Task<Result<bool>> HodApproveItemAsync(HodApprovalDto dto, CancellationToken ct = default);
    Task<Result<bool>> HodRejectItemAsync(HodApprovalDto dto, CancellationToken ct = default);
    Task<Result<List<AccessRequestResponseDto>>> GetPendingForHodAsync(int hodId, CancellationToken ct = default);

    // IT Operator actions
    Task<Result<bool>> ItApproveItemAsync(ItApprovalDto dto, CancellationToken ct = default);
    Task<Result<bool>> ItRejectItemAsync(ItApprovalDto dto, CancellationToken ct = default);
    Task<Result<List<AccessItemResponseDto>>> GetPendingForItAsync(CancellationToken ct = default);

    // Admin actions
    Task<Result<List<AccessRequestResponseDto>>> GetAllRequestsAsync(CancellationToken ct = default);

    // Audit / notification
    Task<Result<List<AccessReqAuditDto>>> GetAuditTrailAsync(int accessReqId, CancellationToken ct = default);
    Task<Result<List<AccessReqAuditDto>>> GetUnreadNotificationsAsync(int userId, CancellationToken ct = default);
    Task<Result<bool>> MarkNotificationsReadAsync(int userId, CancellationToken ct = default);
}