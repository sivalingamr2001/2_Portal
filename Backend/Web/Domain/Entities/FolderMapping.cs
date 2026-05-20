using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;

namespace Web.Domain.Entities;

[Table("jan_portal_folder_mappings")]
public sealed class FolderMapping : AuditableEntity
{
    [Column("folder_path")]
    public string FolderPath { get; private set; } = string.Empty;

    [Column("primary_hod_user_id")]
    public int PrimaryHodUserId { get; private set; }

    [Column("secondary_hod_user_id")]
    public int? SecondaryHodUserId { get; private set; }

    [Column("is_active")]
    public bool IsActive { get; private set; }

    private FolderMapping() { }

    public static FolderMapping Create(
        string folderPath,
        int primaryHodUserId,
        int? secondaryHodUserId,
        bool isActive,
        string createdBy)
    {
        var mapping = new FolderMapping();
        mapping.Update(folderPath, primaryHodUserId, secondaryHodUserId, isActive, createdBy);
        mapping.CreatedAt = DateTime.UtcNow;
        mapping.CreatedBy = createdBy;
        return mapping;
    }

    public void Update(
        string folderPath,
        int primaryHodUserId,
        int? secondaryHodUserId,
        bool isActive,
        string modifiedBy)
    {
        FolderPath = folderPath.Trim();
        PrimaryHodUserId = primaryHodUserId;
        SecondaryHodUserId = secondaryHodUserId;
        IsActive = isActive;
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = modifiedBy;
    }
}
