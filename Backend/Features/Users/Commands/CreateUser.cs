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