using Domain.Enums;

namespace Application.DTOs.AccessRequest;

public sealed record AccessRequestResponseDto(
    int AccessReqId,
    int UserId,
    int ReqTo,
    bool IsAgreed,
    string? ItsrNo,
    DateTime CreatedAt,
    List<AccessItemResponseDto> Items
);

public sealed record AccessItemResponseDto(
    int AccessItemId,
    string TicketNumber,
    string FolderPath,
    AccessTypes AccessType,
    AccessTypes ConfirmAccessType,
    RequestStatus Status,
    string Reason,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);