using System.Text.Json;
using Web.Common.Exceptions;
using Web.Shared.Responses;

namespace Web.Common.Middlewares;

/// <summary>
/// Global exception handler — converts all unhandled exceptions to ProblemDetails-compatible JSON.
/// Never leaks stack traces in production. Correlation ID ties log entry to response.
/// </summary>
public sealed class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var correlationId = context.Items["CorrelationId"]?.ToString();
            _logger.LogError(ex, "Unhandled exception. CorrelationId: {CorrelationId}", correlationId);
            await HandleExceptionAsync(context, ex, correlationId);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception, string? correlationId)
    {
        context.Response.ContentType = "application/json";

        (int statusCode, string message, IDictionary<string, string[]>? validationErrors) = exception switch
        {
            ValidationException ve => (422, ve.Message, ve.Errors),
            NotFoundException nfe => (404, nfe.Message, null),
            ConflictException ce => (409, ce.Message, null),
            ForbiddenException fe => (403, fe.Message, null),
            AppException ae => (ae.StatusCode, ae.Message, null),
            OperationCanceledException => (499, "Request was cancelled.", null),
            _ => (500, _env.IsProduction()
                ? "An internal server error occurred."
                : exception.Message, null)
        };

        context.Response.StatusCode = statusCode;

        ApiResponse<object> response = validationErrors is not null
            ? ApiResponse<object>.ValidationFail(validationErrors, correlationId)
            : ApiResponse<object>.Fail(message, statusCode, correlationId: correlationId);

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
