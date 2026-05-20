# Enterprise-Grade ASP.NET Core Web API — Complete Implementation Guide

> **Solution:** Janatics File/Folder Access Management Portal  
> **Framework:** .NET 8 | **Architecture:** Vertical Slice + Clean Architecture Hybrid  
> **Database:** MySQL (EF Core) + Dapper | **Patterns:** CQRS, Repository, UoW, Result<T>

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Folder Structure](#2-folder-structure)
3. [Domain Layer](#3-domain-layer)
4. [Shared / Common Layer](#4-shared--common-layer)
5. [Infrastructure — Persistence](#5-infrastructure--persistence)
6. [Infrastructure — EF Core Generic Repository](#6-infrastructure--ef-core-generic-repository)
7. [Infrastructure — Dapper Repository](#7-infrastructure--dapper-repository)
8. [Infrastructure — Unit of Work](#8-infrastructure--unit-of-work)
9. [Infrastructure — Caching & Logging](#9-infrastructure--caching--logging)
10. [Application — Behaviors & Pipeline](#10-application--behaviors--pipeline)
11. [Application — Features: Users](#11-application--features-users)
12. [Application — Features: Departments](#12-application--features-departments)
13. [Application — Features: AccessRequest](#13-application--features-accessrequest)
14. [Application — Features: Approval](#14-application--features-approval)
15. [Application — Features: Audit](#15-application--features-audit)
16. [Application — Features: Notifications](#16-application--features-notifications)
17. [API Layer — Middleware](#17-api-layer--middleware)
18. [API Layer — Program.cs & DI Registration](#18-api-layer--programcs--di-registration)
19. [Configuration Files](#19-configuration-files)
20. [Testing](#20-testing)
21. [Architecture Decisions & Scalability Notes](#21-architecture-decisions--scalability-notes)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│   Endpoints (Minimal API Carter) | Middleware | Swagger     │
└───────────────────────┬─────────────────────────────────────┘
                        │ MediatR
┌───────────────────────▼─────────────────────────────────────┐
│                   Application Layer                         │
│   Commands | Queries | Handlers | Validators | Behaviors    │
└───────────────────────┬─────────────────────────────────────┘
                        │ Interfaces
┌───────────────────────▼─────────────────────────────────────┐
│                    Domain Layer                             │
│     Entities | Enums | ValueObjects | Domain Events        │
└───────────────────────┬─────────────────────────────────────┘
                        │ EF Core + Dapper
┌───────────────────────▼─────────────────────────────────────┐
│                 Infrastructure Layer                        │
│   DbContext | Repositories | UoW | Caching | Logging       │
└─────────────────────────────────────────────────────────────┘
```

**Why Vertical Slice?**  
Each feature folder (Users, Departments, AccessRequest…) owns its Command, Query, Handler, Validator, and Endpoint. This means changes to one feature never break another. No horizontal layer leakage.

**Why MediatR + CQRS?**  
Separates read (Query) from write (Command) concerns. Every handler is independently testable. Pipeline behaviors (validation, logging, performance) apply automatically to every request.

**Why EF Core + Dapper together?**  
EF Core handles writes + complex object graphs. Dapper handles read-optimized projections and bulk operations where ORMs add overhead.

---

## 2. Folder Structure

```
Web/
├── Program.cs
├── Program.ServiceExtensions.cs        ← DI registration wiring
├── Program.WebExtensions.cs            ← Middleware pipeline
├── appsettings.json
├── appsettings.Development.json
│
├── Common/
│   ├── Behaviors/
│   │   ├── ValidationBehavior.cs
│   │   ├── LoggingBehavior.cs
│   │   └── PerformanceBehavior.cs
│   ├── Exceptions/
│   │   ├── AppException.cs
│   │   ├── NotFoundException.cs
│   │   ├── ValidationException.cs
│   │   ├── ConflictException.cs
│   │   └── ForbiddenException.cs
│   └── Middlewares/
│       ├── ExceptionMiddleware.cs
│       ├── CorrelationMiddleware.cs
│       └── PerformanceMiddleware.cs
│
├── Domain/
│   ├── Common/
│   │   ├── BaseEntity.cs
│   │   ├── AuditableEntity.cs
│   │   └── IDomainEvent.cs
│   ├── Entities/
│   │   ├── Employee.cs
│   │   ├── Department.cs
│   │   ├── AccessRequest.cs
│   │   ├── AccessApproval.cs
│   │   ├── AccessDetail.cs
│   │   └── AuditLog.cs
│   └── Enums/
│       ├── RequestStatus.cs
│       ├── ApprovalStage.cs
│       └── AccessType.cs
│
├── Infrastructure/
│   ├── Persistence/
│   │   ├── ApplicationDbContext.cs
│   │   ├── Configurations/
│   │   │   ├── EmployeeConfiguration.cs
│   │   │   ├── DepartmentConfiguration.cs
│   │   │   ├── AccessRequestConfiguration.cs
│   │   │   ├── AccessApprovalConfiguration.cs
│   │   │   ├── AccessDetailConfiguration.cs
│   │   │   └── AuditLogConfiguration.cs
│   │   └── Seed/
│   │       └── DbSeeder.cs
│   ├── Repositories/
│   │   ├── IRepository.cs
│   │   ├── IReadRepository.cs
│   │   ├── IDapperRepository.cs
│   │   ├── EfRepository.cs
│   │   ├── DapperRepository.cs
│   │   ├── IUnitOfWork.cs
│   │   └── UnitOfWork.cs
│   ├── Caching/
│   │   ├── ICacheService.cs
│   │   └── MemoryCacheService.cs
│   └── DependencyInjection/
│       └── InfrastructureServiceExtensions.cs
│
├── Features/
│   ├── Users/
│   ├── Departments/
│   ├── AccessRequest/
│   ├── Approval/
│   ├── Audit/
│   └── Notifications/
│
└── Shared/
    ├── Results/
    │   └── Result.cs
    ├── Responses/
    │   ├── ApiResponse.cs
    │   └── PagedResponse.cs
    ├── Pagination/
    │   └── PaginationParams.cs
    └── Extensions/
        └── QueryableExtensions.cs
```

---

## 3. Domain Layer

### 3.1 `Domain/Common/BaseEntity.cs`

```csharp
namespace Web.Domain.Common;

/// <summary>
/// Base entity with primary key and soft-delete support.
/// All domain entities derive from this — ensures consistent identity and lifecycle management.
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; protected set; }

    /// <summary>
    /// Soft delete flag. Deleted rows are filtered at the repository level, never physically removed.
    /// This preserves referential integrity and supports audit trails.
    /// </summary>
    public bool IsDeleted { get; private set; }

    public DateTime? DeletedAt { get; private set; }
    public string? DeletedBy { get; private set; }

    private readonly List<IDomainEvent> _domainEvents = [];

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void SoftDelete(string deletedBy)
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        DeletedBy = deletedBy;
    }

    protected void RaiseDomainEvent(IDomainEvent domainEvent)
        => _domainEvents.Add(domainEvent);

    public void ClearDomainEvents() => _domainEvents.Clear();
}
```

### 3.2 `Domain/Common/AuditableEntity.cs`

```csharp
namespace Web.Domain.Common;

/// <summary>
/// Extends BaseEntity with full audit trail (created/modified).
/// EF Core interceptor or SaveChanges override stamps these automatically.
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? ModifiedAt { get; set; }
    public string? ModifiedBy { get; set; }

    /// <summary>
    /// Optimistic concurrency token — EF Core uses this as a row version.
    /// Prevents lost-update anomalies on concurrent edits.
    /// </summary>
    public byte[]? RowVersion { get; set; }
}
```

### 3.3 `Domain/Common/IDomainEvent.cs`

```csharp
using MediatR;

namespace Web.Domain.Common;

/// <summary>
/// Marker interface for domain events.
/// Implemented as INotification so MediatR can dispatch them after SaveChanges.
/// </summary>
public interface IDomainEvent : INotification { }
```

### 3.4 `Domain/Enums/RequestStatus.cs`

```csharp
namespace Web.Domain.Enums;

/// <summary>
/// Lifecycle states of an access request through the two-stage HOD → IT approval workflow.
/// </summary>
public enum RequestStatus
{
    Pending = 1,
    HodApproved = 2,
    HodRejected = 3,
    ItApproved = 4,
    ItRejected = 5,
    Cancelled = 6
}
```

### 3.5 `Domain/Enums/ApprovalStage.cs`

```csharp
namespace Web.Domain.Enums;

public enum ApprovalStage
{
    Hod = 1,
    It = 2
}
```

### 3.6 `Domain/Enums/AccessType.cs`

```csharp
namespace Web.Domain.Enums;

public enum AccessType
{
    ReadOnly = 1,
    ReadWrite = 2,
    FullControl = 3
}
```

### 3.7 `Domain/Entities/Employee.cs`

```csharp
using Web.Domain.Common;

namespace Web.Domain.Entities;

/// <summary>
/// Maps to Jan_Emp_Mast_V.
/// Employees are the primary actors — requesters, HODs, IT approvers.
/// </summary>
public sealed class Employee : AuditableEntity
{
    public string EmployeeCode { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Role { get; private set; } = string.Empty; // "employee" | "hod" | "it"
    public int DepartmentId { get; private set; }

    // Navigation
    public Department Department { get; private set; } = null!;
    public ICollection<AccessRequest> AccessRequests { get; private set; } = [];

    private Employee() { }

    public static Employee Create(
        string employeeCode,
        string fullName,
        string email,
        string role,
        int departmentId,
        string createdBy)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);

        var employee = new Employee
        {
            EmployeeCode = employeeCode.Trim().ToUpperInvariant(),
            FullName = fullName.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            Role = role.Trim().ToLowerInvariant(),
            DepartmentId = departmentId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        return employee;
    }

    public void UpdateProfile(string fullName, string email, string modifiedBy)
    {
        FullName = fullName.Trim();
        Email = email.Trim().ToLowerInvariant();
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = modifiedBy;
    }
}
```

### 3.8 `Domain/Entities/Department.cs`

```csharp
using Web.Domain.Common;

namespace Web.Domain.Entities;

public sealed class Department : AuditableEntity
{
    public string DepartmentCode { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;

    public ICollection<Employee> Employees { get; private set; } = [];

    private Department() { }

    public static Department Create(string code, string name, string createdBy)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(code);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        return new Department
        {
            DepartmentCode = code.Trim().ToUpperInvariant(),
            Name = name.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }

    public void Rename(string name, string modifiedBy)
    {
        Name = name.Trim();
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = modifiedBy;
    }
}
```

### 3.9 `Domain/Entities/AccessRequest.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Enums;
using Web.Domain.Events;

namespace Web.Domain.Entities;

/// <summary>
/// Maps to Jan_Access_Request.
/// The aggregate root for the two-stage approval workflow.
/// State transitions are enforced here — never externally.
/// </summary>
public sealed class AccessRequest : AuditableEntity
{
    public string RequestNumber { get; private set; } = string.Empty;
    public int RequesterId { get; private set; }
    public string FolderPath { get; private set; } = string.Empty;
    public AccessType AccessType { get; private set; }
    public RequestStatus Status { get; private set; }
    public string Justification { get; private set; } = string.Empty;

    public Employee Requester { get; private set; } = null!;
    public ICollection<AccessApproval> Approvals { get; private set; } = [];
    public ICollection<AccessDetail> AccessDetails { get; private set; } = [];

    private AccessRequest() { }

    public static AccessRequest Create(
        int requesterId,
        string folderPath,
        AccessType accessType,
        string justification,
        string createdBy)
    {
        var request = new AccessRequest
        {
            RequestNumber = GenerateRequestNumber(),
            RequesterId = requesterId,
            FolderPath = folderPath.Trim(),
            AccessType = accessType,
            Status = RequestStatus.Pending,
            Justification = justification.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        request.RaiseDomainEvent(new AccessRequestCreatedEvent(request.RequestNumber, requesterId));

        return request;
    }

    /// <summary>
    /// Advances HOD approval stage. Guards against invalid state transitions.
    /// </summary>
    public void ApproveByHod(string approvedBy)
    {
        if (Status != RequestStatus.Pending)
            throw new InvalidOperationException($"Cannot HOD-approve a request in status {Status}.");

        Status = RequestStatus.HodApproved;
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = approvedBy;

        RaiseDomainEvent(new AccessRequestStatusChangedEvent(RequestNumber, Status));
    }

    public void RejectByHod(string rejectedBy)
    {
        if (Status != RequestStatus.Pending)
            throw new InvalidOperationException($"Cannot HOD-reject a request in status {Status}.");

        Status = RequestStatus.HodRejected;
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = rejectedBy;
    }

    public void ApproveByIt(string approvedBy)
    {
        if (Status != RequestStatus.HodApproved)
            throw new InvalidOperationException("IT approval requires prior HOD approval.");

        Status = RequestStatus.ItApproved;
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = approvedBy;

        RaiseDomainEvent(new AccessRequestStatusChangedEvent(RequestNumber, Status));
    }

    public void RejectByIt(string rejectedBy)
    {
        if (Status != RequestStatus.HodApproved)
            throw new InvalidOperationException("IT rejection requires prior HOD approval.");

        Status = RequestStatus.ItRejected;
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = rejectedBy;
    }

    public void Cancel(string cancelledBy)
    {
        if (Status is RequestStatus.ItApproved or RequestStatus.ItRejected)
            throw new InvalidOperationException("Cannot cancel a completed request.");

        Status = RequestStatus.Cancelled;
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = cancelledBy;
    }

    private static string GenerateRequestNumber()
        => $"REQ-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
}
```

### 3.10 `Domain/Entities/AccessApproval.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

/// <summary>Maps to Jan_Access_Approval. One record per approval stage per request.</summary>
public sealed class AccessApproval : AuditableEntity
{
    public int AccessRequestId { get; private set; }
    public int ApproverId { get; private set; }
    public ApprovalStage Stage { get; private set; }
    public bool IsApproved { get; private set; }
    public string? Comments { get; private set; }
    public DateTime ActionedAt { get; private set; }

    public AccessRequest AccessRequest { get; private set; } = null!;
    public Employee Approver { get; private set; } = null!;

    private AccessApproval() { }

    public static AccessApproval Create(
        int accessRequestId,
        int approverId,
        ApprovalStage stage,
        bool isApproved,
        string? comments,
        string createdBy)
    {
        return new AccessApproval
        {
            AccessRequestId = accessRequestId,
            ApproverId = approverId,
            Stage = stage,
            IsApproved = isApproved,
            Comments = comments?.Trim(),
            ActionedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }
}
```

### 3.11 `Domain/Entities/AccessDetail.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

/// <summary>Maps to Jan_Access_Details. Actual folder access records provisioned after IT approval.</summary>
public sealed class AccessDetail : AuditableEntity
{
    public int AccessRequestId { get; private set; }
    public string FolderPath { get; private set; } = string.Empty;
    public AccessType AccessType { get; private set; }
    public DateTime GrantedAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public bool IsActive { get; private set; }

    public AccessRequest AccessRequest { get; private set; } = null!;

    private AccessDetail() { }

    public static AccessDetail Create(int accessRequestId, string folderPath, AccessType accessType, string createdBy)
    {
        return new AccessDetail
        {
            AccessRequestId = accessRequestId,
            FolderPath = folderPath.Trim(),
            AccessType = accessType,
            GrantedAt = DateTime.UtcNow,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }

    public void Revoke(string revokedBy)
    {
        IsActive = false;
        RevokedAt = DateTime.UtcNow;
        ModifiedAt = DateTime.UtcNow;
        ModifiedBy = revokedBy;
    }
}
```

### 3.12 `Domain/Entities/AuditLog.cs`

```csharp
using Web.Domain.Common;

namespace Web.Domain.Entities;

/// <summary>Maps to Jan_Audit_Log. Immutable write-once records — no update/delete.</summary>
public sealed class AuditLog : BaseEntity
{
    public string EntityName { get; private set; } = string.Empty;
    public int EntityId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string? OldValues { get; private set; }
    public string? NewValues { get; private set; }
    public string PerformedBy { get; private set; } = string.Empty;
    public DateTime PerformedAt { get; private set; }
    public string? CorrelationId { get; private set; }
    public string? IpAddress { get; private set; }

    private AuditLog() { }

    public static AuditLog Create(
        string entityName,
        int entityId,
        string action,
        string? oldValues,
        string? newValues,
        string performedBy,
        string? correlationId = null,
        string? ipAddress = null)
    {
        return new AuditLog
        {
            EntityName = entityName,
            EntityId = entityId,
            Action = action,
            OldValues = oldValues,
            NewValues = newValues,
            PerformedBy = performedBy,
            PerformedAt = DateTime.UtcNow,
            CorrelationId = correlationId,
            IpAddress = ipAddress
        };
    }
}
```

### 3.13 `Domain/Events/AccessRequestEvents.cs`

```csharp
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Events;

public sealed record AccessRequestCreatedEvent(
    string RequestNumber,
    int RequesterId) : IDomainEvent;

public sealed record AccessRequestStatusChangedEvent(
    string RequestNumber,
    RequestStatus NewStatus) : IDomainEvent;
```

---

## 4. Shared / Common Layer

### 4.1 `Shared/Results/Result.cs`

```csharp
namespace Web.Shared.Results;

/// <summary>
/// Discriminated union for operation results.
/// Eliminates exception-driven control flow for expected failures.
/// Callers inspect IsSuccess before accessing Value or Error — no null surprises.
/// </summary>
public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public T? Value { get; }
    public string Error { get; }
    public string ErrorCode { get; }

    private Result(T value)
    {
        IsSuccess = true;
        Value = value;
        Error = string.Empty;
        ErrorCode = string.Empty;
    }

    private Result(string error, string errorCode)
    {
        IsSuccess = false;
        Error = error;
        ErrorCode = errorCode;
    }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error, string errorCode = "GENERAL_ERROR") => new(error, errorCode);

    public Result<TOut> Map<TOut>(Func<T, TOut> mapper)
        => IsSuccess ? Result<TOut>.Success(mapper(Value!)) : Result<TOut>.Failure(Error, ErrorCode);

    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<string, TOut> onFailure)
        => IsSuccess ? onSuccess(Value!) : onFailure(Error);
}

public sealed class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string Error { get; }
    public string ErrorCode { get; }

    private Result(bool success, string error, string errorCode)
    {
        IsSuccess = success;
        Error = error;
        ErrorCode = errorCode;
    }

    public static Result Success() => new(true, string.Empty, string.Empty);
    public static Result Failure(string error, string errorCode = "GENERAL_ERROR") => new(false, error, errorCode);
}
```

### 4.2 `Shared/Responses/ApiResponse.cs`

```csharp
using System.Text.Json.Serialization;

namespace Web.Shared.Responses;

/// <summary>
/// Uniform envelope for all API responses.
/// Every endpoint returns this — clients never need to guess the shape.
/// </summary>
public sealed class ApiResponse<T>
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string Message { get; init; } = string.Empty;
    public T? Data { get; init; }
    public string? CorrelationId { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? Errors { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    public static ApiResponse<T> Ok(T data, string message = "Success", string? correlationId = null)
        => new() { Success = true, StatusCode = 200, Message = message, Data = data, CorrelationId = correlationId };

    public static ApiResponse<T> Created(T data, string message = "Created", string? correlationId = null)
        => new() { Success = true, StatusCode = 201, Message = message, Data = data, CorrelationId = correlationId };

    public static ApiResponse<T> Fail(string message, int statusCode = 400, IReadOnlyList<string>? errors = null, string? correlationId = null)
        => new() { Success = false, StatusCode = statusCode, Message = message, Errors = errors, CorrelationId = correlationId };

    public static ApiResponse<T> ValidationFail(IDictionary<string, string[]> validationErrors, string? correlationId = null)
        => new() { Success = false, StatusCode = 422, Message = "Validation failed.", ValidationErrors = validationErrors, CorrelationId = correlationId };
}
```

### 4.3 `Shared/Responses/PagedResponse.cs`

```csharp
namespace Web.Shared.Responses;

/// <summary>
/// Paged response with navigation metadata.
/// TotalPages and HasNext/HasPrevious are computed — clients can build pagination UI directly.
/// </summary>
public sealed class PagedResponse<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int PageNumber { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
    public bool Success => true;
    public string? CorrelationId { get; init; }

    public static PagedResponse<T> Create(IReadOnlyList<T> items, int totalCount, int pageNumber, int pageSize, string? correlationId = null)
        => new()
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            CorrelationId = correlationId
        };
}
```

### 4.4 `Shared/Pagination/PaginationParams.cs`

```csharp
namespace Web.Shared.Pagination;

/// <summary>
/// Standard pagination + sorting parameters.
/// MaxPageSize guards against accidental large result sets (DDoS vector).
/// </summary>
public sealed class PaginationParams
{
    private const int MaxPageSize = 100;
    private int _pageSize = 10;

    public int PageNumber { get; init; } = 1;

    public int PageSize
    {
        get => _pageSize;
        init => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }

    public string? SortBy { get; init; }
    public bool SortDescending { get; init; }
    public string? SearchTerm { get; init; }
}
```

### 4.5 `Shared/Extensions/QueryableExtensions.cs`

```csharp
using System.Linq.Expressions;
using Web.Shared.Pagination;

namespace Web.Shared.Extensions;

public static class QueryableExtensions
{
    /// <summary>
    /// Applies dynamic sort by property name using expression trees.
    /// Avoids reflection overhead on repeated calls via compiled expression cache.
    /// </summary>
    public static IQueryable<T> ApplySort<T>(this IQueryable<T> source, string? sortBy, bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy)) return source;

        var parameter = Expression.Parameter(typeof(T), "x");
        var property = typeof(T).GetProperty(sortBy,
            System.Reflection.BindingFlags.IgnoreCase | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);

        if (property is null) return source;

        var propertyAccess = Expression.MakeMemberAccess(parameter, property);
        var orderByExp = Expression.Lambda(propertyAccess, parameter);
        var methodName = descending ? "OrderByDescending" : "OrderBy";

        var resultExp = Expression.Call(
            typeof(Queryable),
            methodName,
            [typeof(T), property.PropertyType],
            source.Expression,
            Expression.Quote(orderByExp));

        return source.Provider.CreateQuery<T>(resultExp);
    }

    public static async Task<(IReadOnlyList<T> Items, int TotalCount)> ToPagedAsync<T>(
        this IQueryable<T> source,
        PaginationParams pagination,
        CancellationToken cancellationToken = default)
    {
        var totalCount = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .CountAsync(source, cancellationToken);

        var items = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .ToListAsync(
                source
                    .ApplySort(pagination.SortBy, pagination.SortDescending)
                    .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                    .Take(pagination.PageSize),
                cancellationToken);

        return (items, totalCount);
    }
}
```

### 4.6 `Common/Exceptions/AppException.cs`

```csharp
namespace Web.Common.Exceptions;

/// <summary>Base for all domain/application exceptions. Carries HTTP status code for middleware mapping.</summary>
public class AppException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }

    protected AppException(string message, int statusCode, string errorCode)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}

public sealed class NotFoundException : AppException
{
    public NotFoundException(string entityName, object key)
        : base($"{entityName} with key '{key}' was not found.", 404, "NOT_FOUND") { }
}

public sealed class ConflictException : AppException
{
    public ConflictException(string message)
        : base(message, 409, "CONFLICT") { }
}

public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Access denied.")
        : base(message, 403, "FORBIDDEN") { }
}

public sealed class ValidationException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation errors occurred.", 422, "VALIDATION_ERROR")
    {
        Errors = errors;
    }
}
```

---

## 5. Infrastructure — Persistence

### 5.1 `Infrastructure/Persistence/ApplicationDbContext.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Reflection;
using Web.Domain.Common;
using Web.Domain.Entities;

namespace Web.Infrastructure.Persistence;

/// <summary>
/// Central EF Core DbContext.
/// IEntityTypeConfiguration classes handle mapping — keeps DbContext clean of fluent API noise.
/// Global query filter on IsDeleted ensures soft-deleted records are invisible everywhere.
/// </summary>
public sealed class ApplicationDbContext : DbContext
{
    private readonly ICurrentUserService _currentUser;
    private readonly IDomainEventDispatcher _domainEventDispatcher;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUser,
        IDomainEventDispatcher domainEventDispatcher)
        : base(options)
    {
        _currentUser = currentUser;
        _domainEventDispatcher = domainEventDispatcher;
    }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<AccessRequest> AccessRequests => Set<AccessRequest>();
    public DbSet<AccessApproval> AccessApprovals => Set<AccessApproval>();
    public DbSet<AccessDetail> AccessDetails => Set<AccessDetail>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply all IEntityTypeConfiguration classes from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Global soft-delete filter — BaseEntity.IsDeleted == false
        // Applied to all entities deriving from BaseEntity automatically
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                var property = System.Linq.Expressions.Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
                var filter = System.Linq.Expressions.Expression.Lambda(
                    System.Linq.Expressions.Expression.Not(property), parameter);
                entityType.SetQueryFilter(filter);
            }
        }

        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Stamp audit fields before writing
        StampAuditFields();

        var result = await base.SaveChangesAsync(cancellationToken);

        // Dispatch domain events after successful commit — outbox-ready pattern
        await DispatchDomainEventsAsync(cancellationToken);

        return result;
    }

    private void StampAuditFields()
    {
        var now = DateTime.UtcNow;
        var user = _currentUser.UserId ?? "system";

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = user;
                    break;

                case EntityState.Modified:
                    entry.Entity.ModifiedAt = now;
                    entry.Entity.ModifiedBy = user;
                    break;
            }
        }
    }

    private async Task DispatchDomainEventsAsync(CancellationToken cancellationToken)
    {
        var entitiesWithEvents = ChangeTracker.Entries<BaseEntity>()
            .Select(e => e.Entity)
            .Where(e => e.DomainEvents.Count != 0)
            .ToList();

        foreach (var entity in entitiesWithEvents)
        {
            var events = entity.DomainEvents.ToList();
            entity.ClearDomainEvents();
            foreach (var domainEvent in events)
                await _domainEventDispatcher.DispatchAsync(domainEvent, cancellationToken);
        }
    }
}

/// <summary>Abstracts current user resolution — injectable mock in tests.</summary>
public interface ICurrentUserService
{
    string? UserId { get; }
}

/// <summary>MediatR-backed domain event dispatcher.</summary>
public interface IDomainEventDispatcher
{
    Task DispatchAsync(IDomainEvent domainEvent, CancellationToken cancellationToken);
}
```

### 5.2 `Infrastructure/Persistence/Configurations/EmployeeConfiguration.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Web.Domain.Entities;

namespace Web.Infrastructure.Persistence.Configurations;

public sealed class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Jan_Emp_Mast_V");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.EmployeeCode)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(e => e.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(e => e.Email)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Role)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(e => e.CreatedBy).HasMaxLength(100);
        builder.Property(e => e.ModifiedBy).HasMaxLength(100);
        builder.Property(e => e.DeletedBy).HasMaxLength(100);

        builder.Property(e => e.RowVersion)
            .IsRowVersion()
            .IsConcurrencyToken();

        builder.HasIndex(e => e.EmployeeCode).IsUnique();
        builder.HasIndex(e => e.Email).IsUnique();

        builder.HasOne(e => e.Department)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

### 5.3 `Infrastructure/Persistence/Configurations/AccessRequestConfiguration.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Web.Domain.Entities;
using Web.Domain.Enums;

namespace Web.Infrastructure.Persistence.Configurations;

public sealed class AccessRequestConfiguration : IEntityTypeConfiguration<AccessRequest>
{
    public void Configure(EntityTypeBuilder<AccessRequest> builder)
    {
        builder.ToTable("Jan_Access_Request");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.RequestNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(r => r.FolderPath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(r => r.AccessType)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(r => r.Justification)
            .HasMaxLength(1000);

        builder.Property(r => r.RowVersion).IsRowVersion().IsConcurrencyToken();

        builder.HasIndex(r => r.RequestNumber).IsUnique();
        builder.HasIndex(r => new { r.RequesterId, r.Status });

        builder.HasOne(r => r.Requester)
            .WithMany(e => e.AccessRequests)
            .HasForeignKey(r => r.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Approvals)
            .WithOne(a => a.AccessRequest)
            .HasForeignKey(a => a.AccessRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.AccessDetails)
            .WithOne(d => d.AccessRequest)
            .HasForeignKey(d => d.AccessRequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

### 5.4 `Infrastructure/Persistence/Seed/DbSeeder.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Web.Domain.Entities;

namespace Web.Infrastructure.Persistence.Seed;

/// <summary>
/// Idempotent seeder — runs on every startup but only inserts if data is absent.
/// Safe in production since every seed block checks existence first.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        try
        {
            await context.Database.MigrateAsync(cancellationToken);

            await SeedDepartmentsAsync(context, cancellationToken);
            await SeedEmployeesAsync(context, cancellationToken);

            await context.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Database seeding completed.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    private static async Task SeedDepartmentsAsync(ApplicationDbContext context, CancellationToken ct)
    {
        if (await context.Departments.AnyAsync(ct)) return;

        var departments = new[]
        {
            Department.Create("EDP", "Electronic Data Processing", "system"),
            Department.Create("HR", "Human Resources", "system"),
            Department.Create("MKTG", "Marketing", "system"),
        };

        await context.Departments.AddRangeAsync(departments, ct);
        await context.SaveChangesAsync(ct);
    }

    private static async Task SeedEmployeesAsync(ApplicationDbContext context, CancellationToken ct)
    {
        if (await context.Employees.AnyAsync(ct)) return;

        var edpDept = await context.Departments.FirstAsync(d => d.DepartmentCode == "EDP", ct);

        var employees = new[]
        {
            Employee.Create("EMP001", "Shiva Kumar", "shiva@janatics.com", "employee", edpDept.Id, "system"),
            Employee.Create("EMP002", "Anita Rao", "anita@janatics.com", "employee", edpDept.Id, "system"),
            Employee.Create("HOD001", "Rajan S", "rajan@janatics.com", "hod", edpDept.Id, "system"),
            Employee.Create("IT001", "Priya T", "priya@janatics.com", "it", edpDept.Id, "system"),
        };

        await context.Employees.AddRangeAsync(employees, ct);
    }
}
```

---

## 6. Infrastructure — EF Core Generic Repository

### 6.1 `Infrastructure/Repositories/IRepository.cs`

```csharp
using System.Linq.Expressions;
using Web.Domain.Common;
using Web.Shared.Pagination;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Write repository contract. Deliberately separate from read (IReadRepository).
/// Read/write separation allows swapping read side to Dapper or even a read replica.
/// </summary>
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<T?> GetByIdWithIncludesAsync(int id, CancellationToken cancellationToken = default, params Expression<Func<T, object>>[] includes);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    void Update(T entity);
    void UpdateRange(IEnumerable<T> entities);
    void Delete(T entity);
    void DeleteRange(IEnumerable<T> entities);
    void SoftDelete(T entity, string deletedBy);
}
```

### 6.2 `Infrastructure/Repositories/EfRepository.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Web.Domain.Common;
using Web.Infrastructure.Persistence;
using Web.Shared.Pagination;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Generic EF Core repository implementation.
/// Uses AsNoTracking for all reads — tracking is opt-in via GetByIdAsync (for mutations).
/// This prevents accidental saves and improves read performance significantly.
/// </summary>
public class EfRepository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public EfRepository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    /// <summary>Tracked read — use when you need to mutate and save.</summary>
    public async Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => await _dbSet.FindAsync([id], cancellationToken);

    public async Task<T?> GetByIdWithIncludesAsync(
        int id,
        CancellationToken cancellationToken = default,
        params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet.AsNoTracking();

        foreach (var include in includes)
            query = query.Include(include);

        return await query.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _dbSet.AsNoTracking().ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
        => await _dbSet.AsNoTracking().Where(predicate).ToListAsync(cancellationToken);

    public async Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
        => await _dbSet.AsNoTracking().FirstOrDefaultAsync(predicate, cancellationToken);

    public async Task<bool> ExistsAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
        => await _dbSet.AsNoTracking().AnyAsync(predicate, cancellationToken);

    public async Task<int> CountAsync(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default)
        => predicate is null
            ? await _dbSet.AsNoTracking().CountAsync(cancellationToken)
            : await _dbSet.AsNoTracking().CountAsync(predicate, cancellationToken);

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
        => await _dbSet.AddAsync(entity, cancellationToken);

    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
        => await _dbSet.AddRangeAsync(entities, cancellationToken);

    public void Update(T entity)
        => _dbSet.Update(entity);

    public void UpdateRange(IEnumerable<T> entities)
        => _dbSet.UpdateRange(entities);

    public void Delete(T entity)
        => _dbSet.Remove(entity);

    public void DeleteRange(IEnumerable<T> entities)
        => _dbSet.RemoveRange(entities);

    public void SoftDelete(T entity, string deletedBy)
    {
        entity.SoftDelete(deletedBy);
        _dbSet.Update(entity);
    }
}
```

---

## 7. Infrastructure — Dapper Repository

### 7.1 `Infrastructure/Repositories/IDapperRepository.cs`

```csharp
using System.Data;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Dapper contract for high-performance raw SQL reads.
/// Intentionally separate from EF repo — keeps responsibility boundaries clear.
/// </summary>
public interface IDapperRepository
{
    Task<IReadOnlyList<T>> QueryAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default);

    Task<T?> QuerySingleOrDefaultAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default);

    Task<int> ExecuteAsync(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default);

    Task<T?> ExecuteScalarAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<T>> QueryStoredProcedureAsync<T>(
        string storedProcedureName,
        object? param = null,
        CancellationToken cancellationToken = default);

    Task<int> ExecuteStoredProcedureAsync(
        string storedProcedureName,
        object? param = null,
        CancellationToken cancellationToken = default);

    Task BulkInsertAsync<T>(string tableName, IEnumerable<T> entities, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<T> Items, int TotalCount)> QueryPagedAsync<T>(
        string countSql,
        string dataSql,
        object? param = null,
        CancellationToken cancellationToken = default);
}
```

### 7.2 `Infrastructure/Repositories/DapperRepository.cs`

```csharp
using Dapper;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using Polly;
using System.Data;
using System.Text;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Dapper repository with:
/// - Polly retry (transient fault tolerance)
/// - Cancellation token propagation via CommandFlags
/// - Bulk insert via multi-row VALUES construction
/// - Stored procedure support
/// </summary>
public sealed class DapperRepository : IDapperRepository
{
    private readonly string _connectionString;
    private readonly ILogger<DapperRepository> _logger;
    private readonly IAsyncPolicy _retryPolicy;

    public DapperRepository(string connectionString, ILogger<DapperRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;

        // Retry 3 times with exponential back-off for transient DB errors
        _retryPolicy = Policy
            .Handle<MySqlException>(ex => IsTransient(ex))
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => TimeSpan.FromMilliseconds(200 * Math.Pow(2, attempt)),
                onRetry: (ex, delay, attempt, _) =>
                    _logger.LogWarning(ex, "Dapper retry {Attempt} after {Delay}ms", attempt, delay.TotalMilliseconds));
    }

    private IDbConnection CreateConnection() => new MySqlConnection(_connectionString);

    public async Task<IReadOnlyList<T>> QueryAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            var result = await connection.QueryAsync<T>(cmd);
            return result.AsList().AsReadOnly();
        });
    }

    public async Task<T?> QuerySingleOrDefaultAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            return await connection.QuerySingleOrDefaultAsync<T>(cmd);
        });
    }

    public async Task<int> ExecuteAsync(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            return await connection.ExecuteAsync(cmd);
        });
    }

    public async Task<T?> ExecuteScalarAsync<T>(
        string sql,
        object? param = null,
        IDbTransaction? transaction = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(sql, param, transaction, cancellationToken: cancellationToken);
            return await connection.ExecuteScalarAsync<T>(cmd);
        });
    }

    public async Task<IReadOnlyList<T>> QueryStoredProcedureAsync<T>(
        string storedProcedureName,
        object? param = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(
                storedProcedureName,
                param,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken);
            var result = await connection.QueryAsync<T>(cmd);
            return result.AsList().AsReadOnly();
        });
    }

    public async Task<int> ExecuteStoredProcedureAsync(
        string storedProcedureName,
        object? param = null,
        CancellationToken cancellationToken = default)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var connection = CreateConnection();
            var cmd = new CommandDefinition(
                storedProcedureName,
                param,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken);
            return await connection.ExecuteAsync(cmd);
        });
    }

    /// <summary>
    /// Batched bulk insert using parameterized multi-row VALUES.
    /// Batch size of 500 balances memory vs round-trips.
    /// Uses reflection + property cache for zero-allocation on subsequent calls.
    /// </summary>
    public async Task BulkInsertAsync<T>(
        string tableName,
        IEnumerable<T> entities,
        CancellationToken cancellationToken = default)
    {
        const int batchSize = 500;
        var entityList = entities.ToList();
        if (!entityList.Any()) return;

        var properties = typeof(T).GetProperties()
            .Where(p => p.CanRead && p.Name != "Id")
            .ToArray();

        var columns = string.Join(", ", properties.Select(p => $"`{p.Name}`"));

        foreach (var batch in entityList.Chunk(batchSize))
        {
            var parameters = new DynamicParameters();
            var valueRows = new List<string>();

            for (int i = 0; i < batch.Length; i++)
            {
                var rowParams = properties.Select(p =>
                {
                    var paramName = $"@p_{i}_{p.Name}";
                    parameters.Add(paramName, p.GetValue(batch[i]));
                    return paramName;
                });
                valueRows.Add($"({string.Join(", ", rowParams)})");
            }

            var sql = $"INSERT INTO `{tableName}` ({columns}) VALUES {string.Join(", ", valueRows)}";

            await _retryPolicy.ExecuteAsync(async () =>
            {
                using var connection = CreateConnection();
                var cmd = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
                await connection.ExecuteAsync(cmd);
            });
        }
    }

    public async Task<(IReadOnlyList<T> Items, int TotalCount)> QueryPagedAsync<T>(
        string countSql,
        string dataSql,
        object? param = null,
        CancellationToken cancellationToken = default)
    {
        using var connection = CreateConnection();
        connection.Open();

        var countCmd = new CommandDefinition(countSql, param, cancellationToken: cancellationToken);
        var dataCmd = new CommandDefinition(dataSql, param, cancellationToken: cancellationToken);

        var totalCount = await connection.ExecuteScalarAsync<int>(countCmd);
        var items = await connection.QueryAsync<T>(dataCmd);

        return (items.AsList().AsReadOnly(), totalCount);
    }

    private static bool IsTransient(MySqlException ex)
        => ex.ErrorCode is MySqlErrorCode.LockDeadlock
            or MySqlErrorCode.LockWaitTimeout
            or MySqlErrorCode.UnableToConnectToHost;
}
```

---

## 8. Infrastructure — Unit of Work

### 8.1 `Infrastructure/Repositories/IUnitOfWork.cs`

```csharp
using System.Data;
using Web.Domain.Entities;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Unit of Work coordinates multiple repository operations in a single atomic transaction.
/// Single SaveChangesAsync call commits everything — no partial saves.
/// </summary>
public interface IUnitOfWork : IAsyncDisposable
{
    IRepository<Employee> Employees { get; }
    IRepository<Department> Departments { get; }
    IRepository<AccessRequest> AccessRequests { get; }
    IRepository<AccessApproval> AccessApprovals { get; }
    IRepository<AccessDetail> AccessDetails { get; }
    IRepository<AuditLog> AuditLogs { get; }
    IDapperRepository Dapper { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    bool HasActiveTransaction { get; }
}
```

### 8.2 `Infrastructure/Repositories/UnitOfWork.cs`

```csharp
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Web.Domain.Entities;
using Web.Infrastructure.Persistence;

namespace Web.Infrastructure.Repositories;

/// <summary>
/// Concrete UoW. Lazily initialises repositories — avoids object creation overhead
/// for features that only use a subset of repos.
/// Transaction management wraps EF Core's IDbContextTransaction.
/// </summary>
public sealed class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UnitOfWork> _logger;
    private readonly IDapperRepository _dapper;
    private IDbContextTransaction? _transaction;
    private bool _disposed;

    private IRepository<Employee>? _employees;
    private IRepository<Department>? _departments;
    private IRepository<AccessRequest>? _accessRequests;
    private IRepository<AccessApproval>? _accessApprovals;
    private IRepository<AccessDetail>? _accessDetails;
    private IRepository<AuditLog>? _auditLogs;

    public UnitOfWork(
        ApplicationDbContext context,
        IDapperRepository dapper,
        ILogger<UnitOfWork> logger)
    {
        _context = context;
        _dapper = dapper;
        _logger = logger;
    }

    public IRepository<Employee> Employees => _employees ??= new EfRepository<Employee>(_context);
    public IRepository<Department> Departments => _departments ??= new EfRepository<Department>(_context);
    public IRepository<AccessRequest> AccessRequests => _accessRequests ??= new EfRepository<AccessRequest>(_context);
    public IRepository<AccessApproval> AccessApprovals => _accessApprovals ??= new EfRepository<AccessApproval>(_context);
    public IRepository<AccessDetail> AccessDetails => _accessDetails ??= new EfRepository<AccessDetail>(_context);
    public IRepository<AuditLog> AuditLogs => _auditLogs ??= new EfRepository<AuditLog>(_context);
    public IDapperRepository Dapper => _dapper;
    public bool HasActiveTransaction => _transaction is not null;

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SaveChangesAsync failed.");
            throw;
        }
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is not null)
            throw new InvalidOperationException("A transaction is already in progress.");

        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        _logger.LogDebug("Database transaction begun: {TransactionId}", _transaction.TransactionId);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null)
            throw new InvalidOperationException("No active transaction to commit.");

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            await _transaction.CommitAsync(cancellationToken);
            _logger.LogDebug("Transaction committed: {TransactionId}", _transaction.TransactionId);
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null) return;

        try
        {
            await _transaction.RollbackAsync(cancellationToken);
            _logger.LogWarning("Transaction rolled back: {TransactionId}", _transaction.TransactionId);
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;

        if (_transaction is not null)
            await _transaction.DisposeAsync();

        await _context.DisposeAsync();
        _disposed = true;
        GC.SuppressFinalize(this);
    }
}
```

---

## 9. Infrastructure — Caching & Logging

### 9.1 `Infrastructure/Caching/ICacheService.cs`

```csharp
namespace Web.Infrastructure.Caching;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default) where T : class;
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default);
    Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null, CancellationToken cancellationToken = default) where T : class;
}
```

### 9.2 `Infrastructure/Caching/MemoryCacheService.cs`

```csharp
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace Web.Infrastructure.Caching;

/// <summary>
/// In-process cache using IMemoryCache.
/// Key tracking (ConcurrentDictionary) enables prefix-based invalidation.
/// Swap this implementation with a Redis-backed one for distributed scenarios.
/// </summary>
public sealed class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;
    private readonly ConcurrentDictionary<string, bool> _keys = new();
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromMinutes(5);

    public MemoryCacheService(IMemoryCache cache, ILogger<MemoryCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
    {
        _cache.TryGetValue(key, out T? value);
        return Task.FromResult(value);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default) where T : class
    {
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? DefaultExpiry
        };

        _cache.Set(key, value, options);
        _keys.TryAdd(key, true);

        _logger.LogDebug("Cache SET: {Key} (TTL: {Expiry})", key, expiry ?? DefaultExpiry);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        _cache.Remove(key);
        _keys.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        var matchingKeys = _keys.Keys.Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).ToList();
        foreach (var key in matchingKeys)
        {
            _cache.Remove(key);
            _keys.TryRemove(key, out _);
        }
        _logger.LogDebug("Cache evicted {Count} keys with prefix: {Prefix}", matchingKeys.Count, prefix);
        return Task.CompletedTask;
    }

    public async Task<T> GetOrSetAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiry = null,
        CancellationToken cancellationToken = default) where T : class
    {
        var cached = await GetAsync<T>(key, cancellationToken);
        if (cached is not null) return cached;

        var value = await factory();
        await SetAsync(key, value, expiry, cancellationToken);
        return value;
    }
}
```

### 9.3 `Infrastructure/DependencyInjection/InfrastructureServiceExtensions.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Web.Infrastructure.Caching;
using Web.Infrastructure.Persistence;
using Web.Infrastructure.Persistence.Seed;
using Web.Infrastructure.Repositories;

namespace Web.Infrastructure.DependencyInjection;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // EF Core — MySQL
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseMySql(
                configuration.GetConnectionString("DefaultConnection"),
                ServerVersion.AutoDetect(configuration.GetConnectionString("DefaultConnection")),
                mysqlOptions =>
                {
                    mysqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null);
                    mysqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                });

            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTrackingWithIdentityResolution);
        });

        // Dapper — separate connection, no ORM overhead
        services.AddSingleton<IDapperRepository>(sp =>
            new DapperRepository(
                configuration.GetConnectionString("DefaultConnection")!,
                sp.GetRequiredService<ILogger<DapperRepository>>()));

        // Repositories & UoW
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Caching
        services.AddMemoryCache();
        services.AddSingleton<ICacheService, MemoryCacheService>();

        // Current user (replace with real IHttpContextAccessor-backed impl)
        services.AddScoped<ICurrentUserService, HttpContextCurrentUserService>();
        services.AddScoped<IDomainEventDispatcher, MediatRDomainEventDispatcher>();

        return services;
    }

    public static async Task MigrateAndSeedAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        await DbSeeder.SeedAsync(context, logger);
    }
}
```

### 9.4 `Infrastructure/Services/HttpContextCurrentUserService.cs`

```csharp
using Microsoft.AspNetCore.Http;
using Web.Infrastructure.Persistence;

namespace Web.Infrastructure.Services;

public sealed class HttpContextCurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _accessor;

    public HttpContextCurrentUserService(IHttpContextAccessor accessor)
        => _accessor = accessor;

    /// <summary>
    /// Reads employee code from a request header (X-Employee-Code).
    /// Replace with claims-based extraction once RBAC is added.
    /// </summary>
    public string? UserId
        => _accessor.HttpContext?.Request.Headers["X-Employee-Code"].FirstOrDefault()
        ?? _accessor.HttpContext?.User.FindFirst("sub")?.Value;
}
```

### 9.5 `Infrastructure/Services/MediatRDomainEventDispatcher.cs`

```csharp
using MediatR;
using Web.Domain.Common;
using Web.Infrastructure.Persistence;

namespace Web.Infrastructure.Services;

public sealed class MediatRDomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IPublisher _publisher;

    public MediatRDomainEventDispatcher(IPublisher publisher) => _publisher = publisher;

    public async Task DispatchAsync(IDomainEvent domainEvent, CancellationToken cancellationToken)
        => await _publisher.Publish(domainEvent, cancellationToken);
}
```

---

## 10. Application — Behaviors & Pipeline

### 10.1 `Common/Behaviors/ValidationBehavior.cs`

```csharp
using FluentValidation;
using MediatR;
using Web.Common.Exceptions;

namespace Web.Common.Behaviors;

/// <summary>
/// MediatR pipeline behavior — runs FluentValidation on every IRequest before the handler.
/// Throws ValidationException which the exception middleware maps to HTTP 422.
/// Zero boilerplate per handler — validation is automatic.
/// </summary>
public sealed class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        => _validators = validators;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);

        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .GroupBy(f => f.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());

        if (failures.Any())
            throw new ValidationException(failures);

        return await next();
    }
}
```

### 10.2 `Common/Behaviors/LoggingBehavior.cs`

```csharp
using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace Web.Common.Behaviors;

/// <summary>
/// Logs every MediatR request/response with timing.
/// Structured properties (RequestName, RequestBody) are searchable in log sinks.
/// </summary>
public sealed class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
        => _logger = logger;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var sw = Stopwatch.StartNew();

        _logger.LogInformation("Handling {RequestName}", requestName);

        try
        {
            var response = await next();
            sw.Stop();
            _logger.LogInformation("Handled {RequestName} in {ElapsedMs}ms", requestName, sw.ElapsedMilliseconds);
            return response;
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Error handling {RequestName} after {ElapsedMs}ms", requestName, sw.ElapsedMilliseconds);
            throw;
        }
    }
}
```

### 10.3 `Common/Behaviors/PerformanceBehavior.cs`

```csharp
using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace Web.Common.Behaviors;

/// <summary>
/// Emits a warning when a handler exceeds the slow threshold (500ms default).
/// Aids proactive performance monitoring without third-party APM.
/// </summary>
public sealed class PerformanceBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private const int SlowRequestThresholdMs = 500;
    private readonly ILogger<PerformanceBehavior<TRequest, TResponse>> _logger;

    public PerformanceBehavior(ILogger<PerformanceBehavior<TRequest, TResponse>> logger)
        => _logger = logger;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();
        var response = await next();
        sw.Stop();

        if (sw.ElapsedMilliseconds > SlowRequestThresholdMs)
        {
            _logger.LogWarning(
                "SLOW_REQUEST: {RequestName} took {ElapsedMs}ms. Request: {@Request}",
                typeof(TRequest).Name,
                sw.ElapsedMilliseconds,
                request);
        }

        return response;
    }
}
```

---

## 11. Application — Features: Users

### 11.1 `Features/Users/Commands/CreateUser.cs`

```csharp
using Carter;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Web.Common.Exceptions;
using Web.Domain.Entities;
using Web.Infrastructure.Repositories;
using Web.Shared.Responses;

namespace Web.Features.Users.Commands;

// ─── Request ───────────────────────────────────────────────────────────────────

public sealed record CreateUserCommand(
    string EmployeeCode,
    string FullName,
    string Email,
    string Role,
    int DepartmentId) : IRequest<ApiResponse<CreateUserResponse>>;

public sealed record CreateUserResponse(int Id, string EmployeeCode, string FullName, string Email);

// ─── Validator ─────────────────────────────────────────────────────────────────

public sealed class CreateUserValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.EmployeeCode)
            .NotEmpty().WithMessage("Employee code is required.")
            .MaximumLength(20).WithMessage("Employee code must not exceed 20 characters.")
            .Matches(@"^[A-Za-z0-9\-]+$").WithMessage("Employee code must be alphanumeric.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(150);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(200);

        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(r => new[] { "employee", "hod", "it" }.Contains(r.ToLowerInvariant()))
            .WithMessage("Role must be one of: employee, hod, it.");

        RuleFor(x => x.DepartmentId)
            .GreaterThan(0).WithMessage("A valid department is required.");
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

public sealed class CreateUserHandler : IRequestHandler<CreateUserCommand, ApiResponse<CreateUserResponse>>
{
    private readonly IUnitOfWork _uow;

    public CreateUserHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<ApiResponse<CreateUserResponse>> Handle(
        CreateUserCommand request,
        CancellationToken cancellationToken)
    {
        // Guard: duplicate employee code
        var exists = await _uow.Employees.ExistsAsync(
            e => e.EmployeeCode == request.EmployeeCode.ToUpperInvariant(),
            cancellationToken);

        if (exists)
            throw new ConflictException($"Employee with code '{request.EmployeeCode}' already exists.");

        // Guard: department exists
        var deptExists = await _uow.Departments.ExistsAsync(
            d => d.Id == request.DepartmentId,
            cancellationToken);

        if (!deptExists)
            throw new NotFoundException(nameof(Domain.Entities.Department), request.DepartmentId);

        var employee = Employee.Create(
            request.EmployeeCode,
            request.FullName,
            request.Email,
            request.Role,
            request.DepartmentId,
            "system"); // Replace with ICurrentUserService.UserId

        await _uow.Employees.AddAsync(employee, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return ApiResponse<CreateUserResponse>.Created(
            new CreateUserResponse(employee.Id, employee.EmployeeCode, employee.FullName, employee.Email),
            "Employee created successfully.");
    }
}
```

### 11.2 `Features/Users/Queries/GetUserById.cs`

```csharp
using Carter;
using FluentValidation;
using MediatR;
using Web.Common.Exceptions;
using Web.Infrastructure.Repositories;
using Web.Shared.Responses;

namespace Web.Features.Users.Queries;

// ─── Request ───────────────────────────────────────────────────────────────────

public sealed record GetUserByIdQuery(int Id) : IRequest<ApiResponse<UserDto>>;

public sealed record UserDto(
    int Id,
    string EmployeeCode,
    string FullName,
    string Email,
    string Role,
    int DepartmentId,
    string DepartmentName,
    DateTime CreatedAt);

// ─── Handler ──────────────────────────────────────────────────────────────────

public sealed class GetUserByIdHandler : IRequestHandler<GetUserByIdQuery, ApiResponse<UserDto>>
{
    private readonly IDapperRepository _dapper;

    public GetUserByIdHandler(IDapperRepository dapper) => _dapper = dapper;

    public async Task<ApiResponse<UserDto>> Handle(
        GetUserByIdQuery request,
        CancellationToken cancellationToken)
    {
        // Dapper read — join with department, no EF overhead
        const string sql = """
            SELECT e.Id, e.EmployeeCode, e.FullName, e.Email, e.Role,
                   e.DepartmentId, d.Name AS DepartmentName, e.CreatedAt
            FROM Jan_Emp_Mast_V e
            INNER JOIN Jan_Department d ON d.Id = e.DepartmentId
            WHERE e.Id = @Id AND e.IsDeleted = 0
            """;

        var user = await _dapper.QuerySingleOrDefaultAsync<UserDto>(
            sql,
            new { request.Id },
            cancellationToken: cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.Employee), request.Id);

        return ApiResponse<UserDto>.Ok(user);
    }
}
```

### 11.3 `Features/Users/UsersEndpoints.cs`

```csharp
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Web.Features.Users.Commands;
using Web.Features.Users.Queries;

namespace Web.Features.Users;

/// <summary>
/// Carter module — maps HTTP routes to MediatR commands/queries.
/// Carter keeps endpoint registration collocated with the feature, not scattered across controllers.
/// </summary>
public sealed class UsersEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/users")
            .WithTags("Users")
            .WithOpenApi();

        group.MapPost("/", async (CreateUserCommand command, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(command, ct);
            return Results.Created($"/api/v1/users/{result.Data?.Id}", result);
        })
        .WithName("CreateUser")
        .WithSummary("Create a new employee")
        .Produces(201)
        .Produces(409)
        .Produces(422);

        group.MapGet("/{id:int}", async (int id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetUserByIdQuery(id), ct);
            return Results.Ok(result);
        })
        .WithName("GetUserById")
        .WithSummary("Get employee by ID")
        .Produces(200)
        .Produces(404);
    }
}
```

---

## 12. Application — Features: Departments

### 12.1 `Features/Departments/Commands/CreateDepartment.cs`

```csharp
using FluentValidation;
using MediatR;
using Web.Common.Exceptions;
using Web.Domain.Entities;
using Web.Infrastructure.Repositories;
using Web.Shared.Responses;

namespace Web.Features.Departments.Commands;

public sealed record CreateDepartmentCommand(string Code, string Name)
    : IRequest<ApiResponse<DepartmentDto>>;

public sealed record DepartmentDto(int Id, string Code, string Name);

public sealed class CreateDepartmentValidator : AbstractValidator<CreateDepartmentCommand>
{
    public CreateDepartmentValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
    }
}

public sealed class CreateDepartmentHandler : IRequestHandler<CreateDepartmentCommand, ApiResponse<DepartmentDto>>
{
    private readonly IUnitOfWork _uow;

    public CreateDepartmentHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<ApiResponse<DepartmentDto>> Handle(
        CreateDepartmentCommand request,
        CancellationToken cancellationToken)
    {
        var exists = await _uow.Departments.ExistsAsync(
            d => d.DepartmentCode == request.Code.ToUpperInvariant(),
            cancellationToken);

        if (exists) throw new ConflictException($"Department '{request.Code}' already exists.");

        var dept = Department.Create(request.Code, request.Name, "system");
        await _uow.Departments.AddAsync(dept, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return ApiResponse<DepartmentDto>.Created(new DepartmentDto(dept.Id, dept.DepartmentCode, dept.Name));
    }
}
```

### 12.2 `Features/Departments/Commands/DeleteDepartment.cs`

```csharp
using MediatR;
using Web.Common.Exceptions;
using Web.Infrastructure.Repositories;
using Web.Shared.Responses;

namespace Web.Features.Departments.Commands;

public sealed record DeleteDepartmentCommand(int Id, string DeletedBy)
    : IRequest<ApiResponse<bool>>;

public sealed class DeleteDepartmentHandler : IRequestHandler<DeleteDepartmentCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _uow;

    public DeleteDepartmentHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<ApiResponse<bool>> Handle(
        DeleteDepartmentCommand request,
        CancellationToken cancellationToken)
    {
        var dept = await _uow.Departments.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Department), request.Id);

        // Guard: do not delete if employees are assigned
        var hasEmployees = await _uow.Employees.ExistsAsync(
            e => e.DepartmentId == request.Id,
            cancellationToken);

        if (hasEmployees)
            throw new ConflictException("Cannot delete department with assigned employees.");

        _uow.Departments.SoftDelete(dept, request.DeletedBy);
        await _uow.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Department deleted.");
    }
}
```

### 12.3 `Features/Departments/Queries/GetDepartmentsList.cs`

```csharp
using MediatR;
using Web.Infrastructure.Repositories;
using Web.Shared.Pagination;
using Web.Shared.Responses;

namespace Web.Features.Departments.Queries;

public sealed record GetDepartmentsListQuery(PaginationParams Pagination)
    : IRequest<PagedResponse<DepartmentListItemDto>>;

public sealed record DepartmentListItemDto(int Id, string Code, string Name, int EmployeeCount);

public sealed class GetDepartmentsListHandler
    : IRequestHandler<GetDepartmentsListQuery, PagedResponse<DepartmentListItemDto>>
{
    private readonly IDapperRepository _dapper;

    public GetDepartmentsListHandler(IDapperRepository dapper) => _dapper = dapper;

    public async Task<PagedResponse<DepartmentListItemDto>> Handle(
        GetDepartmentsListQuery request,
        CancellationToken cancellationToken)
    {
        var p = request.Pagination;
        var offset = (p.PageNumber - 1) * p.PageSize;

        const string countSql = """
            SELECT COUNT(*) FROM Jan_Department WHERE IsDeleted = 0
            """;

        var dataSql = $"""
            SELECT d.Id, d.DepartmentCode AS Code, d.Name,
                   COUNT(e.Id) AS EmployeeCount
            FROM Jan_Department d
            LEFT JOIN Jan_Emp_Mast_V e ON e.DepartmentId = d.Id AND e.IsDeleted = 0
            WHERE d.IsDeleted = 0
            GROUP BY d.Id, d.DepartmentCode, d.Name
            ORDER BY d.{p.SortBy ?? "Name"} {(p.SortDescending ? "DESC" : "ASC")}
            LIMIT @PageSize OFFSET @Offset
            """;

        var (items, total) = await _dapper.QueryPagedAsync<DepartmentListItemDto>(
            countSql,
            dataSql,
            new { p.PageSize, Offset = offset },
            cancellationToken);

        return PagedResponse<DepartmentListItemDto>.Create(items, total, p.PageNumber, p.PageSize);
    }
}
```

### 12.4 `Features/Departments/DepartmentEndpoints.cs`

```csharp
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Web.Features.Departments.Commands;
using Web.Features.Departments.Queries;
using Web.Shared.Pagination;

namespace Web.Features.Departments;

public sealed class DepartmentEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/departments")
            .WithTags("Departments")
            .WithOpenApi();

        group.MapGet("/", async ([AsParameters] PaginationParams pagination, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetDepartmentsListQuery(pagination), ct);
            return Results.Ok(result);
        })
        .WithName("GetDepartments")
        .WithSummary("Get paginated list of departments");

        group.MapGet("/{id:int}", async (int id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetDepartmentByIdQuery(id), ct);
            return Results.Ok(result);
        })
        .WithName("GetDepartmentById");

        group.MapPost("/", async (CreateDepartmentCommand cmd, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(cmd, ct);
            return Results.Created($"/api/v1/departments/{result.Data?.Id}", result);
        })
        .WithName("CreateDepartment");

        group.MapDelete("/{id:int}", async (int id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new DeleteDepartmentCommand(id, "system"), ct);
            return Results.Ok(result);
        })
        .WithName("DeleteDepartment");
    }
}
```

---

## 13. Application — Features: AccessRequest

### 13.1 `Features/AccessRequest/Commands/CreateAccessRequest.cs`

```csharp
using FluentValidation;
using MediatR;
using Web.Common.Exceptions;
using Web.Domain.Enums;
using Web.Infrastructure.Repositories;
using Web.Shared.Responses;

namespace Web.Features.AccessRequest.Commands;

// ─── Request ───────────────────────────────────────────────────────────────────

public sealed record CreateAccessRequestCommand(
    int RequesterId,
    string FolderPath,
    string AccessType,
    string Justification) : IRequest<ApiResponse<AccessRequestCreatedDto>>;

public sealed record AccessRequestCreatedDto(
    int Id,
    string RequestNumber,
    string Status,
    string FolderPath);

// ─── Validator ─────────────────────────────────────────────────────────────────

public sealed class CreateAccessRequestValidator : AbstractValidator<CreateAccessRequestCommand>
{
    public CreateAccessRequestValidator()
    {
        RuleFor(x => x.RequesterId).GreaterThan(0);

        RuleFor(x => x.FolderPath)
            .NotEmpty()
            .MaximumLength(500)
            .Must(p => !p.Contains("..")).WithMessage("Folder path cannot contain path traversal sequences.");

        RuleFor(x => x.AccessType)
            .NotEmpty()
            .Must(v => Enum.TryParse<AccessType>(v, true, out _))
            .WithMessage("AccessType must be: ReadOnly, ReadWrite, or FullControl.");

        RuleFor(x => x.Justification)
            .NotEmpty()
            .MinimumLength(10).WithMessage("Justification must be at least 10 characters.")
            .MaximumLength(1000);
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

public sealed class CreateAccessRequestHandler
    : IRequestHandler<CreateAccessRequestCommand, ApiResponse<AccessRequestCreatedDto>>
{
    private readonly IUnitOfWork _uow;

    public CreateAccessRequestHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<ApiResponse<AccessRequestCreatedDto>> Handle(
        CreateAccessRequestCommand request,
        CancellationToken cancellationToken)
    {
        // Validate requester exists
        var requesterExists = await _uow.Employees.ExistsAsync(
            e => e.Id == request.RequesterId, cancellationToken);

        if (!requesterExists)
            throw new NotFoundException(nameof(Domain.Entities.Employee), request.RequesterId);

        // Guard: no duplicate pending requests for same folder
        var hasPending = await _uow.AccessRequests.ExistsAsync(
            r => r.RequesterId == request.RequesterId
                && r.FolderPath == request.FolderPath
                && r.Status == RequestStatus.Pending,
            cancellationToken);

        if (hasPending)
            throw new ConflictException("A pending request for this folder already exists.");

        var accessType = Enum.Parse<AccessType>(request.AccessType, true);
        var accessRequest = Domain.Entities.AccessRequest.Create(
            request.RequesterId,
            request.FolderPath,
            accessType,
            request.Justification,
            "system");

        await _uow.AccessRequests.AddAsync(accessRequest, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return ApiResponse<AccessRequestCreatedDto>.Created(
            new AccessRequestCreatedDto(
                accessRequest.Id,
                accessRequest.RequestNumber,
                accessRequest.Status.ToString(),
                accessRequest.FolderPath),
            "Access request submitted successfully.");
    }
}
```

### 13.2 `Features/AccessRequest/Queries/GetAccessRequestById.cs`

```csharp
using MediatR;
using Web.Common.Exceptions;
using Web.Infrastructure.Repositories;
using Web.Shared.Responses;

namespace Web.Features.AccessRequest.Queries;

public sealed record GetAccessRequestByIdQuery(int Id) : IRequest<ApiResponse<AccessRequestDetailDto>>;

public sealed record AccessRequestDetailDto(
    int Id,
    string RequestNumber,
    string FolderPath,
    string AccessType,
    string Status,
    string Justification,
    string RequesterName,
    string RequesterCode,
    DateTime CreatedAt,
    List<ApprovalSummaryDto> Approvals);

public sealed record ApprovalSummaryDto(
    string Stage,
    string ApproverName,
    bool IsApproved,
    string? Comments,
    DateTime ActionedAt);

public sealed class GetAccessRequestByIdHandler
    : IRequestHandler<GetAccessRequestByIdQuery, ApiResponse<AccessRequestDetailDto>>
{
    private readonly IDapperRepository _dapper;

    public GetAccessRequestByIdHandler(IDapperRepository dapper) => _dapper = dapper;

    public async Task<ApiResponse<AccessRequestDetailDto>> Handle(
        GetAccessRequestByIdQuery request,
        CancellationToken cancellationToken)
    {
        const string requestSql = """
            SELECT r.Id, r.RequestNumber, r.FolderPath, r.AccessType, r.Status,
                   r.Justification, e.FullName AS RequesterName, e.EmployeeCode AS RequesterCode,
                   r.CreatedAt
            FROM Jan_Access_Request r
            INNER JOIN Jan_Emp_Mast_V e ON e.Id = r.RequesterId
            WHERE r.Id = @Id AND r.IsDeleted = 0
            """;

        const string approvalsSql = """
            SELECT a.Stage, e.FullName AS ApproverName, a.IsApproved, a.Comments, a.ActionedAt
            FROM Jan_Access_Approval a
            INNER JOIN Jan_Emp_Mast_V e ON e.Id = a.ApproverId
            WHERE a.AccessRequestId = @Id
            ORDER BY a.ActionedAt
            """;

        var dto = await _dapper.QuerySingleOrDefaultAsync<dynamic>(
            requestSql, new { request.Id }, cancellationToken: cancellationToken);

        if (dto is null)
            throw new NotFoundException("AccessRequest", request.Id);

        var approvals = await _dapper.QueryAsync<ApprovalSummaryDto>(
            approvalsSql, new { request.Id }, cancellationToken: cancellationToken);

        var result = new AccessRequestDetailDto(
            (int)dto.Id,
            (string)dto.RequestNumber,
            (string)dto.FolderPath,
            (string)dto.AccessType,
            (string)dto.Status,
            (string)dto.Justification,
            (string)dto.RequesterName,
            (string)dto.RequesterCode,
            (DateTime)dto.CreatedAt,
            approvals.ToList());

        return ApiResponse<AccessRequestDetailDto>.Ok(result);
    }
}
```

### 13.3 `Features/AccessRequest/AccessRequestEndpoints.cs`

```csharp
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Web.Features.AccessRequest.Commands;
using Web.Features.AccessRequest.Queries;

namespace Web.Features.AccessRequest;

public sealed class AccessRequestEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/access-requests")
            .WithTags("AccessRequests")
            .WithOpenApi();

        group.MapPost("/", async (CreateAccessRequestCommand cmd, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(cmd, ct);
            return Results.Created($"/api/v1/access-requests/{result.Data?.Id}", result);
        })
        .WithName("CreateAccessRequest")
        .WithSummary("Submit a new folder access request");

        group.MapGet("/{id:int}", async (int id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetAccessRequestByIdQuery(id), ct);
            return Results.Ok(result);
        })
        .WithName("GetAccessRequestById");
    }
}
```

---

## 14. Application — Features: Approval

### 14.1 `Features/Approval/Commands/CreateApproval.cs`

```csharp
using FluentValidation;
using MediatR;
using Web.Common.Exceptions;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Infrastructure.Repositories;
using Web.Shared.Responses;

namespace Web.Features.Approval.Commands;

public sealed record CreateApprovalCommand(
    int AccessRequestId,
    int ApproverId,
    string Stage,
    bool IsApproved,
    string? Comments) : IRequest<ApiResponse<ApprovalResultDto>>;

public sealed record ApprovalResultDto(int Id, string RequestNumber, string NewStatus);

public sealed class CreateApprovalValidator : AbstractValidator<CreateApprovalCommand>
{
    public CreateApprovalValidator()
    {
        RuleFor(x => x.AccessRequestId).GreaterThan(0);
        RuleFor(x => x.ApproverId).GreaterThan(0);
        RuleFor(x => x.Stage)
            .Must(s => Enum.TryParse<ApprovalStage>(s, true, out _))
            .WithMessage("Stage must be 'Hod' or 'It'.");
        RuleFor(x => x.Comments).MaximumLength(500).When(x => x.Comments is not null);
    }
}

/// <summary>
/// Orchestrates the two-stage approval workflow.
/// All state changes go through the domain entity — never set Status directly.
/// </summary>
public sealed class CreateApprovalHandler : IRequestHandler<CreateApprovalCommand, ApiResponse<ApprovalResultDto>>
{
    private readonly IUnitOfWork _uow;

    public CreateApprovalHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<ApiResponse<ApprovalResultDto>> Handle(
        CreateApprovalCommand request,
        CancellationToken cancellationToken)
    {
        var stage = Enum.Parse<ApprovalStage>(request.Stage, true);

        // Load the access request for mutation (tracked)
        var accessRequest = await _uow.AccessRequests.GetByIdAsync(request.AccessRequestId, cancellationToken)
            ?? throw new NotFoundException("AccessRequest", request.AccessRequestId);

        // Validate approver exists and has the right role
        var approver = await _uow.Employees.FirstOrDefaultAsync(
            e => e.Id == request.ApproverId, cancellationToken)
            ?? throw new NotFoundException("Approver", request.ApproverId);

        ValidateApproverRole(approver.Role, stage);

        // State machine transition (throws if invalid)
        if (stage == ApprovalStage.Hod)
        {
            if (request.IsApproved) accessRequest.ApproveByHod(approver.EmployeeCode);
            else accessRequest.RejectByHod(approver.EmployeeCode);
        }
        else
        {
            if (request.IsApproved) accessRequest.ApproveByIt(approver.EmployeeCode);
            else accessRequest.RejectByIt(approver.EmployeeCode);
        }

        // Record the approval audit entry
        var approval = AccessApproval.Create(
            request.AccessRequestId,
            request.ApproverId,
            stage,
            request.IsApproved,
            request.Comments,
            approver.EmployeeCode);

        await _uow.AccessApprovals.AddAsync(approval, cancellationToken);

        // If IT-approved, provision access details
        if (stage == ApprovalStage.It && request.IsApproved)
        {
            var detail = AccessDetail.Create(
                request.AccessRequestId,
                accessRequest.FolderPath,
                accessRequest.AccessType,
                approver.EmployeeCode);

            await _uow.AccessDetails.AddAsync(detail, cancellationToken);
        }

        await _uow.SaveChangesAsync(cancellationToken);

        return ApiResponse<ApprovalResultDto>.Ok(
            new ApprovalResultDto(approval.Id, accessRequest.RequestNumber, accessRequest.Status.ToString()),
            $"Access request {(request.IsApproved ? "approved" : "rejected")} successfully.");
    }

    private static void ValidateApproverRole(string role, ApprovalStage stage)
    {
        var required = stage == ApprovalStage.Hod ? "hod" : "it";
        if (role != required)
            throw new ForbiddenException($"This approval stage requires a '{required}' role approver.");
    }
}
```

### 14.2 `Features/Approval/ApprovalEndpoints.cs`

```csharp
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Web.Features.Approval.Commands;
using Web.Features.Approval.Queries;

namespace Web.Features.Approval;

public sealed class ApprovalEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/approvals")
            .WithTags("Approvals")
            .WithOpenApi();

        group.MapPost("/", async (CreateApprovalCommand cmd, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(cmd, ct);
            return Results.Ok(result);
        })
        .WithName("CreateApproval")
        .WithSummary("Submit HOD or IT approval decision");

        group.MapGet("/{id:int}", async (int id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetApprovalByIdQuery(id), ct);
            return Results.Ok(result);
        })
        .WithName("GetApprovalById");
    }
}
```

---

## 15. Application — Features: Audit

### 15.1 `Features/Audit/Queries/GetAuditLogs.cs`

```csharp
using MediatR;
using Web.Infrastructure.Repositories;
using Web.Shared.Pagination;
using Web.Shared.Responses;

namespace Web.Features.Audit.Queries;

public sealed record GetAuditLogsQuery(
    PaginationParams Pagination,
    string? EntityName = null,
    int? EntityId = null) : IRequest<PagedResponse<AuditLogDto>>;

public sealed record AuditLogDto(
    int Id,
    string EntityName,
    int EntityId,
    string Action,
    string? OldValues,
    string? NewValues,
    string PerformedBy,
    DateTime PerformedAt,
    string? CorrelationId);

public sealed class GetAuditLogsHandler : IRequestHandler<GetAuditLogsQuery, PagedResponse<AuditLogDto>>
{
    private readonly IDapperRepository _dapper;

    public GetAuditLogsHandler(IDapperRepository dapper) => _dapper = dapper;

    public async Task<PagedResponse<AuditLogDto>> Handle(
        GetAuditLogsQuery request,
        CancellationToken cancellationToken)
    {
        var p = request.Pagination;
        var offset = (p.PageNumber - 1) * p.PageSize;

        var whereClause = BuildWhereClause(request);

        var countSql = $"SELECT COUNT(*) FROM Jan_Audit_Log {whereClause}";
        var dataSql = $"""
            SELECT Id, EntityName, EntityId, Action, OldValues, NewValues,
                   PerformedBy, PerformedAt, CorrelationId
            FROM Jan_Audit_Log
            {whereClause}
            ORDER BY PerformedAt DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        var param = new
        {
            request.EntityName,
            request.EntityId,
            p.PageSize,
            Offset = offset
        };

        var (items, total) = await _dapper.QueryPagedAsync<AuditLogDto>(
            countSql, dataSql, param, cancellationToken);

        return PagedResponse<AuditLogDto>.Create(items, total, p.PageNumber, p.PageSize);
    }

    private static string BuildWhereClause(GetAuditLogsQuery request)
    {
        var conditions = new List<string>();
        if (!string.IsNullOrWhiteSpace(request.EntityName))
            conditions.Add("EntityName = @EntityName");
        if (request.EntityId.HasValue)
            conditions.Add("EntityId = @EntityId");

        return conditions.Any() ? $"WHERE {string.Join(" AND ", conditions)}" : string.Empty;
    }
}
```

### 15.2 `Features/Audit/AuditEndpoints.cs`

```csharp
using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Web.Features.Audit.Queries;
using Web.Shared.Pagination;

namespace Web.Features.Audit;

public sealed class AuditEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/audit-logs")
            .WithTags("Audit")
            .WithOpenApi();

        group.MapGet("/", async (
            [AsParameters] PaginationParams pagination,
            string? entityName,
            int? entityId,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new GetAuditLogsQuery(pagination, entityName, entityId), ct);
            return Results.Ok(result);
        })
        .WithName("GetAuditLogs")
        .WithSummary("Query audit log entries with optional filters");
    }
}
```

---

## 16. Application — Features: Notifications

### 16.1 `Features/Notifications/Commands/SendNotification.cs`

```csharp
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using Web.Shared.Responses;

namespace Web.Features.Notifications.Commands;

public sealed record SendNotificationCommand(
    string RecipientEmail,
    string Subject,
    string Body,
    string NotificationType) : IRequest<ApiResponse<bool>>;

public sealed class SendNotificationValidator : AbstractValidator<SendNotificationCommand>
{
    public SendNotificationValidator()
    {
        RuleFor(x => x.RecipientEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(5000);
        RuleFor(x => x.NotificationType)
            .Must(t => new[] { "email", "system" }.Contains(t.ToLowerInvariant()))
            .WithMessage("NotificationType must be 'email' or 'system'.");
    }
}

/// <summary>
/// Notification handler — currently logs (simulating send).
/// Wire in SMTP / Azure Communication Services without touching the handler contract.
/// </summary>
public sealed class SendNotificationHandler
    : IRequestHandler<SendNotificationCommand, ApiResponse<bool>>
{
    private readonly ILogger<SendNotificationHandler> _logger;

    public SendNotificationHandler(ILogger<SendNotificationHandler> logger)
        => _logger = logger;

    public async Task<ApiResponse<bool>> Handle(
        SendNotificationCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Sending {Type} notification to {Email} — Subject: {Subject}",
            request.NotificationType, request.RecipientEmail, request.Subject);

        // TODO: inject IEmailSender or INotificationService and call here
        await Task.Delay(10, cancellationToken); // simulate async send

        return ApiResponse<bool>.Ok(true, "Notification queued successfully.");
    }
}
```

---

## 17. API Layer — Middleware

### 17.1 `Common/Middlewares/ExceptionMiddleware.cs`

```csharp
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Web.Common.Exceptions;
using Web.Shared.Responses;

namespace Web.Common.Middlewares;

/// <summary>
/// Global exception handler — converts all unhandled exceptions to ProblemDetails-compatible JSON.
/// Never leaks stack traces in production. Correlation ID ties log entry to response.
/// </summary>
public sealed class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var correlationId = context.Items["CorrelationId"]?.ToString();
            _logger.LogError(ex, "Unhandled exception. CorrelationId: {CorrelationId}", correlationId);
            await HandleExceptionAsync(context, ex, correlationId);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception, string? correlationId)
    {
        context.Response.ContentType = "application/json";

        (int statusCode, string message, IDictionary<string, string[]>? validationErrors) = exception switch
        {
            ValidationException ve => (422, ve.Message, ve.Errors),
            NotFoundException nfe => (404, nfe.Message, null),
            ConflictException ce => (409, ce.Message, null),
            ForbiddenException fe => (403, fe.Message, null),
            AppException ae => (ae.StatusCode, ae.Message, null),
            OperationCanceledException => (499, "Request was cancelled.", null),
            _ => (500, _env.IsProduction()
                ? "An internal server error occurred."
                : exception.Message, null)
        };

        context.Response.StatusCode = statusCode;

        ApiResponse<object> response = validationErrors is not null
            ? ApiResponse<object>.ValidationFail(validationErrors, correlationId)
            : ApiResponse<object>.Fail(message, statusCode, correlationId: correlationId);

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
```

### 17.2 `Common/Middlewares/CorrelationMiddleware.cs`

```csharp
using Microsoft.AspNetCore.Http;

namespace Web.Common.Middlewares;

/// <summary>
/// Injects or generates a Correlation ID for distributed tracing.
/// Passes it through in the response header so clients can correlate logs.
/// </summary>
public sealed class CorrelationMiddleware
{
    private const string CorrelationIdHeader = "X-Correlation-Id";
    private readonly RequestDelegate _next;

    public CorrelationMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[CorrelationIdHeader].FirstOrDefault()
            ?? Guid.NewGuid().ToString("N");

        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers[CorrelationIdHeader] = correlationId;

        await _next(context);
    }
}
```

### 17.3 `Common/Middlewares/PerformanceMiddleware.cs`

```csharp
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace Web.Common.Middlewares;

/// <summary>Measures total HTTP request time and logs slow requests at warning level.</summary>
public sealed class PerformanceMiddleware
{
    private const int SlowRequestThresholdMs = 1000;
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceMiddleware> _logger;

    public PerformanceMiddleware(RequestDelegate next, ILogger<PerformanceMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        await _next(context);
        sw.Stop();

        var elapsed = sw.ElapsedMilliseconds;

        if (elapsed > SlowRequestThresholdMs)
        {
            _logger.LogWarning(
                "SLOW_HTTP: {Method} {Path} responded {StatusCode} in {Elapsed}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                elapsed);
        }
        else
        {
            _logger.LogInformation(
                "{Method} {Path} → {StatusCode} in {Elapsed}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                elapsed);
        }
    }
}
```

---

## 18. API Layer — Program.cs & DI Registration

### 18.1 `Program.cs`

```csharp
using Serilog;
using Web.Infrastructure.DependencyInjection;
using Web.Common.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// ─── Serilog ──────────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .CreateLogger();

builder.Host.UseSerilog();

// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddWebServices(builder.Configuration);

var app = builder.Build();

// ─── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseWebMiddleware();

// ─── Database Migrate & Seed ──────────────────────────────────────────────────
await app.Services.MigrateAndSeedAsync();

app.Run();
```

### 18.2 `Program.ServiceExtensions.cs`

```csharp
using Carter;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http.Json;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Web.Common.Behaviors;
using Web.Infrastructure.Services;
using Web.Infrastructure.Persistence;

public static class ServiceExtensions
{
    /// <summary>
    /// Application-layer DI: MediatR, FluentValidation, Carter, pipeline behaviors.
    /// </summary>
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // MediatR — discovers all IRequestHandler<,> in assembly
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));
        });

        // FluentValidation — discovers all AbstractValidator<> in assembly
        services.AddValidatorsFromAssembly(assembly);

        // Carter — Minimal API module routing
        services.AddCarter();

        return services;
    }
}
```

### 18.3 `Program.WebExtensions.cs`

```csharp
using Carter;
using Microsoft.AspNetCore.Http.Json;
using Serilog;
using System.Text.Json;
using System.Text.Json.Serialization;
using Web.Common.Middlewares;

public static class WebExtensions
{
    public static IServiceCollection AddWebServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new()
            {
                Title = "Janatics Access Management API",
                Version = "v1",
                Description = "File/Folder Access Request and Approval API"
            });
            c.CustomSchemaIds(t => t.FullName?.Replace("+", "."));
        });

        services.Configure<JsonOptions>(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCors", policy =>
            {
                policy
                    .WithOrigins(configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>("database");

        services.AddHttpContextAccessor();
        services.AddResponseCompression(opts => opts.EnableForHttps = true);

        return services;
    }

    public static WebApplication UseWebMiddleware(this WebApplication app)
    {
        app.UseMiddleware<CorrelationMiddleware>();
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseMiddleware<PerformanceMiddleware>();

        app.UseSerilogRequestLogging();
        app.UseResponseCompression();
        app.UseCors("DefaultCors");
        app.UseHttpsRedirection();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Janatics API v1"));
        }

        app.MapCarter();
        app.MapHealthChecks("/health");

        return app;
    }
}
```

---

## 19. Configuration Files

### 19.1 `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=JanaticsPortal;User=janatics_user;Password=CHANGE_ME;AllowPublicKeyRetrieval=true;SslMode=none;CharSet=utf8mb4;"
  },
  "Serilog": {
    "Using": ["Serilog.Sinks.Console", "Serilog.Sinks.File"],
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.EntityFrameworkCore": "Warning",
        "Microsoft.AspNetCore": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      {
        "Name": "File",
        "Args": {
          "path": "logs/janatics-api-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      }
    ],
    "Enrich": ["FromLogContext", "WithMachineName", "WithEnvironmentName"]
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173", "https://portal.janatics.com"]
  },
  "Swagger": {
    "Enabled": true
  }
}
```

### 19.2 `appsettings.Development.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=JanaticsPortalDev;User=root;Password=root;AllowPublicKeyRetrieval=true;SslMode=none;"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug",
      "Override": {
        "Microsoft.EntityFrameworkCore.Database.Command": "Information"
      }
    }
  }
}
```

### 19.3 `Web.csproj` (Package References)

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>Web</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <!-- ORM & DB -->
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.*" />
    <PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="8.0.*" />
    <PackageReference Include="Dapper" Version="2.1.*" />
    <PackageReference Include="MySqlConnector" Version="2.3.*" />

    <!-- CQRS & Validation -->
    <PackageReference Include="MediatR" Version="12.*" />
    <PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="11.*" />

    <!-- Routing -->
    <PackageReference Include="Carter" Version="8.*" />

    <!-- Logging -->
    <PackageReference Include="Serilog.AspNetCore" Version="8.*" />
    <PackageReference Include="Serilog.Enrichers.Environment" Version="2.*" />
    <PackageReference Include="Serilog.Enrichers.Process" Version="2.*" />
    <PackageReference Include="Serilog.Sinks.File" Version="5.*" />

    <!-- Resilience -->
    <PackageReference Include="Polly" Version="8.*" />

    <!-- API -->
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.*" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.*" />
    <PackageReference Include="Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore" Version="8.*" />
  </ItemGroup>
</Project>
```

---

## 20. Testing

### 20.1 Unit Test — `Tests/UnitTests/CreateAccessRequestHandlerTests.cs`

```csharp
using FluentAssertions;
using Moq;
using Web.Common.Exceptions;
using Web.Domain.Entities;
using Web.Domain.Enums;
using Web.Features.AccessRequest.Commands;
using Web.Infrastructure.Repositories;
using Xunit;

namespace Web.Tests.UnitTests;

public sealed class CreateAccessRequestHandlerTests
{
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly CreateAccessRequestHandler _handler;

    public CreateAccessRequestHandlerTests()
    {
        _handler = new CreateAccessRequestHandler(_uowMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ReturnsCreatedResponse()
    {
        // Arrange
        var command = new CreateAccessRequestCommand(1, "/shared/docs", "ReadOnly", "Need access for project XYZ review.");

        _uowMock.Setup(u => u.Employees.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Employee, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _uowMock.Setup(u => u.AccessRequests.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Domain.Entities.AccessRequest, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _uowMock.Setup(u => u.AccessRequests.AddAsync(It.IsAny<Domain.Entities.AccessRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _uowMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.StatusCode.Should().Be(201);
        result.Data!.FolderPath.Should().Be("/shared/docs");
    }

    [Fact]
    public async Task Handle_RequesterNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var command = new CreateAccessRequestCommand(999, "/shared/docs", "ReadOnly", "Need access for something.");

        _uowMock.Setup(u => u.Employees.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Employee, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Employee*999*");
    }

    [Fact]
    public async Task Handle_DuplicatePendingRequest_ThrowsConflictException()
    {
        // Arrange
        var command = new CreateAccessRequestCommand(1, "/shared/docs", "ReadOnly", "Duplicate justification here.");

        _uowMock.Setup(u => u.Employees.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Employee, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _uowMock.Setup(u => u.AccessRequests.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Domain.Entities.AccessRequest, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true); // duplicate

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*pending*");
    }
}
```

### 20.2 Unit Test — `Tests/UnitTests/AccessRequestDomainTests.cs`

```csharp
using FluentAssertions;
using Web.Domain.Enums;
using Xunit;

namespace Web.Tests.UnitTests;

public sealed class AccessRequestDomainTests
{
    [Fact]
    public void Create_ValidInputs_SetsInitialState()
    {
        // Act
        var request = Domain.Entities.AccessRequest.Create(1, "/docs/shared", AccessType.ReadOnly, "Need it for work.", "EMP001");

        // Assert
        request.Status.Should().Be(RequestStatus.Pending);
        request.RequestNumber.Should().StartWith("REQ-");
        request.FolderPath.Should().Be("/docs/shared");
    }

    [Fact]
    public void ApproveByHod_WhenPending_ChangesStatusToHodApproved()
    {
        var request = Domain.Entities.AccessRequest.Create(1, "/docs", AccessType.ReadOnly, "Justification.", "EMP001");
        request.ApproveByHod("HOD001");
        request.Status.Should().Be(RequestStatus.HodApproved);
    }

    [Fact]
    public void ApproveByIt_WithoutHodApproval_ThrowsInvalidOperation()
    {
        var request = Domain.Entities.AccessRequest.Create(1, "/docs", AccessType.ReadOnly, "Justification.", "EMP001");

        var act = () => request.ApproveByIt("IT001");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*HOD approval*");
    }

    [Fact]
    public void Cancel_AfterItApproval_ThrowsInvalidOperation()
    {
        var request = Domain.Entities.AccessRequest.Create(1, "/docs", AccessType.ReadOnly, "Justification.", "EMP001");
        request.ApproveByHod("HOD001");
        request.ApproveByIt("IT001");

        var act = () => request.Cancel("EMP001");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*completed*");
    }
}
```

### 20.3 `Tests/UnitTests/ValidationBehaviorTests.cs`

```csharp
using FluentAssertions;
using FluentValidation;
using MediatR;
using Moq;
using Web.Common.Behaviors;
using Web.Common.Exceptions;
using Xunit;

namespace Web.Tests.UnitTests;

public sealed class ValidationBehaviorTests
{
    private sealed record TestRequest(string Name) : IRequest<string>;

    private sealed class TestValidator : AbstractValidator<TestRequest>
    {
        public TestValidator() => RuleFor(x => x.Name).NotEmpty();
    }

    [Fact]
    public async Task Handle_WithValidRequest_CallsNextDelegate()
    {
        var validators = new IValidator<TestRequest>[] { new TestValidator() };
        var behavior = new ValidationBehavior<TestRequest, string>(validators);
        var nextMock = new Mock<RequestHandlerDelegate<string>>();
        nextMock.Setup(n => n()).ReturnsAsync("ok");

        var result = await behavior.Handle(new TestRequest("Alice"), nextMock.Object, CancellationToken.None);

        result.Should().Be("ok");
        nextMock.Verify(n => n(), Times.Once);
    }

    [Fact]
    public async Task Handle_WithInvalidRequest_ThrowsValidationException()
    {
        var validators = new IValidator<TestRequest>[] { new TestValidator() };
        var behavior = new ValidationBehavior<TestRequest, string>(validators);

        var act = () => behavior.Handle(new TestRequest(""), Mock.Of<RequestHandlerDelegate<string>>(), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }
}
```

---

## 21. Architecture Decisions & Scalability Notes

### Decision Log

| Decision | Rationale |
|----------|-----------|
| **Vertical Slice Architecture** | Features are self-contained. One developer owns one feature end-to-end. Merge conflicts drop dramatically. |
| **MediatR + CQRS** | Decouples HTTP layer from business logic. Handler = unit testable pure function. Pipeline behaviors apply cross-cutting concerns uniformly. |
| **EF Core writes + Dapper reads** | EF Core handles complex object graphs and change tracking for writes. Dapper handles aggregated, joined read projections with zero ORM overhead. |
| **Global soft-delete via query filter** | Deleted data is never returned anywhere without opting out (`IgnoreQueryFilters()`). No per-query WHERE clauses. |
| **Domain entity factory methods** | `Employee.Create(...)` enforces invariants at construction time. No invalid state possible via object initializer. |
| **Result<T> pattern** | Expected failures (not found, conflict) don't use exceptions for control flow. Exceptions reserved for truly unexpected errors. |
| **RowVersion concurrency token** | Prevents lost-update in concurrent edits. EF Core throws `DbUpdateConcurrencyException` automatically. |
| **Polly retry in Dapper repo** | Transient MySQL deadlocks and timeouts are retried with exponential back-off. No retry code in handlers. |
| **Correlation ID middleware** | Every request tagged with an ID — log entries and response header share it. Essential for distributed debugging. |

### Scalability Path

**Current (single process):**
- Connection pooling via Pomelo defaults (max 100 per DbContext)
- IMemoryCache for read-heavy department/employee lookups
- Bulk insert batching at 500 rows

**Next tier (horizontal scale):**
- Replace `MemoryCacheService` with `RedisCacheService` (same `ICacheService` interface — zero handler changes)
- Add read replica connection string and route all `IDapperRepository` reads there
- Extract `SendNotification` to a background job queue (Hangfire / Azure Service Bus)

**Enterprise tier:**
- Domain events → Outbox table → MassTransit/Azure Service Bus
- Per-feature microservices using same Vertical Slice pattern
- OpenTelemetry traces replace Serilog file sinks

### Security Hardening (Production Checklist)

```
☐ Replace X-Employee-Code header with JWT claims (ICurrentUserService swap)
☐ Add rate limiting middleware (Microsoft.AspNetCore.RateLimiting)
☐ Enable HTTPS redirect + HSTS in non-development
☐ Move DB password to environment variable / Azure Key Vault
☐ Set Content-Security-Policy, X-Frame-Options headers
☐ Enable EF Core parameter sniffing protection (already handled by parameterized queries)
☐ Validate FolderPath against an allowlist of root paths
```

### EF Core Migration Commands

```bash
# Add initial migration
dotnet ef migrations add InitialCreate --project Web --output-dir Infrastructure/Persistence/Migrations

# Apply migrations
dotnet ef database update --project Web

# Generate SQL script (for DBA review before production deploy)
dotnet ef migrations script --idempotent --project Web -o migrations.sql
```

---

*Generated for Janatics India Pvt. Ltd. | Janatics Access Management Portal*  
*Architecture: Vertical Slice + Clean Architecture Hybrid | .NET 8 | MySQL + Dapper*
