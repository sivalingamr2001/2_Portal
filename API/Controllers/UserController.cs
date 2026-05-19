using Application.Contracts;
using Application.DTOs.Request;
using Application.DTOs.Response;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    /// <summary>
    /// Example User Controller.
    /// Handles authentication and user management endpoints.
    /// </summary>
    [Route("api/auth")]
    [ApiController]
    public class UserController(IUserService userService) : ControllerBase
    {
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellation)
        {
            try
            {
                var response = await userService.LoginAsync(request, cancellation);
                return Ok(new ApiResponseDto<UserResponseDto>(true, "Login successful", response));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ErrorResponseDto("Unauthorized", ex.Message));
            }
        }

        [HttpGet("users/{userId:int}")]
        public async Task<IActionResult> GetById(int userId, CancellationToken cancellation)
        {
            var response = await userService.GetByIdAsync(userId, cancellation);
            if (response == null)
            {
                return NotFound(new ErrorResponseDto("NotFound", $"User with ID {userId} was not found."));
            }

            return Ok(new ApiResponseDto<UserResponseDto>(true, "User retrieved successfully", response));
        }

        [HttpGet("all-users")]
        public async Task<IActionResult> GetAllEmployeesAsync(CancellationToken cancellationToken)
        {
            var response = await userService.GetAllEmployeesAsync(cancellationToken);

            if (response == null || !response.Any())
            {
                return NotFound(new ErrorResponseDto("NotFound", "Users not found or error during retrieval"));
            }

            return Ok(new ApiResponseDto<IEnumerable<UserResponseDto>>(true, "Users retrieved successfully", response));
        }
    }
}
