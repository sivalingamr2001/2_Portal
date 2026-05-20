using Carter;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Web.Features.Hod;

public sealed class HodEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/hods")
            .WithTags("Hods")
            .WithOpenApi();

        group.MapGet("/", async Task<IResult>(
            HodService service,
            CancellationToken cancellationToken) =>
        {
            var hods = await service.GetHodsAsync(cancellationToken);
            return TypedResults.Ok(hods);
        });

        group.MapGet("/{userId:int}", async Task<IResult>(
            int userId,
            HodService service,
            CancellationToken cancellationToken) =>
        {
            var hod = await service.GetHodByIdAsync(userId, cancellationToken);
            return hod is null
                ? TypedResults.NotFound()
                : TypedResults.Ok(hod);
        });

        group.MapPost("/", async Task<IResult>(
            HodCreateRequest request,
            HodService service,
            CancellationToken cancellationToken) =>
        {
            var created = await service.CreateHodAsync(request, cancellationToken);
            return TypedResults.Created($"/api/v1/hods/{created.UserId}", created);
        });

        group.MapPut("/{userId:int}", async Task<IResult>(
            int userId,
            HodUpdateRequest request,
            HodService service,
            CancellationToken cancellationToken) =>
        {
            var updated = await service.UpdateHodAsync(userId, request, cancellationToken);
            return updated is null
                ? TypedResults.NotFound()
                : TypedResults.Ok(updated);
        });

        group.MapDelete("/{userId:int}", async Task<IResult>(
            int userId,
            HodService service,
            CancellationToken cancellationToken) =>
        {
            var deleted = await service.DeleteHodAsync(userId, cancellationToken);
            return deleted
                ? TypedResults.NoContent()
                : TypedResults.NotFound();
        });
    }
}
