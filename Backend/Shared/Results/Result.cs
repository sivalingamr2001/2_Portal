namespace Web.Shared.Results;

/// <summary>
/// Discriminated union for operation results.
/// Eliminates exception-driven control flow for expected failures.
/// Callers inspect IsSuccess before accessing Value or Error — no null surprises.
/// </summary>
public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public T? Value { get; }
    public string Error { get; }
    public string ErrorCode { get; }

    private Result(T value)
    {
        IsSuccess = true;
        Value = value;
        Error = string.Empty;
        ErrorCode = string.Empty;
    }

    private Result(string error, string errorCode)
    {
        IsSuccess = false;
        Error = error;
        ErrorCode = errorCode;
    }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error, string errorCode = "GENERAL_ERROR") => new(error, errorCode);

    public Result<TOut> Map<TOut>(Func<T, TOut> mapper)
        => IsSuccess ? Result<TOut>.Success(mapper(Value!)) : Result<TOut>.Failure(Error, ErrorCode);

    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<string, TOut> onFailure)
        => IsSuccess ? onSuccess(Value!) : onFailure(Error);
}

public sealed class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string Error { get; }
    public string ErrorCode { get; }

    private Result(bool success, string error, string errorCode)
    {
        IsSuccess = success;
        Error = error;
        ErrorCode = errorCode;
    }

    public static Result Success() => new(true, string.Empty, string.Empty);
    public static Result Failure(string error, string errorCode = "GENERAL_ERROR") => new(false, error, errorCode);
}