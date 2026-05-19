using Application.Contracts;
using Application.Implementation;
using Application.Interfaces;
using Application.Services;
using Domain.Interfaces.Repositories;
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
            services.AddScoped<IAccessRequestService, AccessRequestService>();
            services.AddScoped<IDepartmentService, DepartmentService>();
            services.AddScoped<IFolderMappingService, FolderMappingService>();
            services.AddScoped<IAuditService, AuditService>();
            services.AddScoped<INotificationService, NotificationService>();

            return services;
        }
    }
}
