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