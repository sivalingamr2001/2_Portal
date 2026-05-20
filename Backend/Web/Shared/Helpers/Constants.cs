namespace Shared.Helpers;

public static class Constants
{
    public const string CmplUserCacheKey = "CmplUser_{0}";
    public const string HodCacheKey = "Hod_{0}";
    public const string DepartmentCacheKey = "Department_{0}";
    public const string DepartmentsCacheKey = "Departments";
    public const string UserRoleCacheKey = "UserRole_{0}";      

    public static bool IsSqlite(IConfiguration configuration)
    {
        return configuration["Database:Provider"]
            ?.Trim()
            .ToLowerInvariant() == "sqlite";
    }
}