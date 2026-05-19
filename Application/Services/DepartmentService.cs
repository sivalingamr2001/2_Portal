using Application.Common;
using Application.DTOs.Department;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces.Repositories;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class DepartmentService(
    IDepartmentRepository repo,
    ILogger<DepartmentService> logger
) : IDepartmentService
{
    public async Task<Result<DepartmentResponseDto>> GetByIdAsync(int id, CancellationToken ct)
    {
        var dept = await repo.GetByIdAsync(id, ct);
        return dept is null
            ? Result<DepartmentResponseDto>.NotFound()
            : Result<DepartmentResponseDto>.Success(Map(dept));
    }

    public async Task<Result<List<DepartmentResponseDto>>> GetAllAsync(CancellationToken ct)
    {
        var list = await repo.GetAllAsync(ct);
        return Result<List<DepartmentResponseDto>>.Success(list.Select(Map).ToList());
    }

    public async Task<Result<DepartmentResponseDto>> CreateAsync(CreateDepartmentDto dto, CancellationToken ct)
    {
        var entity = new DepartmentEntity
        {
            DepartmentName = dto.DepartmentName,
            HodId          = dto.HodId
        };

        var created = await repo.AddAsync(entity, ct);
        return Result<DepartmentResponseDto>.Success(Map(created), 201);
    }

    public async Task<Result<DepartmentResponseDto>> UpdateAsync(UpdateDepartmentDto dto, CancellationToken ct)
    {
        var entity = await repo.GetByIdAsync(dto.DepartmentId, ct);
        if (entity is null) return Result<DepartmentResponseDto>.NotFound();

        entity.DepartmentName = dto.DepartmentName;
        entity.HodId          = dto.HodId;

        await repo.UpdateAsync(entity, ct);
        return Result<DepartmentResponseDto>.Success(Map(entity));
    }

    private static DepartmentResponseDto Map(DepartmentEntity d) =>
        new(d.DepartmentId, d.DepartmentName, d.HodId);
}