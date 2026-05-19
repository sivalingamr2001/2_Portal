using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities;

[Table("jan_department")]
public sealed class DepartmentEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int DepartmentId { get; set; }

    [Required]
    [Column("dept_name")]
    public string DepartmentName { get; set; } = string.Empty;

    [Required]
    [Column("hod_id")]
    public int HodId { get; set; }
}
