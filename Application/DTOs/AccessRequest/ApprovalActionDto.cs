using Domain.Enums;

namespace Application.DTOs.AccessRequest;

public sealed record HodApprovalDto(
    int AccessItemId,
    int ApproverId,
    bool IsApproved,
    string Comments
);

public sealed record ItApprovalDto(
    int AccessItemId,
    int ApproverId,
    bool IsApproved,
    string Comments
);