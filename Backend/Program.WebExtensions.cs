using Carter;
using Microsoft.AspNetCore.Http.Json;
using Serilog;
using System.Text.Json;
using System.Text.Json.Serialization;
using Web.Common.Middlewares;
using Web.Infrastructure.Persistence;

namespace Web;

public static class WebExtensions
{
    public static IServiceCollection AddWebServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new()
            {
                Title = "Janatics Access Management API",
                Version = "v1",
                Description = "File/Folder Access Request and Approval API"
            });
            c.CustomSchemaIds(t => t.FullName?.Replace("+", "."));
        });

        services.Configure<JsonOptions>(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

        services.AddCarter();

        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCors", policy =>
            {
                policy
                    .WithOrigins(configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>("database");

        services.AddHttpContextAccessor();
        services.AddResponseCompression(opts => opts.EnableForHttps = true);

        return services;
    }

    public static WebApplication UseWebMiddleware(this WebApplication app)
    {
        app.UseMiddleware<CorrelationMiddleware>();
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseMiddleware<PerformanceMiddleware>();

        app.UseSerilogRequestLogging();
        app.UseResponseCompression();
        app.UseCors("DefaultCors");
        app.UseHttpsRedirection();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Janatics API v1"));
        }

        app.MapCarter();
        app.MapHealthChecks("/health");

        return app;
    }
}
