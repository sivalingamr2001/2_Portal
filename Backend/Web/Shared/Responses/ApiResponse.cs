using System.Text.Json.Serialization;

namespace Web.Shared.Responses;

/// <summary>
/// Uniform envelope for all API responses.
/// Every endpoint returns this — clients never need to guess the shape.
/// </summary>
public sealed class ApiResponse<T>
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string Message { get; init; } = string.Empty;
    public T? Data { get; init; }
    public string? CorrelationId { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<string>? Errors { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    public static ApiResponse<T> Ok(T data, string message = "Success", string? correlationId = null)
        => new() { Success = true, StatusCode = 200, Message = message, Data = data, CorrelationId = correlationId };

    public static ApiResponse<T> Created(T data, string message = "Created", string? correlationId = null)
        => new() { Success = true, StatusCode = 201, Message = message, Data = data, CorrelationId = correlationId };

    public static ApiResponse<T> Fail(string message, int statusCode = 400, IReadOnlyList<string>? errors = null, string? correlationId = null)
        => new() { Success = false, StatusCode = statusCode, Message = message, Errors = errors, CorrelationId = correlationId };

    public static ApiResponse<T> ValidationFail(IDictionary<string, string[]> validationErrors, string? correlationId = null)
        => new() { Success = false, StatusCode = 422, Message = "Validation failed.", ValidationErrors = validationErrors, CorrelationId = correlationId };
}