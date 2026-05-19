namespace Application.DTOs.Response;

/// <summary>
/// Example generic API response DTO.
/// </summary>
public record ApiResponseDto<T>(
    bool Success,
    string Message,
    T Data
);

/// <summary>
/// Example error response DTO.
/// </summary>
public record ErrorResponseDto(
    string Code,
    string Message
);
