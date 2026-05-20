using Web.Common.Exceptions;
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
