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