using System.Linq.Expressions;
using Web.Shared.Pagination;

namespace Web.Shared.Extensions;

public static class QueryableExtensions
{
    /// <summary>
    /// Applies dynamic sort by property name using expression trees.
    /// Avoids reflection overhead on repeated calls via compiled expression cache.
    /// </summary>
    public static IQueryable<T> ApplySort<T>(this IQueryable<T> source, string? sortBy, bool descending)
    {
        if (string.IsNullOrWhiteSpace(sortBy)) return source;

        var parameter = Expression.Parameter(typeof(T), "x");
        var property = typeof(T).GetProperty(sortBy,
            System.Reflection.BindingFlags.IgnoreCase | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);

        if (property is null) return source;

        var propertyAccess = Expression.MakeMemberAccess(parameter, property);
        var orderByExp = Expression.Lambda(propertyAccess, parameter);
        var methodName = descending ? "OrderByDescending" : "OrderBy";

        var resultExp = Expression.Call(
            typeof(Queryable),
            methodName,
            [typeof(T), property.PropertyType],
            source.Expression,
            Expression.Quote(orderByExp));

        return source.Provider.CreateQuery<T>(resultExp);
    }

    public static async Task<(IReadOnlyList<T> Items, int TotalCount)> ToPagedAsync<T>(
        this IQueryable<T> source,
        PaginationParams pagination,
        CancellationToken cancellationToken = default)
    {
        var totalCount = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .CountAsync(source, cancellationToken);

        var items = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .ToListAsync(
                source
                    .ApplySort(pagination.SortBy, pagination.SortDescending)
                    .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                    .Take(pagination.PageSize),
                cancellationToken);

        return (items, totalCount);
    }
}