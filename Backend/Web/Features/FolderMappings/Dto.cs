using Web.Features.Hod;

namespace Web.Features.FolderMappings;

public sealed record FolderMappingRecord
{
    public int Id { get; init; }
    public string FolderPath { get; init; } = string.Empty;
    public int PrimaryHodUserId { get; init; }
    public HodRecord? PrimaryHod { get; init; }
    public int? SecondaryHodUserId { get; init; }
    public HodRecord? SecondaryHod { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime? ModifiedAt { get; init; }
    public string? ModifiedBy { get; init; }
}

public sealed record FolderMappingCreateRequest
{
    public string FolderPath { get; init; } = string.Empty;
    public int PrimaryHodUserId { get; init; }
    public int? SecondaryHodUserId { get; init; }
    public bool IsActive { get; init; } = true;
}

public sealed record FolderMappingUpdateRequest
{
    public string FolderPath { get; init; } = string.Empty;
    public int PrimaryHodUserId { get; init; }
    public int? SecondaryHodUserId { get; init; }
    public bool IsActive { get; init; } = true;
}
