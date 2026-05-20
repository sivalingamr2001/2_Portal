namespace Web.Shared.Pagination;

/// <summary>
/// Standard pagination + sorting parameters.
/// MaxPageSize guards against accidental large result sets (DDoS vector).
/// </summary>
public sealed class PaginationParams
{
    private const int MaxPageSize = 100;
    private int _pageSize = 10;

    public int PageNumber { get; init; } = 1;

    public int PageSize
    {
        get => _pageSize;
        init => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }

    public string? SortBy { get; init; }
    public bool SortDescending { get; init; }
    public string? SearchTerm { get; init; }
}