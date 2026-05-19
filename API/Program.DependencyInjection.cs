using Application.Contracts;
using Application.Services;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Infrastructure.Repository;
using Microsoft.EntityFrameworkCore;

namespace API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services, IConfiguration configuration)
        {
            var mysqlConnectionString = configuration.GetConnectionString("MySqlConnectionString");
            var fallbackConnectionString = configuration.GetConnectionString("DatabaseConnection");
            var connectionString = mysqlConnectionString ?? fallbackConnectionString;
            var dbProvider = configuration.GetSection("Database:Provider").Value ?? "Sqlite";

            services.AddDbContext<AppDbContext>(options =>
            {
                if (dbProvider.Equals("MySql", StringComparison.OrdinalIgnoreCase))
                {
                    if (string.IsNullOrWhiteSpace(connectionString))
                    {
                        throw new InvalidOperationException("MySqlConnectionString or DatabaseConnection must be configured when using the MySql provider.");
                    }

                    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
                }
                else
                {
                    if (string.IsNullOrWhiteSpace(connectionString))
                    {
                        throw new InvalidOperationException("DatabaseConnection must be configured when using the SQLite provider.");
                    }

                    options.UseSqlite(connectionString);
                }
            });

            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            return services;
        }

        public static IServiceCollection AddApplication(
            this IServiceCollection services)
        {
            services.AddScoped<IUserService, UserService>();

            return services;
        }
    }
}

