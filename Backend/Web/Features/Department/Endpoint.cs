using Carter;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Web.Features.Department;

public sealed class DepartmentEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/departments")
            .WithTags("Departments")
            .WithOpenApi();

        group.MapGet("/", async Task<IResult>(
            DepartmentService service,
            CancellationToken cancellationToken) =>
        {
            var departments = await service.GetDepartmentsAsync(cancellationToken);
            return TypedResults.Ok(departments);
        });

        group.MapGet("/{deptId:int}", async Task<IResult>(
            int deptId,
            DepartmentService service,
            CancellationToken cancellationToken) =>
        {
            var department = await service.GetDepartmentByIdAsync(deptId, cancellationToken);
            return department is null
                ? TypedResults.NotFound()
                : TypedResults.Ok(department);
        });

        group.MapPost("/", async Task<IResult>(
            DepartmentCreateRequest request,
            DepartmentService service,
            CancellationToken cancellationToken) =>
        {
            var created = await service.CreateDepartmentAsync(request, cancellationToken);
            return TypedResults.Created($"/api/v1/departments/{created.DeptId}", created);
        });

        group.MapPut("/{deptId:int}", async Task<IResult>(
            int deptId,
            DepartmentUpdateRequest request,
            DepartmentService service,
            CancellationToken cancellationToken) =>
        {
            var updated = await service.UpdateDepartmentAsync(deptId, request, cancellationToken);
            return TypedResults.Ok(updated);
        });

        group.MapDelete("/{deptId:int}", async Task<IResult>(
            int deptId,
            DepartmentService service,
            CancellationToken cancellationToken) =>
        {
            var deleted = await service.DeleteDepartmentAsync(deptId, cancellationToken);
            return deleted
                ? TypedResults.NoContent()
                : TypedResults.NotFound();
        });
    }
}
