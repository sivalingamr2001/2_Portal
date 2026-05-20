using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Web.Features.Auth.Login;
using Web.Features.Auth.Me;
using Web.Features.Department;
using Web.Features.Hod;
using Web.Infrastructure.Persistence;
using Web.Infrastructure.Repositories;
using Web.Shared.Helpers;

namespace Web;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. Core Framework Infrastructure Requirements
        services.AddHttpContextAccessor();

        // 2. Register the centralized user context abstraction
        services.AddScoped<ICurrentUserService, HttpContextCurrentUserService>();

        // 3. Register your custom connection helper service class
        services.AddSingleton<ConnectionStrings>();

        // 4. Extract connection settings safely WITHOUT breaking the DI container graph
        // This targets the exact JSON object coordinate path you configured
        var connectionString = configuration["Database:MySqlConnectionString"];
        var databaseProvider = configuration["Database:Provider"]?.Trim().ToLowerInvariant();

        // Fallback safety to check alternate configuration properties if main string is blank
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = configuration["Database:SqliteConnectionString"];
        }

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (databaseProvider == "sqlite" || (!string.IsNullOrWhiteSpace(connectionString) && connectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase)))
            {
                options.UseSqlite(configuration["Database:SqliteConnectionString"] ?? connectionString);
            }
            else
            {
                throw new InvalidOperationException($"The database provider '{databaseProvider}' is not supported or implemented in this architecture framework.");
            }

            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTrackingWithIdentityResolution);
        });

        // 5. Injected with the strongly-typed ConnectionStrings helper class instance
        services.AddSingleton<IDapperRepository>(sp =>
            new DapperRepository(
                sp.GetRequiredService<ConnectionStrings>(),
                sp.GetRequiredService<ILogger<DapperRepository>>()));

        // 6. Generic Repository and Unit Of Work bindings
        services.AddScoped(typeof(IEFRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // 7. Caching and Business Application Layers
        services.AddMemoryCache();
        services.AddScoped<LoginService>();
        services.AddScoped<DepartmentService>();
        services.AddScoped<HodService>();
        services.AddScoped<UserService>();

        return services;
    }

    /// <summary>
    /// Database-agnostic initialization. Automatically generates schema tables 
    /// if they don't exist, using generic EF Core abstraction layers.
    /// </summary>
    public static async Task<WebApplication> UseDatabaseInitializationAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
        var configuration = services.GetRequiredService<IConfiguration>();
        var logger = services.GetRequiredService<ILogger<ApplicationDbContext>>();

        var autoMigrate = configuration.GetValue<bool>("Database:AutoMigrateOnStartup");
        var recreateDb = configuration.GetValue<bool>("Database:MySqlRecreateOnStartup");

        if (autoMigrate)
        {
            try
            {
                var context = services.GetRequiredService<ApplicationDbContext>();

                if (recreateDb)
                {
                    logger.LogWarning("RecreateOnStartup flag is active. Purging old database schema matching connection configurations...");
                    await context.Database.EnsureDeletedAsync();
                }

                logger.LogInformation("Verifying database schema availability...");

                // Automatically builds tables out based on your application mapping layouts
                await context.Database.EnsureCreatedAsync();

                logger.LogInformation("Database system schema initialization completed successfully.");
            }
            catch (Exception ex)
            {
                logger.LogCritical(ex, "An error occurred while executing generic database schema initialization.");
                throw;
            }
        }

        return app;
    }
}
