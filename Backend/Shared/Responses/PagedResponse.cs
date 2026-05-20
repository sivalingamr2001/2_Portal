namespace Web.Shared.Responses;

/// <summary>
/// Paged response with navigation metadata.
/// TotalPages and HasNext/HasPrevious are computed — clients can build pagination UI directly.
/// </summary>
public sealed class PagedResponse<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int PageNumber { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
    public bool Success => true;
    public string? CorrelationId { get; init; }

    public static PagedResponse<T> Create(IReadOnlyList<T> items, int totalCount, int pageNumber, int pageSize, string? correlationId = null)
        => new()
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            CorrelationId = correlationId
        };
}