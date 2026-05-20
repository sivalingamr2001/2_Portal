namespace Web.Common.Exceptions;

/// <summary>Base for all domain/application exceptions. Carries HTTP status code for middleware mapping.</summary>
public class AppException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }

    protected AppException(string message, int statusCode, string errorCode)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}

public sealed class NotFoundException(string entityName, object key) : AppException($"{entityName} with key '{key}' was not found.", 404, "NOT_FOUND")
{
}

public sealed class ConflictException(string message) : AppException(message, 409, "CONFLICT")
{
}

public sealed class ForbiddenException(string message = "Access denied.") : AppException(message, 403, "FORBIDDEN")
{
}

public sealed class ValidationException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation errors occurred.", 422, "VALIDATION_ERROR")
    {
        Errors = errors;
    }
}
