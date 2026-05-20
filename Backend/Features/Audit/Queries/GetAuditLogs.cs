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