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