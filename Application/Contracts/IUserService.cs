using Application.DTOs.Request;
using Application.DTOs.Response;

namespace Application.Contracts
{
    /// <summary>
    /// Example User Service Contract.
    /// Defines operations for user authentication and management.
    /// </summary>
    public interface IUserService
    {
        Task<UserResponseDto> LoginAsync(LoginRequestDto loginRequest, CancellationToken cancellationToken);
        Task<UserResponseDto?> GetByIdAsync(int userId, CancellationToken cancellationToken);
    }
}
