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