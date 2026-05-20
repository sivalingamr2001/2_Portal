using Carter;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Web.Features.Auth.Me;

public sealed class MeEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        // Define the group with base URL route configuration
        var group = app.MapGroup("/api/v1/auth")
            .WithTags("Auth")
            .WithOpenApi();

        // Map the endpoint to the root string of this group
        group.MapPost("/me", async Task<Results<Ok<UserResponse>, UnauthorizedHttpResult>> (int userId, UserService service, CancellationToken cancellationToken) =>
        {
            var response = await service.GetCurrentUserAsync(userId, cancellationToken);
            return response is null
                ? TypedResults.Unauthorized()
                : TypedResults.Ok(response);
        })
        .WithName("Me")
        .WithSummary("Get current user information");
    }
}
