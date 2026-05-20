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