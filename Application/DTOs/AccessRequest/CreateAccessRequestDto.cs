using Domain.Enums;

namespace Application.DTOs.AccessRequest;

public sealed record CreateAccessRequestDto(
    int UserId,
    int ReqTo,
    bool IsAgreed,
    string? ItsrNo,
    List<CreateAccessItemDto> Items
);

public sealed record CreateAccessItemDto(
    string FolderPath,
    AccessTypes AccessType,
    int ConfirmAccessTypeByHOD,
    string Reason
);