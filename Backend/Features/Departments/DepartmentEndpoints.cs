using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Web.Features.Departments.Commands;
using Web.Features.Departments.Queries;
using Web.Shared.Pagination;

namespace Web.Features.Departments;

public sealed class DepartmentEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/departments")
            .WithTags("Departments")
            .WithOpenApi();

        group.MapGet("/", async ([AsParameters] PaginationParams pagination, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetDepartmentsListQuery(pagination), ct);
            return Results.Ok(result);
        })
        .WithName("GetDepartments")
        .WithSummary("Get paginated list of departments");

        group.MapGet("/{id:int}", async (int id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetDepartmentByIdQuery(id), ct);
            return Results.Ok(result);
        })
        .WithName("GetDepartmentById");

        group.MapPost("/", async (CreateDepartmentCommand cmd, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(cmd, ct);
            return Results.Created($"/api/v1/departments/{result.Data?.Id}", result);
        })
        .WithName("CreateDepartment");

        group.MapDelete("/{id:int}", async (int id, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new DeleteDepartmentCommand(id, "system"), ct);
            return Results.Ok(result);
        })
        .WithName("DeleteDepartment");
    }
}