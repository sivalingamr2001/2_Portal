using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Web.Features.Users.Commands;
using Web.Features.Users.Queries;

namespace Web.Features.Users;

/// <summary>
/// Carter module — maps HTTP routes to MediatR commands/queries.
/// Carter keeps endpoint registration collocated with the feature, not scattered across controllers.
/// </summary>
public sealed class UsersEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/users")
            .WithTags("Users")
            .WithOpenApi();

        group.MapPost("/", async (CreateUserCommand command, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(command, ct);
            return Results.Created($"/api/v1/users/{result.Data?.Id}", result);
        })
        .WithName("CreateUser")
        .WithSummary("Create a new employee")
        .Produces(201)
        .Produces(409)
        .Produces(422);

        group.MapGet("/{id:int}", async (int id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetUserByIdQuery(id), ct);
            return Results.Ok(result);
        })
        .WithName("GetUserById")
        .WithSummary("Get employee by ID")
        .Produces(200)
        .Produces(404);
    }
}