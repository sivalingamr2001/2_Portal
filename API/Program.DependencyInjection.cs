using Application.Contracts;
using Application.Implementation;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Infrastructure.Repository;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql;

namespace API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services, IConfiguration configuration)
        {
            var dbProvider = configuration["Database:Provider"] ?? "Sqlite";
            var mySqlConnectionString = configuration.GetConnectionString("MySqlConnectionString");
            var sqliteConnectionString = configuration.GetConnectionString("SqliteConnectionString");

            services.AddDbContext<AppDbContext>(options =>
            {
                var isMySql = string.Equals(dbProvider, "MySql", StringComparison.OrdinalIgnoreCase);
                var serverVersion = ServerVersion.Parse("8.0.0-mysql");

                if (isMySql)
                {
                    options.UseMySql(
                        mySqlConnectionString,
                        serverVersion);

                    return;
                }

                options.UseSqlite(sqliteConnectionString);
            });

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
