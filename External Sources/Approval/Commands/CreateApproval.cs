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