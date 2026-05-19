using Domain.DomainEnums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    /// <summary>
    /// Example User Entity for database persistence.
    /// </summary>
    [Table("jan_portal_users")]
    public sealed class User : BaseAuditableEntity
    {
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("user_role")]
        public UserRole? UserRole { get; set; }
    }
}
