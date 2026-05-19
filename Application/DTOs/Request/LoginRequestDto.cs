namespace Application.DTOs.Request;

/// <summary>
/// Example Login Request DTO.
/// </summary>
public sealed record LoginRequestDto(string Identifier, string Password);