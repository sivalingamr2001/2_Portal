using Carter;
using MediatR;
using Web.Features.Approval.Commands;

namespace Web.Features.Approval;

public sealed class ApprovalEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/approvals")
            .WithTags("Approvals")
            .WithOpenApi();

        group.MapPost("/", async (CreateApprovalCommand cmd, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(cmd, ct);
            return Results.Ok(result);
        })
        .WithName("CreateApproval")
        .WithSummary("Submit HOD or IT approval decision");

        //group.MapGet("/{id:int}", async (int id, ISender sender, CancellationToken ct) =>
        //{
        //    var result = await sender.Send(new GetApprovalByIdQuery(id), ct);
        //    return Results.Ok(result);
        //})
        //.WithName("GetApprovalById");
    }
}
