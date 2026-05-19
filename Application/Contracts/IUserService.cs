using Application.DTOs.Request;
using Application.DTOs.Response;

namespace Application.Contracts;

public interface IUserService
{
    Task<UserResponseDto> LoginAsync(LoginRequestDto loginRequest, CancellationToken cancellationToken);
    Task<UserResponseDto?> GetByIdAsync(int userId, CancellationToken cancellationToken);
    Task<IEnumerable<UserResponseDto>> GetAllEmployeesAsync(CancellationToken cancellationToken);
}
