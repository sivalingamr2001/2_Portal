using Carter;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Web.Features.AdminUsers;

public sealed class AdminUserEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/users")
            .WithTags("Admin Users")
            .WithOpenApi();

        group.MapGet("/", async Task<Ok<List<AdminUserRecord>>> (
            string? search,
            string? role,
            AdminUserService service,
            CancellationToken cancellationToken) =>
        {
            var users = await service.GetUsersAsync(search, role, cancellationToken);
            return TypedResults.Ok(users);
        });

        group.MapPost("/", async Task<Created<AdminUserRecord>> (
            AdminUserCreateRequest request,
            AdminUserService service,
            CancellationToken cancellationToken) =>
        {
            var created = await service.CreateUserAsync(request, cancellationToken);
            return TypedResults.Created($"/api/v1/users/{created.UserId}", created);
        });

        group.MapPut("/{userId:int}", async Task<Results<Ok<AdminUserRecord>, NotFound>> (
            int userId,
            AdminUserUpdateRequest request,
            AdminUserService service,
            CancellationToken cancellationToken) =>
        {
            var updated = await service.UpdateUserAsync(userId, request, cancellationToken);
            return updated is null ? TypedResults.NotFound() : TypedResults.Ok(updated);
        });

        group.MapDelete("/{userId:int}", async Task<Results<NoContent, NotFound>> (
            int userId,
            AdminUserService service,
            CancellationToken cancellationToken) =>
        {
            var deleted = await service.DeleteUserAsync(userId, cancellationToken);
            return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
        });
    }
}
