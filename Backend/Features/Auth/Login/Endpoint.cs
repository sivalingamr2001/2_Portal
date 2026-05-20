using Carter;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Web.Features.Auth.Login;

public sealed class LoginEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        // Define the group with base URL route configuration
        var group = app.MapGroup("/api/v1/auth")
            .WithTags("Auth")
            .WithOpenApi();

        // Map the endpoint to the root string of this group
        group.MapPost("/login", async Task<Results<Ok<LoginResponse>, UnauthorizedHttpResult>> (
            LoginRequest request,
            LoginService service,
            CancellationToken cancellationToken) =>
        {
            var response = await service.AuthenticateAsync(request, cancellationToken);
            return response is null
                ? TypedResults.Unauthorized()
                : TypedResults.Ok(response);
        })
        .WithName("Login")
        .WithSummary("Login by user id, email, or employee id");
    }
}
