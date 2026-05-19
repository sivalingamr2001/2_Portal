# File Access Portal — Full Implementation Guide

> **Stack:** .NET 8 Minimal API · Vertical Slice Architecture · EF Core · MediatR · FluentValidation  
> **Entities covered:** `AccessRequestEntity`, `AccessItemEntity`, `AccessApprovalEntity`, `AccessReqAuditEntity`, `FolderMappingEntity`, `DepartmentEntity`, `User`

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Shared Primitives](#2-shared-primitives)
3. [DTOs](#3-dtos)
4. [Repository Interfaces](#4-repository-interfaces)
5. [Repository Implementations](#5-repository-implementations)
6. [Service Interfaces](#6-service-interfaces)
7. [Service Implementations](#7-service-implementations)
   - [7.1 AccessRequestService](#71-accessrequestservice)
   - [7.2 FolderMappingService](#72-foldermappingservice)
   - [7.3 DepartmentService](#73-departmentservice)
   - [7.4 NotificationService](#74-notificationservice)
   - [7.5 AuditService](#75-auditservice)
8. [Controllers / Endpoints](#8-controllers--endpoints)
9. [Background Job — Expiry & Reminder](#9-background-job--expiry--reminder)
10. [DI Registration](#10-di-registration)
11. [Workflow State Machine Reference](#11-workflow-state-machine-reference)

---

## 1. Project Structure

```
src/
├── Domain/
│   ├── Entities/
│   │   ├── BaseAuditableEntity.cs
│   │   ├── User.cs
│   │   ├── Department.cs
│   │   ├── FolderMapping.cs
│   │   └── FileAccessRequest.cs   (AccessRequestEntity, AccessItemEntity,
│   │                                AccessApprovalEntity, AccessReqAuditEntity)
│   └── Enums/
│       ├── AccessTypes.cs
│       └── RequestStatus.cs
│
├── Application/
│   ├── Common/
│   │   ├── Result.cs
│   │   └── PagedResult.cs
│   ├── DTOs/
│   │   ├── AccessRequest/
│   │   ├── FolderMapping/
│   │   └── Department/
│   ├── Interfaces/
│   │   ├── Repositories/
│   │   └── Services/
│   └── Services/
│       ├── AccessRequestService.cs
│       ├── FolderMappingService.cs
│       ├── DepartmentService.cs
│       ├── NotificationService.cs
│       └── AuditService.cs
│
├── Infrastructure/
│   ├── Persistence/
│   │   ├── AppDbContext.cs
│   │   └── Repositories/
│   │       ├── AccessRequestRepository.cs
│   │       ├── FolderMappingRepository.cs
│   │       └── DepartmentRepository.cs
│   └── BackgroundJobs/
│       └── AccessExpiryJob.cs
│
└── API/
    └── Endpoints/
        ├── AccessRequestEndpoints.cs
        ├── FolderMappingEndpoints.cs
        └── DepartmentEndpoints.cs
```

---

## 2. Shared Primitives

```csharp
// Application/Common/Result.cs
namespace Application.Common;

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string? Error { get; private set; }
    public int StatusCode { get; private set; }

    private Result() { }

    public static Result<T> Success(T data, int statusCode = 200) =>
        new() { IsSuccess = true, Data = data, StatusCode = statusCode };

    public static Result<T> Failure(string error, int statusCode = 400) =>
        new() { IsSuccess = false, Error = error, StatusCode = statusCode };

    public static Result<T> NotFound(string error = "Resource not found") =>
        Failure(error, 404);

    public static Result<T> Forbidden(string error = "Access denied") =>
        Failure(error, 403);
}
```

```csharp
// Application/Common/PagedResult.cs
namespace Application.Common;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
```

---

## 3. DTOs

### 3.1 Access Request DTOs

```csharp
// Application/DTOs/AccessRequest/CreateAccessRequestDto.cs
namespace Application.DTOs.AccessRequest;

public sealed record CreateAccessRequestDto(
    int UserId,
    int ReqTo,
    bool IsAgreed,
    List<CreateAccessItemDto> Items
);

public sealed record CreateAccessItemDto(
    string FolderPath,
    AccessTypes AccessType,
    string Reason
);
```

```csharp
// Application/DTOs/AccessRequest/AccessRequestResponseDto.cs
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
```

```csharp
// Application/DTOs/AccessRequest/ApprovalActionDto.cs
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
    string Comments,
    AccessTypes? ConfirmedAccessType  // IT can downgrade Read&Write → ReadOnly
);
```

### 3.2 Folder Mapping DTOs

```csharp
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
```

### 3.3 Department DTOs

```csharp
// Application/DTOs/Department/DepartmentDto.cs
namespace Application.DTOs.Department;

public sealed record CreateDepartmentDto(
    string DepartmentName,
    int HodId
);

public sealed record UpdateDepartmentDto(
    int DepartmentId,
    string DepartmentName,
    int HodId
);

public sealed record DepartmentResponseDto(
    int DepartmentId,
    string DepartmentName,
    int HodId
);
```

---

## 4. Repository Interfaces

```csharp
// Application/Interfaces/Repositories/IAccessRequestRepository.cs
namespace Application.Interfaces.Repositories;

public interface IAccessRequestRepository
{
    // --- AccessRequest ---
    Task<AccessRequestEntity?> GetByIdAsync(int accessReqId, CancellationToken ct = default);
    Task<AccessRequestEntity?> GetWithItemsAsync(int accessReqId, CancellationToken ct = default);
    Task<List<AccessRequestEntity>> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task<List<AccessRequestEntity>> GetPendingByHodIdAsync(int hodId, CancellationToken ct = default);
    Task<List<AccessRequestEntity>> GetAllAsync(CancellationToken ct = default);
    Task<AccessRequestEntity> AddAsync(AccessRequestEntity entity, CancellationToken ct = default);
    Task UpdateAsync(AccessRequestEntity entity, CancellationToken ct = default);

    // --- AccessItem ---
    Task<AccessItemEntity?> GetItemByIdAsync(int accessItemId, CancellationToken ct = default);
    Task<List<AccessItemEntity>> GetItemsByRequestIdAsync(int accessReqId, CancellationToken ct = default);
    Task<List<AccessItemEntity>> GetItemsPendingHodAsync(int hodDeptId, CancellationToken ct = default);
    Task<List<AccessItemEntity>> GetItemsPendingItAsync(CancellationToken ct = default);
    Task<List<AccessItemEntity>> GetItemsGrantedExpiringBeforeAsync(DateTime threshold, CancellationToken ct = default);
    Task UpdateItemAsync(AccessItemEntity entity, CancellationToken ct = default);

    // --- AccessApproval ---
    Task<AccessApprovalEntity> AddApprovalAsync(AccessApprovalEntity entity, CancellationToken ct = default);
    Task<List<AccessApprovalEntity>> GetApprovalsByItemIdAsync(int accessItemId, CancellationToken ct = default);

    // --- Audit ---
    Task AddAuditAsync(AccessReqAuditEntity entity, CancellationToken ct = default);
    Task<List<AccessReqAuditEntity>> GetAuditsByRequestIdAsync(int accessReqId, CancellationToken ct = default);
    Task<List<AccessReqAuditEntity>> GetUnreadNotificationsAsync(int userId, CancellationToken ct = default);
    Task MarkNotificationsReadAsync(int userId, CancellationToken ct = default);
}
```

```csharp
// Application/Interfaces/Repositories/IFolderMappingRepository.cs
namespace Application.Interfaces.Repositories;

public interface IFolderMappingRepository
{
    Task<FolderMappingEntity?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<FolderMappingEntity>> GetAllAsync(CancellationToken ct = default);
    Task<List<FolderMappingEntity>> GetByHodIdAsync(string hodId, CancellationToken ct = default);
    Task<FolderMappingEntity?> GetByFolderNameAsync(string folderName, CancellationToken ct = default);
    Task<FolderMappingEntity> AddAsync(FolderMappingEntity entity, CancellationToken ct = default);
    Task UpdateAsync(FolderMappingEntity entity, CancellationToken ct = default);
    Task<bool> ExistsAsync(string folderName, CancellationToken ct = default);
}
```

```csharp
// Application/Interfaces/Repositories/IDepartmentRepository.cs
namespace Application.Interfaces.Repositories;

public interface IDepartmentRepository
{
    Task<DepartmentEntity?> GetByIdAsync(int departmentId, CancellationToken ct = default);
    Task<List<DepartmentEntity>> GetAllAsync(CancellationToken ct = default);
    Task<DepartmentEntity?> GetByHodIdAsync(int hodId, CancellationToken ct = default);
    Task<DepartmentEntity> AddAsync(DepartmentEntity entity, CancellationToken ct = default);
    Task UpdateAsync(DepartmentEntity entity, CancellationToken ct = default);
    Task<bool> ExistsAsync(int departmentId, CancellationToken ct = default);
}
```

---

## 5. Repository Implementations

```csharp
// Infrastructure/Persistence/Repositories/AccessRequestRepository.cs
namespace Infrastructure.Persistence.Repositories;

public sealed class AccessRequestRepository(AppDbContext db) : IAccessRequestRepository
{
    // ── AccessRequest ──────────────────────────────────────────────────────────

    public Task<AccessRequestEntity?> GetByIdAsync(int id, CancellationToken ct) =>
        db.AccessRequests.AsNoTracking().FirstOrDefaultAsync(x => x.AccessReqId == id, ct);

    public Task<AccessRequestEntity?> GetWithItemsAsync(int id, CancellationToken ct) =>
        db.AccessRequests
          .Include(r => r.AccessItems)
          .AsNoTracking()
          .FirstOrDefaultAsync(x => x.AccessReqId == id, ct);

    public Task<List<AccessRequestEntity>> GetByUserIdAsync(int userId, CancellationToken ct) =>
        db.AccessRequests
          .Where(r => r.UserId == userId)
          .Include(r => r.AccessItems)
          .AsNoTracking()
          .ToListAsync(ct);

    public async Task<List<AccessRequestEntity>> GetPendingByHodIdAsync(int hodId, CancellationToken ct) =>
        await db.AccessRequests
                .Where(r => r.ReqTo == hodId &&
                            r.AccessItems.Any(i => i.Status == RequestStatus.PendingHOD))
                .Include(r => r.AccessItems)
                .AsNoTracking()
                .ToListAsync(ct);

    public Task<List<AccessRequestEntity>> GetAllAsync(CancellationToken ct) =>
        db.AccessRequests.Include(r => r.AccessItems).AsNoTracking().ToListAsync(ct);

    public async Task<AccessRequestEntity> AddAsync(AccessRequestEntity entity, CancellationToken ct)
    {
        db.AccessRequests.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(AccessRequestEntity entity, CancellationToken ct)
    {
        db.AccessRequests.Update(entity);
        await db.SaveChangesAsync(ct);
    }

    // ── AccessItem ─────────────────────────────────────────────────────────────

    public Task<AccessItemEntity?> GetItemByIdAsync(int id, CancellationToken ct) =>
        db.AccessItems.AsNoTracking().FirstOrDefaultAsync(x => x.AccessItemId == id, ct);

    public Task<List<AccessItemEntity>> GetItemsByRequestIdAsync(int accessReqId, CancellationToken ct) =>
        db.AccessItems.Where(i => i.AccessReqId == accessReqId).AsNoTracking().ToListAsync(ct);

    public Task<List<AccessItemEntity>> GetItemsPendingHodAsync(int hodDeptId, CancellationToken ct) =>
        db.AccessItems.Where(i => i.Status == RequestStatus.PendingHOD).AsNoTracking().ToListAsync(ct);

    public Task<List<AccessItemEntity>> GetItemsPendingItAsync(CancellationToken ct) =>
        db.AccessItems.Where(i => i.Status == RequestStatus.PendingIT).AsNoTracking().ToListAsync(ct);

    public Task<List<AccessItemEntity>> GetItemsGrantedExpiringBeforeAsync(DateTime threshold, CancellationToken ct) =>
        db.AccessItems
          .Where(i => i.Status == RequestStatus.AccessGranted && i.UpdatedAt.HasValue
                      && i.UpdatedAt.Value.AddDays(90) <= threshold)
          .AsNoTracking()
          .ToListAsync(ct);

    public async Task UpdateItemAsync(AccessItemEntity entity, CancellationToken ct)
    {
        db.AccessItems.Update(entity);
        await db.SaveChangesAsync(ct);
    }

    // ── AccessApproval ─────────────────────────────────────────────────────────

    public async Task<AccessApprovalEntity> AddApprovalAsync(AccessApprovalEntity entity, CancellationToken ct)
    {
        db.AccessApprovals.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }

    public Task<List<AccessApprovalEntity>> GetApprovalsByItemIdAsync(int accessItemId, CancellationToken ct) =>
        db.AccessApprovals.Where(a => a.AccessItemId == accessItemId).AsNoTracking().ToListAsync(ct);

    // ── Audit ──────────────────────────────────────────────────────────────────

    public async Task AddAuditAsync(AccessReqAuditEntity entity, CancellationToken ct)
    {
        db.AccessReqAudits.Add(entity);
        await db.SaveChangesAsync(ct);
    }

    public Task<List<AccessReqAuditEntity>> GetAuditsByRequestIdAsync(int accessReqId, CancellationToken ct) =>
        db.AccessReqAudits.Where(a => a.AccessReqId == accessReqId).AsNoTracking().ToListAsync(ct);

    public Task<List<AccessReqAuditEntity>> GetUnreadNotificationsAsync(int userId, CancellationToken ct) =>
        db.AccessReqAudits
          .Where(a => a.RecipientUserId == userId && !a.IsRead)
          .AsNoTracking()
          .ToListAsync(ct);

    public async Task MarkNotificationsReadAsync(int userId, CancellationToken ct)
    {
        await db.AccessReqAudits
                .Where(a => a.RecipientUserId == userId && !a.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsRead, true), ct);
    }
}
```

```csharp
// Infrastructure/Persistence/Repositories/FolderMappingRepository.cs
namespace Infrastructure.Persistence.Repositories;

public sealed class FolderMappingRepository(AppDbContext db) : IFolderMappingRepository
{
    public Task<FolderMappingEntity?> GetByIdAsync(int id, CancellationToken ct) =>
        db.FolderMappings.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, ct);

    public Task<List<FolderMappingEntity>> GetAllAsync(CancellationToken ct) =>
        db.FolderMappings.AsNoTracking().ToListAsync(ct);

    public Task<List<FolderMappingEntity>> GetByHodIdAsync(string hodId, CancellationToken ct) =>
        db.FolderMappings
          .Where(f => f.PrimaryHodId == hodId || f.SecondaryHodId == hodId)
          .AsNoTracking()
          .ToListAsync(ct);

    public Task<FolderMappingEntity?> GetByFolderNameAsync(string folderName, CancellationToken ct) =>
        db.FolderMappings.AsNoTracking().FirstOrDefaultAsync(f => f.FolderName == folderName, ct);

    public async Task<FolderMappingEntity> AddAsync(FolderMappingEntity entity, CancellationToken ct)
    {
        db.FolderMappings.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(FolderMappingEntity entity, CancellationToken ct)
    {
        db.FolderMappings.Update(entity);
        await db.SaveChangesAsync(ct);
    }

    public Task<bool> ExistsAsync(string folderName, CancellationToken ct) =>
        db.FolderMappings.AnyAsync(f => f.FolderName == folderName, ct);
}
```

```csharp
// Infrastructure/Persistence/Repositories/DepartmentRepository.cs
namespace Infrastructure.Persistence.Repositories;

public sealed class DepartmentRepository(AppDbContext db) : IDepartmentRepository
{
    public Task<DepartmentEntity?> GetByIdAsync(int id, CancellationToken ct) =>
        db.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.DepartmentId == id, ct);

    public Task<List<DepartmentEntity>> GetAllAsync(CancellationToken ct) =>
        db.Departments.AsNoTracking().ToListAsync(ct);

    public Task<DepartmentEntity?> GetByHodIdAsync(int hodId, CancellationToken ct) =>
        db.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.HodId == hodId, ct);

    public async Task<DepartmentEntity> AddAsync(DepartmentEntity entity, CancellationToken ct)
    {
        db.Departments.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(DepartmentEntity entity, CancellationToken ct)
    {
        db.Departments.Update(entity);
        await db.SaveChangesAsync(ct);
    }

    public Task<bool> ExistsAsync(int id, CancellationToken ct) =>
        db.Departments.AnyAsync(d => d.DepartmentId == id, ct);
}
```

---

## 6. Service Interfaces

```csharp
// Application/Interfaces/Services/IAccessRequestService.cs
namespace Application.Interfaces.Services;

public interface IAccessRequestService
{
    // User actions
    Task<Result<AccessRequestResponseDto>> CreateRequestAsync(CreateAccessRequestDto dto, CancellationToken ct = default);
    Task<Result<AccessRequestResponseDto>> GetRequestAsync(int accessReqId, CancellationToken ct = default);
    Task<Result<List<AccessRequestResponseDto>>> GetMyRequestsAsync(int userId, CancellationToken ct = default);

    // HOD actions — acts on each AccessItem individually
    Task<Result<bool>> HodApproveItemAsync(HodApprovalDto dto, CancellationToken ct = default);
    Task<Result<bool>> HodRejectItemAsync(HodApprovalDto dto, CancellationToken ct = default);
    Task<Result<List<AccessRequestResponseDto>>> GetPendingForHodAsync(int hodId, CancellationToken ct = default);

    // IT Operator actions
    Task<Result<bool>> ItApproveItemAsync(ItApprovalDto dto, CancellationToken ct = default);
    Task<Result<bool>> ItRejectItemAsync(ItApprovalDto dto, CancellationToken ct = default);
    Task<Result<List<AccessItemResponseDto>>> GetPendingForItAsync(CancellationToken ct = default);

    // Admin actions
    Task<Result<List<AccessRequestResponseDto>>> GetAllRequestsAsync(CancellationToken ct = default);

    // Audit / notification
    Task<Result<List<AccessReqAuditDto>>> GetAuditTrailAsync(int accessReqId, CancellationToken ct = default);
    Task<Result<List<AccessReqAuditDto>>> GetUnreadNotificationsAsync(int userId, CancellationToken ct = default);
    Task<Result<bool>> MarkNotificationsReadAsync(int userId, CancellationToken ct = default);
}
```

```csharp
// Application/Interfaces/Services/IFolderMappingService.cs
namespace Application.Interfaces.Services;

public interface IFolderMappingService
{
    Task<Result<FolderMappingResponseDto>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Result<List<FolderMappingResponseDto>>> GetAllAsync(CancellationToken ct = default);
    Task<Result<List<FolderMappingResponseDto>>> GetByHodIdAsync(string hodId, CancellationToken ct = default);
    Task<Result<FolderMappingResponseDto>> CreateAsync(CreateFolderMappingDto dto, string createdBy, CancellationToken ct = default);
    Task<Result<FolderMappingResponseDto>> UpdateAsync(UpdateFolderMappingDto dto, string updatedBy, CancellationToken ct = default);
    Task<Result<bool>> DeactivateAsync(int id, string updatedBy, CancellationToken ct = default);

    /// <summary>
    /// Assign or replace primary/secondary HOD for a folder.
    /// </summary>
    Task<Result<FolderMappingResponseDto>> AssignHodAsync(
        int folderId,
        string? primaryHodId, string? primaryHodName, string? primaryHodEmail,
        string? secondaryHodId, string? secondaryHodName, string? secondaryHodEmail,
        string updatedBy,
        CancellationToken ct = default);
}
```

```csharp
// Application/Interfaces/Services/IDepartmentService.cs
namespace Application.Interfaces.Services;

public interface IDepartmentService
{
    Task<Result<DepartmentResponseDto>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Result<List<DepartmentResponseDto>>> GetAllAsync(CancellationToken ct = default);
    Task<Result<DepartmentResponseDto>> CreateAsync(CreateDepartmentDto dto, CancellationToken ct = default);
    Task<Result<DepartmentResponseDto>> UpdateAsync(UpdateDepartmentDto dto, CancellationToken ct = default);
}
```

```csharp
// Application/Interfaces/Services/INotificationService.cs
namespace Application.Interfaces.Services;

public interface INotificationService
{
    Task NotifyUserAsync(int userId, string eventType, string message, int accessReqId,
        int? accessItemId = null, int? approvalId = null, CancellationToken ct = default);

    Task NotifyRoleAsync(string roleName, string eventType, string message, int accessReqId,
        int? accessItemId = null, CancellationToken ct = default);
}
```

```csharp
// Application/Interfaces/Services/IAuditService.cs
namespace Application.Interfaces.Services;

public interface IAuditService
{
    Task RecordAsync(int accessReqId, string eventType, string message,
        int recipientUserId, string recipientName, string recipientRole,
        int? accessItemId = null, int? approvalId = null,
        CancellationToken ct = default);
}
```

---

## 7. Service Implementations

### 7.1 AccessRequestService

```csharp
// Application/Services/AccessRequestService.cs
namespace Application.Services;

public sealed class AccessRequestService(
    IAccessRequestRepository repo,
    IDepartmentRepository deptRepo,
    IAuditService audit,
    INotificationService notify,
    ILogger<AccessRequestService> logger
) : IAccessRequestService
{
    private const int AccessValidDays = 90;

    // ── Create ─────────────────────────────────────────────────────────────────

    public async Task<Result<AccessRequestResponseDto>> CreateRequestAsync(
        CreateAccessRequestDto dto, CancellationToken ct)
    {
        if (!dto.IsAgreed)
            return Result<AccessRequestResponseDto>.Failure("User must agree to terms.");

        // Resolve HOD from user's department
        var userDept = await deptRepo.GetByHodIdAsync(dto.ReqTo, ct);
        if (userDept is null)
            return Result<AccessRequestResponseDto>.NotFound("HOD / Department not found.");

        var request = new AccessRequestEntity
        {
            UserId    = dto.UserId,
            ReqTo     = dto.ReqTo,
            IsAgreed  = true,
            CreatedBy = dto.UserId.ToString(),
            AccessItems = dto.Items.Select(i => new AccessItemEntity
            {
                TicketNumber = GenerateTicket(),
                FolderPath   = i.FolderPath,
                AccessType   = i.AccessType,
                Status       = RequestStatus.PendingHOD,
                Reason       = i.Reason,
                CreatedBy    = dto.UserId.ToString()
            }).ToList()
        };

        var created = await repo.AddAsync(request, ct);

        // Audit + notify HOD
        foreach (var item in created.AccessItems)
        {
            await audit.RecordAsync(created.AccessReqId, "RequestSubmitted",
                $"Access request for '{item.FolderPath}' submitted by user {dto.UserId}.",
                dto.ReqTo, $"HOD-{dto.ReqTo}", "HOD",
                accessItemId: item.AccessItemId, ct: ct);

            await notify.NotifyUserAsync(dto.ReqTo, "NewRequest",
                $"New access request #{item.TicketNumber} awaiting your approval.",
                created.AccessReqId, item.AccessItemId, ct: ct);
        }

        // Notify requester
        await notify.NotifyUserAsync(dto.UserId, "RequestSubmitted",
            $"Your access request #{created.AccessReqId} has been submitted.",
            created.AccessReqId, ct: ct);

        return Result<AccessRequestResponseDto>.Success(MapToDto(created), 201);
    }

    // ── HOD Approval ───────────────────────────────────────────────────────────

    public async Task<Result<bool>> HodApproveItemAsync(HodApprovalDto dto, CancellationToken ct)
    {
        var item = await repo.GetItemByIdAsync(dto.AccessItemId, ct);
        if (item is null) return Result<bool>.NotFound("Access item not found.");
        if (item.Status != RequestStatus.PendingHOD)
            return Result<bool>.Failure("Item is not in PendingHOD state.");

        item.Status    = RequestStatus.PendingIT;  // moves to IT queue
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = dto.ApproverId.ToString();
        await repo.UpdateItemAsync(item, ct);

        var approval = new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = dto.ApproverId,
            ApprovalStatus = RequestStatus.ApprovedHOD,
            Comments       = dto.Comments,
            CreatedBy      = dto.ApproverId.ToString()
        };
        var saved = await repo.AddApprovalAsync(approval, ct);

        // Audit
        await audit.RecordAsync(item.AccessReqId, "HodApproved",
            $"HOD approved item {item.TicketNumber}. Comments: {dto.Comments}",
            dto.ApproverId, $"HOD-{dto.ApproverId}", "HOD",
            accessItemId: item.AccessItemId, approvalId: saved.AccessApproveId, ct: ct);

        // Notify IT team (role-based)
        await notify.NotifyRoleAsync("IT", "HodApproved",
            $"Ticket {item.TicketNumber} approved by HOD. Awaiting IT action.",
            item.AccessReqId, item.AccessItemId, ct);

        // Notify requester
        var req = await repo.GetByIdAsync(item.AccessReqId, ct);
        if (req is not null)
            await notify.NotifyUserAsync(req.UserId, "HodApproved",
                $"Ticket {item.TicketNumber} approved by HOD and forwarded to IT.",
                item.AccessReqId, item.AccessItemId, ct: ct);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> HodRejectItemAsync(HodApprovalDto dto, CancellationToken ct)
    {
        var item = await repo.GetItemByIdAsync(dto.AccessItemId, ct);
        if (item is null) return Result<bool>.NotFound("Access item not found.");
        if (item.Status != RequestStatus.PendingHOD)
            return Result<bool>.Failure("Item is not in PendingHOD state.");

        item.Status    = RequestStatus.RejectedHOD;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = dto.ApproverId.ToString();
        await repo.UpdateItemAsync(item, ct);

        var approval = new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = dto.ApproverId,
            ApprovalStatus = RequestStatus.RejectedHOD,
            Comments       = dto.Comments,
            CreatedBy      = dto.ApproverId.ToString()
        };
        await repo.AddApprovalAsync(approval, ct);

        await audit.RecordAsync(item.AccessReqId, "HodRejected",
            $"HOD rejected item {item.TicketNumber}. Reason: {dto.Comments}",
            dto.ApproverId, $"HOD-{dto.ApproverId}", "HOD",
            accessItemId: item.AccessItemId, ct: ct);

        var req = await repo.GetByIdAsync(item.AccessReqId, ct);
        if (req is not null)
            await notify.NotifyUserAsync(req.UserId, "HodRejected",
                $"Ticket {item.TicketNumber} was rejected by HOD: {dto.Comments}",
                item.AccessReqId, item.AccessItemId, ct: ct);

        return Result<bool>.Success(true);
    }

    // ── IT Operator Approval ───────────────────────────────────────────────────

    public async Task<Result<bool>> ItApproveItemAsync(ItApprovalDto dto, CancellationToken ct)
    {
        var item = await repo.GetItemByIdAsync(dto.AccessItemId, ct);
        if (item is null) return Result<bool>.NotFound("Access item not found.");
        if (item.Status != RequestStatus.PendingIT)
            return Result<bool>.Failure("Item is not in PendingIT state.");

        item.Status             = RequestStatus.AccessGranted;
        item.ConfirmAccessType  = dto.ConfirmedAccessType ?? item.AccessType;
        item.UpdatedAt          = DateTime.UtcNow;   // <-- 90-day clock starts here
        item.UpdatedBy          = dto.ApproverId.ToString();
        await repo.UpdateItemAsync(item, ct);

        var approval = new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = dto.ApproverId,
            ApprovalStatus = RequestStatus.AccessGranted,
            Comments       = dto.Comments,
            CreatedBy      = dto.ApproverId.ToString()
        };
        var saved = await repo.AddApprovalAsync(approval, ct);

        await audit.RecordAsync(item.AccessReqId, "AccessGranted",
            $"IT granted access for ticket {item.TicketNumber}. ITSR: {item.ItsrNo ?? "N/A"}. Expires: {item.UpdatedAt.Value.AddDays(90):yyyy-MM-dd}.",
            dto.ApproverId, $"IT-{dto.ApproverId}", "IT",
            accessItemId: item.AccessItemId, approvalId: saved.AccessApproveId, ct: ct);

        var req = await repo.GetByIdAsync(item.AccessReqId, ct);
        if (req is not null)
            await notify.NotifyUserAsync(req.UserId, "AccessGranted",
                $"Access granted for ticket {item.TicketNumber}. Valid for 90 days.",
                item.AccessReqId, item.AccessItemId, ct: ct);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ItRejectItemAsync(ItApprovalDto dto, CancellationToken ct)
    {
        var item = await repo.GetItemByIdAsync(dto.AccessItemId, ct);
        if (item is null) return Result<bool>.NotFound("Access item not found.");
        if (item.Status != RequestStatus.PendingIT)
            return Result<bool>.Failure("Item is not in PendingIT state.");

        item.Status    = RequestStatus.AccessRejected;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = dto.ApproverId.ToString();
        await repo.UpdateItemAsync(item, ct);

        var approval = new AccessApprovalEntity
        {
            AccessReqId    = item.AccessReqId,
            AccessItemId   = item.AccessItemId,
            ApproverId     = dto.ApproverId,
            ApprovalStatus = RequestStatus.AccessRejected,
            Comments       = dto.Comments,
            CreatedBy      = dto.ApproverId.ToString()
        };
        await repo.AddApprovalAsync(approval, ct);

        await audit.RecordAsync(item.AccessReqId, "AccessRejected",
            $"IT rejected ticket {item.TicketNumber}. Reason: {dto.Comments}",
            dto.ApproverId, $"IT-{dto.ApproverId}", "IT",
            accessItemId: item.AccessItemId, ct: ct);

        var req = await repo.GetByIdAsync(item.AccessReqId, ct);
        if (req is not null)
            await notify.NotifyUserAsync(req.UserId, "AccessRejected",
                $"Access request for ticket {item.TicketNumber} was rejected by IT: {dto.Comments}",
                item.AccessReqId, item.AccessItemId, ct: ct);

        return Result<bool>.Success(true);
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    public async Task<Result<AccessRequestResponseDto>> GetRequestAsync(int id, CancellationToken ct)
    {
        var req = await repo.GetWithItemsAsync(id, ct);
        return req is null
            ? Result<AccessRequestResponseDto>.NotFound()
            : Result<AccessRequestResponseDto>.Success(MapToDto(req));
    }

    public async Task<Result<List<AccessRequestResponseDto>>> GetMyRequestsAsync(int userId, CancellationToken ct)
    {
        var list = await repo.GetByUserIdAsync(userId, ct);
        return Result<List<AccessRequestResponseDto>>.Success(list.Select(MapToDto).ToList());
    }

    public async Task<Result<List<AccessRequestResponseDto>>> GetPendingForHodAsync(int hodId, CancellationToken ct)
    {
        var list = await repo.GetPendingByHodIdAsync(hodId, ct);
        return Result<List<AccessRequestResponseDto>>.Success(list.Select(MapToDto).ToList());
    }

    public async Task<Result<List<AccessItemResponseDto>>> GetPendingForItAsync(CancellationToken ct)
    {
        var items = await repo.GetItemsPendingItAsync(ct);
        return Result<List<AccessItemResponseDto>>.Success(items.Select(MapItemToDto).ToList());
    }

    public async Task<Result<List<AccessRequestResponseDto>>> GetAllRequestsAsync(CancellationToken ct)
    {
        var list = await repo.GetAllAsync(ct);
        return Result<List<AccessRequestResponseDto>>.Success(list.Select(MapToDto).ToList());
    }

    public async Task<Result<List<AccessReqAuditDto>>> GetAuditTrailAsync(int accessReqId, CancellationToken ct)
    {
        var audits = await repo.GetAuditsByRequestIdAsync(accessReqId, ct);
        return Result<List<AccessReqAuditDto>>.Success(
            audits.Select(a => new AccessReqAuditDto(
                a.AuditId, a.AccessReqId, a.AccessItemId, a.EventType,
                a.Message, a.RecipientUserId, a.RecipientName, a.RecipientRole,
                a.IsRead, a.CreatedAt
            )).ToList());
    }

    public async Task<Result<List<AccessReqAuditDto>>> GetUnreadNotificationsAsync(int userId, CancellationToken ct)
    {
        var audits = await repo.GetUnreadNotificationsAsync(userId, ct);
        return Result<List<AccessReqAuditDto>>.Success(
            audits.Select(a => new AccessReqAuditDto(
                a.AuditId, a.AccessReqId, a.AccessItemId, a.EventType,
                a.Message, a.RecipientUserId, a.RecipientName, a.RecipientRole,
                a.IsRead, a.CreatedAt
            )).ToList());
    }

    public async Task<Result<bool>> MarkNotificationsReadAsync(int userId, CancellationToken ct)
    {
        await repo.MarkNotificationsReadAsync(userId, ct);
        return Result<bool>.Success(true);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static string GenerateTicket() =>
        $"TKT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

    private static AccessRequestResponseDto MapToDto(AccessRequestEntity r) => new(
        r.AccessReqId, r.UserId, r.ReqTo, r.IsAgreed, r.ItsrNo, r.CreatedAt,
        r.AccessItems.Select(MapItemToDto).ToList()
    );

    private static AccessItemResponseDto MapItemToDto(AccessItemEntity i) => new(
        i.AccessItemId, i.TicketNumber, i.FolderPath, i.AccessType,
        i.ConfirmAccessType, i.Status, i.Reason, i.CreatedAt, i.UpdatedAt
    );
}
```

### 7.2 FolderMappingService

```csharp
// Application/Services/FolderMappingService.cs
namespace Application.Services;

public sealed class FolderMappingService(
    IFolderMappingRepository repo,
    ILogger<FolderMappingService> logger
) : IFolderMappingService
{
    public async Task<Result<FolderMappingResponseDto>> GetByIdAsync(int id, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(id, ct);
        return entity is null ? Result<FolderMappingResponseDto>.NotFound() : Result<FolderMappingResponseDto>.Success(Map(entity));
    }

    public async Task<Result<List<FolderMappingResponseDto>>> GetAllAsync(CancellationToken ct)
    {
        var list = await repo.GetAllAsync(ct);
        return Result<List<FolderMappingResponseDto>>.Success(list.Select(Map).ToList());
    }

    public async Task<Result<List<FolderMappingResponseDto>>> GetByHodIdAsync(string hodId, CancellationToken ct)
    {
        var list = await repo.GetByHodIdAsync(hodId, ct);
        return Result<List<FolderMappingResponseDto>>.Success(list.Select(Map).ToList());
    }

    public async Task<Result<FolderMappingResponseDto>> CreateAsync(
        CreateFolderMappingDto dto, string createdBy, CancellationToken ct)
    {
        if (await repo.ExistsAsync(dto.FolderName, ct))
            return Result<FolderMappingResponseDto>.Failure($"Folder '{dto.FolderName}' already exists.");

        var entity = new FolderMappingEntity
        {
            FolderName        = dto.FolderName,
            PrimaryHodId      = dto.PrimaryHodId,
            PrimaryHodName    = dto.PrimaryHodName,
            PrimaryHodEmail   = dto.PrimaryHodEmail,
            SecondaryHodId    = dto.SecondaryHodId,
            SecondaryHodName  = dto.SecondaryHodName,
            SecondaryHodEmail = dto.SecondaryHodEmail,
            CreatedBy         = createdBy
        };

        var created = await repo.AddAsync(entity, ct);
        return Result<FolderMappingResponseDto>.Success(Map(created), 201);
    }

    public async Task<Result<FolderMappingResponseDto>> UpdateAsync(
        UpdateFolderMappingDto dto, string updatedBy, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(dto.Id, ct);
        if (entity is null) return Result<FolderMappingResponseDto>.NotFound();

        entity.FolderName        = dto.FolderName;
        entity.PrimaryHodId      = dto.PrimaryHodId;
        entity.PrimaryHodName    = dto.PrimaryHodName;
        entity.PrimaryHodEmail   = dto.PrimaryHodEmail;
        entity.SecondaryHodId    = dto.SecondaryHodId;
        entity.SecondaryHodName  = dto.SecondaryHodName;
        entity.SecondaryHodEmail = dto.SecondaryHodEmail;
        entity.UpdatedAt         = DateTime.UtcNow;
        entity.UpdatedBy         = updatedBy;

        await repo.UpdateAsync(entity, ct);
        return Result<FolderMappingResponseDto>.Success(Map(entity));
    }

    public async Task<Result<FolderMappingResponseDto>> AssignHodAsync(
        int folderId,
        string? primaryHodId, string? primaryHodName, string? primaryHodEmail,
        string? secondaryHodId, string? secondaryHodName, string? secondaryHodEmail,
        string updatedBy, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(folderId, ct);
        if (entity is null) return Result<FolderMappingResponseDto>.NotFound();

        entity.PrimaryHodId      = primaryHodId;
        entity.PrimaryHodName    = primaryHodName;
        entity.PrimaryHodEmail   = primaryHodEmail;
        entity.SecondaryHodId    = secondaryHodId;
        entity.SecondaryHodName  = secondaryHodName;
        entity.SecondaryHodEmail = secondaryHodEmail;
        entity.UpdatedAt         = DateTime.UtcNow;
        entity.UpdatedBy         = updatedBy;

        await repo.UpdateAsync(entity, ct);
        return Result<FolderMappingResponseDto>.Success(Map(entity));
    }

    public async Task<Result<bool>> DeactivateAsync(int id, string updatedBy, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(id, ct);
        if (entity is null) return Result<bool>.NotFound();

        entity.IsActive  = false;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.UpdatedBy = updatedBy;

        await repo.UpdateAsync(entity, ct);
        return Result<bool>.Success(true);
    }

    private static FolderMappingResponseDto Map(FolderMappingEntity e) => new(
        e.Id, e.FolderName,
        e.PrimaryHodId, e.PrimaryHodName, e.PrimaryHodEmail,
        e.SecondaryHodId, e.SecondaryHodName, e.SecondaryHodEmail,
        e.IsActive, e.CreatedAt
    );
}
```

### 7.3 DepartmentService

```csharp
// Application/Services/DepartmentService.cs
namespace Application.Services;

public sealed class DepartmentService(
    IDepartmentRepository repo,
    ILogger<DepartmentService> logger
) : IDepartmentService
{
    public async Task<Result<DepartmentResponseDto>> GetByIdAsync(int id, CancellationToken ct)
    {
        var dept = await repo.GetByIdAsync(id, ct);
        return dept is null
            ? Result<DepartmentResponseDto>.NotFound()
            : Result<DepartmentResponseDto>.Success(Map(dept));
    }

    public async Task<Result<List<DepartmentResponseDto>>> GetAllAsync(CancellationToken ct)
    {
        var list = await repo.GetAllAsync(ct);
        return Result<List<DepartmentResponseDto>>.Success(list.Select(Map).ToList());
    }

    public async Task<Result<DepartmentResponseDto>> CreateAsync(CreateDepartmentDto dto, CancellationToken ct)
    {
        var entity = new DepartmentEntity
        {
            DepartmentName = dto.DepartmentName,
            HodId          = dto.HodId
        };

        var created = await repo.AddAsync(entity, ct);
        return Result<DepartmentResponseDto>.Success(Map(created), 201);
    }

    public async Task<Result<DepartmentResponseDto>> UpdateAsync(UpdateDepartmentDto dto, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(dto.DepartmentId, ct);
        if (entity is null) return Result<DepartmentResponseDto>.NotFound();

        entity.DepartmentName = dto.DepartmentName;
        entity.HodId          = dto.HodId;

        await repo.UpdateAsync(entity, ct);
        return Result<DepartmentResponseDto>.Success(Map(entity));
    }

    private static DepartmentResponseDto Map(DepartmentEntity d) =>
        new(d.DepartmentId, d.DepartmentName, d.HodId);
}
```

### 7.4 NotificationService

```csharp
// Application/Services/NotificationService.cs
namespace Application.Services;

/// <summary>
/// Writes in-app notifications to the audit log.
/// Swap PersistAsync for email/SignalR push without changing callers.
/// </summary>
public sealed class NotificationService(
    IAccessRequestRepository repo,
    IUserRepository userRepo,   // inject your user lookup
    ILogger<NotificationService> logger
) : INotificationService
{
    public async Task NotifyUserAsync(
        int userId, string eventType, string message,
        int accessReqId, int? accessItemId = null, int? approvalId = null,
        CancellationToken ct = default)
    {
        var user = await userRepo.GetByIdAsync(userId, ct);
        var audit = new AccessReqAuditEntity
        {
            AccessReqId     = accessReqId,
            AccessItemId    = accessItemId,
            AccessApproveId = approvalId,
            EventType       = eventType,
            Message         = message,
            RecipientUserId = userId,
            RecipientName   = user?.DisplayName ?? userId.ToString(),
            RecipientRole   = user?.UserRole?.ToString() ?? "User",
            IsRead          = false,
            CreatedBy       = "system"
        };

        await repo.AddAuditAsync(audit, ct);

        // TODO: plug in email/SignalR here
        logger.LogInformation("[NOTIFY] → userId={UserId} event={Event}: {Message}", userId, eventType, message);
    }

    public async Task NotifyRoleAsync(
        string roleName, string eventType, string message,
        int accessReqId, int? accessItemId = null, CancellationToken ct = default)
    {
        var usersInRole = await userRepo.GetByRoleAsync(roleName, ct);
        foreach (var user in usersInRole)
            await NotifyUserAsync(user.UserId, eventType, message, accessReqId, accessItemId, ct: ct);
    }
}
```

### 7.5 AuditService

```csharp
// Application/Services/AuditService.cs
namespace Application.Services;

public sealed class AuditService(IAccessRequestRepository repo) : IAuditService
{
    public Task RecordAsync(
        int accessReqId, string eventType, string message,
        int recipientUserId, string recipientName, string recipientRole,
        int? accessItemId = null, int? approvalId = null, CancellationToken ct = default)
    {
        var entry = new AccessReqAuditEntity
        {
            AccessReqId     = accessReqId,
            AccessItemId    = accessItemId,
            AccessApproveId = approvalId,
            EventType       = eventType,
            Message         = message,
            RecipientUserId = recipientUserId,
            RecipientName   = recipientName,
            RecipientRole   = recipientRole,
            IsRead          = false,
            CreatedBy       = "system"
        };

        return repo.AddAuditAsync(entry, ct);
    }
}
```

---

## 8. Controllers / Endpoints

> Using .NET 8 Minimal API extension methods (`IEndpointRouteBuilder`).  
> Auth policy names: `"User"`, `"HOD"`, `"IT"`, `"Admin"`.

### 8.1 Access Request Endpoints

```csharp
// API/Endpoints/AccessRequestEndpoints.cs
namespace API.Endpoints;

public static class AccessRequestEndpoints
{
    public static IEndpointRouteBuilder MapAccessRequestEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api/access-requests").WithTags("AccessRequests");

        // ── User routes ────────────────────────────────────────────────────────

        grp.MapPost("/", CreateRequest)
           .RequireAuthorization("User")
           .WithSummary("Submit a new access request");

        grp.MapGet("/my/{userId:int}", GetMyRequests)
           .RequireAuthorization("User")
           .WithSummary("Get current user's requests");

        grp.MapGet("/{id:int}", GetRequest)
           .RequireAuthorization()
           .WithSummary("Get a single request with items");

        // ── HOD routes ─────────────────────────────────────────────────────────

        grp.MapGet("/pending/hod/{hodId:int}", GetPendingForHod)
           .RequireAuthorization("HOD")
           .WithSummary("Items pending HOD review");

        grp.MapPost("/hod/approve", HodApprove)
           .RequireAuthorization("HOD")
           .WithSummary("HOD approves a single item");

        grp.MapPost("/hod/reject", HodReject)
           .RequireAuthorization("HOD")
           .WithSummary("HOD rejects a single item");

        // ── IT routes ──────────────────────────────────────────────────────────

        grp.MapGet("/pending/it", GetPendingForIt)
           .RequireAuthorization("IT")
           .WithSummary("Items pending IT action");

        grp.MapPost("/it/approve", ItApprove)
           .RequireAuthorization("IT")
           .WithSummary("IT grants access for an item");

        grp.MapPost("/it/reject", ItReject)
           .RequireAuthorization("IT")
           .WithSummary("IT rejects access for an item");

        // ── Admin routes ───────────────────────────────────────────────────────

        grp.MapGet("/all", GetAll)
           .RequireAuthorization("Admin")
           .WithSummary("Admin: all requests");

        // ── Notification routes ────────────────────────────────────────────────

        grp.MapGet("/audit/{accessReqId:int}", GetAuditTrail)
           .RequireAuthorization()
           .WithSummary("Audit trail for a request");

        grp.MapGet("/notifications/{userId:int}", GetUnreadNotifications)
           .RequireAuthorization()
           .WithSummary("Unread notifications for a user");

        grp.MapPut("/notifications/{userId:int}/read", MarkRead)
           .RequireAuthorization()
           .WithSummary("Mark all notifications read");

        return app;
    }

    // ── Handler delegates ──────────────────────────────────────────────────────

    private static async Task<IResult> CreateRequest(
        CreateAccessRequestDto dto, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.CreateRequestAsync(dto, ct);
        return result.IsSuccess
            ? Results.Created($"/api/access-requests/{result.Data!.AccessReqId}", result.Data)
            : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> GetMyRequests(
        int userId, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.GetMyRequestsAsync(userId, ct);
        return result.IsSuccess ? Results.Ok(result.Data) : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> GetRequest(
        int id, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.GetRequestAsync(id, ct);
        return result.IsSuccess ? Results.Ok(result.Data) : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> GetPendingForHod(
        int hodId, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.GetPendingForHodAsync(hodId, ct);
        return result.IsSuccess ? Results.Ok(result.Data) : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> HodApprove(
        HodApprovalDto dto, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.HodApproveItemAsync(dto, ct);
        return result.IsSuccess ? Results.Ok() : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> HodReject(
        HodApprovalDto dto, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.HodRejectItemAsync(dto, ct);
        return result.IsSuccess ? Results.Ok() : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> GetPendingForIt(
        IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.GetPendingForItAsync(ct);
        return result.IsSuccess ? Results.Ok(result.Data) : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> ItApprove(
        ItApprovalDto dto, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.ItApproveItemAsync(dto, ct);
        return result.IsSuccess ? Results.Ok() : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> ItReject(
        ItApprovalDto dto, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.ItRejectItemAsync(dto, ct);
        return result.IsSuccess ? Results.Ok() : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> GetAll(
        IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.GetAllRequestsAsync(ct);
        return result.IsSuccess ? Results.Ok(result.Data) : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> GetAuditTrail(
        int accessReqId, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.GetAuditTrailAsync(accessReqId, ct);
        return result.IsSuccess ? Results.Ok(result.Data) : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> GetUnreadNotifications(
        int userId, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.GetUnreadNotificationsAsync(userId, ct);
        return result.IsSuccess ? Results.Ok(result.Data) : Results.Problem(result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> MarkRead(
        int userId, IAccessRequestService svc, CancellationToken ct)
    {
        var result = await svc.MarkNotificationsReadAsync(userId, ct);
        return result.IsSuccess ? Results.NoContent() : Results.Problem(result.Error, statusCode: result.StatusCode);
    }
}
```

### 8.2 Folder Mapping Endpoints

```csharp
// API/Endpoints/FolderMappingEndpoints.cs
namespace API.Endpoints;

public static class FolderMappingEndpoints
{
    public static IEndpointRouteBuilder MapFolderMappingEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api/folder-mappings")
                     .WithTags("FolderMappings")
                     .RequireAuthorization("Admin");   // all endpoints Admin-only

        grp.MapGet("/",            GetAll);
        grp.MapGet("/{id:int}",    GetById);
        grp.MapGet("/hod/{hodId}", GetByHod);
        grp.MapPost("/",           Create);
        grp.MapPut("/{id:int}",    Update);
        grp.MapPut("/{id:int}/assign-hod", AssignHod);
        grp.MapDelete("/{id:int}", Deactivate);

        return app;
    }

    private static async Task<IResult> GetAll(IFolderMappingService svc, CancellationToken ct)
    {
        var r = await svc.GetAllAsync(ct);
        return r.IsSuccess ? Results.Ok(r.Data) : Results.Problem(r.Error, statusCode: r.StatusCode);
    }

    private static async Task<IResult> GetById(int id, IFolderMappingService svc, CancellationToken ct)
    {
        var r = await svc.GetByIdAsync(id, ct);
        return r.IsSuccess ? Results.Ok(r.Data) : Results.Problem(r.Error, statusCode: r.StatusCode);
    }

    private static async Task<IResult> GetByHod(string hodId, IFolderMappingService svc, CancellationToken ct)
    {
        var r = await svc.GetByHodIdAsync(hodId, ct);
        return r.IsSuccess ? Results.Ok(r.Data) : Results.Problem(r.Error, statusCode: r.StatusCode);
    }

    private static async Task<IResult> Create(
        CreateFolderMappingDto dto, IFolderMappingService svc, HttpContext ctx, CancellationToken ct)
    {
        var user = ctx.User.Identity?.Name ?? "system";
        var r = await svc.CreateAsync(dto, user, ct);
        return r.IsSuccess
            ? Results.Created($"/api/folder-mappings/{r.Data!.Id}", r.Data)
            : Results.Problem(r.Error, statusCode: r.StatusCode);
    }

    private static async Task<IResult> Update(
        int id, UpdateFolderMappingDto dto, IFolderMappingService svc, HttpContext ctx, CancellationToken ct)
    {
        var user = ctx.User.Identity?.Name ?? "system";
        var r = await svc.UpdateAsync(dto with { Id = id }, user, ct);
        return r.IsSuccess ? Results.Ok(r.Data) : Results.Problem(r.Error, statusCode: r.StatusCode);
    }

    private static async Task<IResult> AssignHod(
        int id, AssignHodDto dto, IFolderMappingService svc, HttpContext ctx, CancellationToken ct)
    {
        var user = ctx.User.Identity?.Name ?? "system";
        var r = await svc.AssignHodAsync(id,
            dto.PrimaryHodId, dto.PrimaryHodName, dto.PrimaryHodEmail,
            dto.SecondaryHodId, dto.SecondaryHodName, dto.SecondaryHodEmail,
            user, ct);
        return r.IsSuccess ? Results.Ok(r.Data) : Results.Problem(r.Error, statusCode: r.StatusCode);
    }

    private static async Task<IResult> Deactivate(
        int id, IFolderMappingService svc, HttpContext ctx, CancellationToken ct)
    {
        var user = ctx.User.Identity?.Name ?? "system";
        var r = await svc.DeactivateAsync(id, user, ct);
        return r.IsSuccess ? Results.NoContent() : Results.Problem(r.Error, statusCode: r.StatusCode);
    }
}

// DTO used only for the assign-hod endpoint
public sealed record AssignHodDto(
    string? PrimaryHodId, string? PrimaryHodName, string? PrimaryHodEmail,
    string? SecondaryHodId, string? SecondaryHodName, string? SecondaryHodEmail
);
```

### 8.3 Department Endpoints

```csharp
// API/Endpoints/DepartmentEndpoints.cs
namespace API.Endpoints;

public static class DepartmentEndpoints
{
    public static IEndpointRouteBuilder MapDepartmentEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api/departments")
                     .WithTags("Departments");

        grp.MapGet("/",         GetAll).AllowAnonymous();     // visible to all roles
        grp.MapGet("/{id:int}", GetById).AllowAnonymous();
        grp.MapPost("/",        Create).RequireAuthorization("Admin");
        grp.MapPut("/{id:int}", Update).RequireAuthorization("Admin");

        return app;
    }

    private static async Task<IResult> GetAll(IDepartmentService svc, CancellationToken ct)
    {
        var r = await svc.GetAllAsync(ct);
        return r.IsSuccess ? Results.Ok(r.Data) : Results.Problem(r.Error, statusCode: r.StatusCode);
    }

    private static async Task<IResult> GetById(int id, IDepartmentService svc, CancellationToken ct)
    {
        var r = await svc.GetByIdAsync(id, ct);
        return r.IsSuccess ? Results.Ok(r.Data) : Results.Problem(r.Error, statusCode: r.StatusCode);
    }

    private static async Task<IResult> Create(
        CreateDepartmentDto dto, IDepartmentService svc, CancellationToken ct)
    {
        var r = await svc.CreateAsync(dto, ct);
        return r.IsSuccess
            ? Results.Created($"/api/departments/{r.Data!.DepartmentId}", r.Data)
            : Results.Problem(r.Error, statusCode: r.StatusCode);
    }

    private static async Task<IResult> Update(
        int id, UpdateDepartmentDto dto, IDepartmentService svc, CancellationToken ct)
    {
        var r = await svc.UpdateAsync(dto with { DepartmentId = id }, ct);
        return r.IsSuccess ? Results.Ok(r.Data) : Results.Problem(r.Error, statusCode: r.StatusCode);
    }
}
```

---

## 9. Background Job — Expiry & Reminder

```csharp
// Infrastructure/BackgroundJobs/AccessExpiryJob.cs
namespace Infrastructure.BackgroundJobs;

/// <summary>
/// Runs daily. Sends reminders at 15 days and 7 days before expiry.
/// Marks items as Expired on the expiry date.
/// </summary>
public sealed class AccessExpiryJob(
    IServiceScopeFactory scopeFactory,
    ILogger<AccessExpiryJob> logger
) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);
    private const int ExpiryDays = 90;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessAsync(stoppingToken);
            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task ProcessAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repo   = scope.ServiceProvider.GetRequiredService<IAccessRequestRepository>();
        var notify = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var now = DateTime.UtcNow;

        // Fetch all granted items expiring within the next 16 days (covers 7-day and 15-day windows)
        var threshold = now.AddDays(ExpiryDays + 16);
        var items = await repo.GetItemsGrantedExpiringBeforeAsync(threshold, ct);

        foreach (var item in items)
        {
            if (item.UpdatedAt is null) continue;

            var expiryDate = item.UpdatedAt.Value.AddDays(ExpiryDays);
            var daysLeft   = (expiryDate - now).Days;

            if (daysLeft <= 0)
            {
                // Mark expired
                item.Status    = RequestStatus.Expired;
                item.UpdatedAt = now;
                await repo.UpdateItemAsync(item, ct);

                var req = await repo.GetByIdAsync(item.AccessReqId, ct);
                if (req is not null)
                    await notify.NotifyUserAsync(req.UserId, "AccessExpired",
                        $"Your access for ticket {item.TicketNumber} ({item.FolderPath}) has expired.",
                        item.AccessReqId, item.AccessItemId, ct: ct);

                logger.LogInformation("Item {TicketNumber} expired.", item.TicketNumber);
            }
            else if (daysLeft == 7 || daysLeft == 15)
            {
                var req = await repo.GetByIdAsync(item.AccessReqId, ct);
                if (req is not null)
                    await notify.NotifyUserAsync(req.UserId, "AccessExpiringSoon",
                        $"Reminder: Your access for '{item.FolderPath}' (ticket {item.TicketNumber}) expires in {daysLeft} days on {expiryDate:dd-MMM-yyyy}.",
                        item.AccessReqId, item.AccessItemId, ct: ct);

                logger.LogInformation("Reminder sent for item {Ticket}: {Days} days left.", item.TicketNumber, daysLeft);
            }
        }
    }
}
```

---

## 10. DI Registration

```csharp
// Program.cs — registration block
builder.Services
    // Repositories
    .AddScoped<IAccessRequestRepository, AccessRequestRepository>()
    .AddScoped<IFolderMappingRepository, FolderMappingRepository>()
    .AddScoped<IDepartmentRepository,    DepartmentRepository>()

    // Services
    .AddScoped<IAccessRequestService, AccessRequestService>()
    .AddScoped<IFolderMappingService, FolderMappingService>()
    .AddScoped<IDepartmentService,    DepartmentService>()
    .AddScoped<INotificationService,  NotificationService>()
    .AddScoped<IAuditService,         AuditService>()

    // Background job
    .AddHostedService<AccessExpiryJob>();

// Map all endpoint groups
app.MapAccessRequestEndpoints();
app.MapFolderMappingEndpoints();
app.MapDepartmentEndpoints();
```

### AppDbContext DbSets

```csharp
// Infrastructure/Persistence/AppDbContext.cs (relevant DbSets)
public DbSet<AccessRequestEntity>  AccessRequests  => Set<AccessRequestEntity>();
public DbSet<AccessItemEntity>     AccessItems     => Set<AccessItemEntity>();
public DbSet<AccessApprovalEntity> AccessApprovals => Set<AccessApprovalEntity>();
public DbSet<AccessReqAuditEntity> AccessReqAudits => Set<AccessReqAuditEntity>();
public DbSet<FolderMappingEntity>  FolderMappings  => Set<FolderMappingEntity>();
public DbSet<DepartmentEntity>     Departments     => Set<DepartmentEntity>();
public DbSet<User>                 Users           => Set<User>();
```

---

## 11. Workflow State Machine Reference

```
User submits request
        │
        ▼
  [PendingHOD] ──── HOD Reject ────► [RejectedHOD]  → notify user
        │
    HOD Approve
        │
        ▼
  [ApprovedHOD / PendingIT] ──── IT Reject ───► [AccessRejected]  → notify user
        │
    IT Approve
        │
        ▼
  [AccessGranted]  ◄── 90-day clock starts (UpdatedAt)
        │
        ├── Day 75 (15 days left) → reminder notification
        ├── Day 83 (7 days left)  → reminder notification
        └── Day 90               → [Expired]  → notify user
```

### Role Permission Matrix

| Operation                        | User | HOD | IT | Admin |
|----------------------------------|:----:|:---:|:--:|:-----:|
| Submit access request            | ✓    |     |    | ✓     |
| View own requests                | ✓    | ✓   | ✓  | ✓     |
| View all requests                |      |     |    | ✓     |
| Approve / reject (HOD stage)     |      | ✓   |    | ✓     |
| Approve / reject (IT stage)      |      |     | ✓  | ✓     |
| Create / update folder mapping   |      |     |    | ✓     |
| Assign HOD to folder             |      |     |    | ✓     |
| Create / update department       |      |     |    | ✓     |
| Update any user role             |      |     |    | ✓     |
| View audit trail                 | ✓*   | ✓*  | ✓* | ✓     |

> \* Users see audit only for their own requests. Enforce in endpoint via `userId` claim check.
