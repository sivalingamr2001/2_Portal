using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Server.Domain.Entities;

namespace Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<DepartmentEntity> Departments => Set<DepartmentEntity>();
    public DbSet<AccessRequestEntity> AccessRequests => Set<AccessRequestEntity>();
    public DbSet<AccessItemEntity> AccessItems => Set<AccessItemEntity>();
    public DbSet<AccessApprovalEntity> AccessApprovals => Set<AccessApprovalEntity>();
    public DbSet<AccessReqAuditEntity> AccessReqAudits => Set<AccessReqAuditEntity>();
    public DbSet<FolderMappingEntity> FolderMappings => Set<FolderMappingEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Employee Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("jan_portal_users");
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.UserId).ValueGeneratedNever();
        });

        // Department Configuration
        modelBuilder.Entity<DepartmentEntity>(entity =>
        {
            entity.ToTable("jan_department");
            entity.HasKey(d => d.DepartmentId);
        });

        // Access Request Configurations
        modelBuilder.Entity<AccessRequestEntity>(entity =>
        {
            entity.ToTable("jan_accessrequest").HasKey(request => request.AccessReqId);
            entity.HasMany(p => p.AccessItems)
                  .WithOne()
                  .HasForeignKey(c => c.AccessReqId);
        });

        modelBuilder.Entity<AccessItemEntity>().ToTable("jan_accessitems").HasKey(item => item.AccessItemId);
        modelBuilder.Entity<AccessApprovalEntity>().ToTable("jan_accessapproval").HasKey(approval => approval.AccessApproveId);
        modelBuilder.Entity<AccessReqAuditEntity>().ToTable("jan_accessreqaudit").HasKey(audit => audit.AuditId);

        modelBuilder.Entity<FolderMappingEntity>(entity =>
        {
            entity.ToTable("jan_folder_mappings").HasKey(mapping => mapping.Id);
            entity.HasIndex(mapping => mapping.FolderName).IsUnique();
        });
    }
}