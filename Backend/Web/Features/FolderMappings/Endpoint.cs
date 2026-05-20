using Carter;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Web.Features.FolderMappings;

public sealed class FolderMappingEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/folder-mappings")
            .WithTags("Folder Mappings")
            .WithOpenApi();

        group.MapGet("/", async Task<Ok<List<FolderMappingRecord>>> (
            FolderMappingService service,
            CancellationToken cancellationToken) =>
        {
            var mappings = await service.GetFolderMappingsAsync(cancellationToken);
            return TypedResults.Ok(mappings);
        });

        group.MapGet("/folder-options", async Task<Ok<List<string>>> (
            FolderMappingService service,
            CancellationToken cancellationToken) =>
        {
            var folders = await service.GetFolderOptionsAsync(cancellationToken);
            return TypedResults.Ok(folders);
        });

        group.MapPost("/", async Task<Created<FolderMappingRecord>> (
            FolderMappingCreateRequest request,
            FolderMappingService service,
            CancellationToken cancellationToken) =>
        {
            var created = await service.CreateAsync(request, cancellationToken);
            return TypedResults.Created($"/api/v1/folder-mappings/{created.Id}", created);
        });

        group.MapPut("/{id:int}", async Task<Results<Ok<FolderMappingRecord>, NotFound>> (
            int id,
            FolderMappingUpdateRequest request,
            FolderMappingService service,
            CancellationToken cancellationToken) =>
        {
            var updated = await service.UpdateAsync(id, request, cancellationToken);
            return updated is null ? TypedResults.NotFound() : TypedResults.Ok(updated);
        });

        group.MapDelete("/{id:int}", async Task<Results<NoContent, NotFound>> (
            int id,
            FolderMappingService service,
            CancellationToken cancellationToken) =>
        {
            var deleted = await service.DeleteAsync(id, cancellationToken);
            return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
        });
    }
}
