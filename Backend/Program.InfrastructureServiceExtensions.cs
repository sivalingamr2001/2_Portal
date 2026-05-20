using Microsoft.EntityFrameworkCore;
using Web.Infrastructure.Caching;
using Web.Infrastructure.Persistence;
using Web.Infrastructure.Repositories;

namespace Web;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // EF Core — MySQL
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseMySql(
                configuration.GetConnectionString("DefaultConnection"),
                ServerVersion.AutoDetect(configuration.GetConnectionString("DefaultConnection")),
                mysqlOptions =>
                {
                    mysqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null);
                    mysqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                });

            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTrackingWithIdentityResolution);
        });

        // Dapper — separate connection, no ORM overhead
        services.AddSingleton<IDapperRepository>(sp =>
            new DapperRepository(
                configuration.GetConnectionString("DefaultConnection")!,
                sp.GetRequiredService<ILogger<DapperRepository>>()));

        // Repositories & UoW
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Caching
        services.AddMemoryCache();
        services.AddSingleton<ICacheService, MemoryCacheService>();

        // Current user (replace with real IHttpContextAccessor-backed impl)
        services.AddScoped<ICurrentUserService, HttpContextCurrentUserService>();

        return services;
    }
}
