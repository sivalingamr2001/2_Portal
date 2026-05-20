using MediatR;
using Web.Common.Exceptions;
using Web.Infrastructure.Repositories;
using Web.Shared.Responses;

namespace Web.Features.AccessRequest.Queries;

public sealed record GetAccessRequestByIdQuery(int Id) : IRequest<ApiResponse<AccessRequestDetailDto>>;

public sealed record AccessRequestDetailDto(
    int Id,
    string RequestNumber,
    string FolderPath,
    string AccessType,
    string Status,
    string Justification,
    string RequesterName,
    string RequesterCode,
    DateTime CreatedAt,
    List<ApprovalSummaryDto> Approvals);

public sealed record ApprovalSummaryDto(
    string Stage,
    string ApproverName,
    bool IsApproved,
    string? Comments,
    DateTime ActionedAt);

public sealed class GetAccessRequestByIdHandler
    : IRequestHandler<GetAccessRequestByIdQuery, ApiResponse<AccessRequestDetailDto>>
{
    private readonly IDapperRepository _dapper;

    public GetAccessRequestByIdHandler(IDapperRepository dapper) => _dapper = dapper;

    public async Task<ApiResponse<AccessRequestDetailDto>> Handle(
        GetAccessRequestByIdQuery request,
        CancellationToken cancellationToken)
    {
        const string requestSql = """
            SELECT r.Id, r.RequestNumber, r.FolderPath, r.AccessType, r.Status,
                   r.Justification, e.FullName AS RequesterName, e.EmployeeCode AS RequesterCode,
                   r.CreatedAt
            FROM Jan_Access_Request r
            INNER JOIN Jan_Emp_Mast_V e ON e.Id = r.RequesterId
            WHERE r.Id = @Id AND r.IsDeleted = 0
            """;

        const string approvalsSql = """
            SELECT a.Stage, e.FullName AS ApproverName, a.IsApproved, a.Comments, a.ActionedAt
            FROM Jan_Access_Approval a
            INNER JOIN Jan_Emp_Mast_V e ON e.Id = a.ApproverId
            WHERE a.AccessRequestId = @Id
            ORDER BY a.ActionedAt
            """;

        var dto = await _dapper.QuerySingleOrDefaultAsync<dynamic>(
            requestSql, new { request.Id }, cancellationToken: cancellationToken);

        if (dto is null)
            throw new NotFoundException("AccessRequest", request.Id);

        var approvals = await _dapper.QueryAsync<ApprovalSummaryDto>(
            approvalsSql, new { request.Id }, cancellationToken: cancellationToken);

        var result = new AccessRequestDetailDto(
            (int)dto.Id,
            (string)dto.RequestNumber,
            (string)dto.FolderPath,
            (string)dto.AccessType,
            (string)dto.Status,
            (string)dto.Justification,
            (string)dto.RequesterName,
            (string)dto.RequesterCode,
            (DateTime)dto.CreatedAt,
            approvals.ToList());

        return ApiResponse<AccessRequestDetailDto>.Ok(result);
    }
}