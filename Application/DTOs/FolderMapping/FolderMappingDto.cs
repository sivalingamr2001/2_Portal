// Application/DTOs/FolderMapping/FolderMappingDto.cs
namespace Application.DTOs.FolderMapping;

public sealed record CreateFolderMappingDto(
    string FolderName,
    string? PrimaryHodId,
    string? PrimaryHodName,
    string? PrimaryHodEmail,
    string? SecondaryHodId,
    string? SecondaryHodName,
    string? SecondaryHodEmail
);

public sealed record UpdateFolderMappingDto(
    int Id,
    string FolderName,
    string? PrimaryHodId,
    string? PrimaryHodName,
    string? PrimaryHodEmail,
    string? SecondaryHodId,
    string? SecondaryHodName,
    string? SecondaryHodEmail
);

public sealed record FolderMappingResponseDto(
    int Id,
    string FolderName,
    string? PrimaryHodId,
    string? PrimaryHodName,
    string? PrimaryHodEmail,
    string? SecondaryHodId,
    string? SecondaryHodName,
    string? SecondaryHodEmail,
    bool IsActive,
    DateTime CreatedAt
);