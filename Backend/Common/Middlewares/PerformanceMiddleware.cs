using System.Diagnostics;

namespace Web.Common.Middlewares;

/// <summary>Measures total HTTP request time and logs slow requests at warning level.</summary>
public sealed class PerformanceMiddleware
{
    private const int SlowRequestThresholdMs = 1000;
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceMiddleware> _logger;

    public PerformanceMiddleware(RequestDelegate next, ILogger<PerformanceMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        await _next(context);
        sw.Stop();

        var elapsed = sw.ElapsedMilliseconds;

        if (elapsed > SlowRequestThresholdMs)
        {
            _logger.LogWarning(
                "SLOW_HTTP: {Method} {Path} responded {StatusCode} in {Elapsed}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                elapsed);
        }
        else
        {
            _logger.LogInformation(
                "{Method} {Path} → {StatusCode} in {Elapsed}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                elapsed);
        }
    }
}
