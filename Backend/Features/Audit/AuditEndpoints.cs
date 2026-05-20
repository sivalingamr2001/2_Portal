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