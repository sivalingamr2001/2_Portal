namespace Server.Domain.Entities;

using global::Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("jan_folder_mappings")]
public sealed class FolderMappingEntity : BaseAuditableEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("folder_name")]
    public string FolderName { get; set; } = null!;
    [Column("primary_hod_id")] public string? PrimaryHodId { get; set; }
    [Column("primary_hod_name")] public string? PrimaryHodName { get; set; }
    [Column("primary_hod_email")] public string? PrimaryHodEmail { get; set; }
    [Column("secondary_hod_id")] public string? SecondaryHodId { get; set; }
    [Column("secondary_hod_name")] public string? SecondaryHodName { get; set; }
    [Column("secondary_hod_email")] public string? SecondaryHodEmail { get; set; }
}
