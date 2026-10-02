using Microsoft.AspNetCore.Mvc;
using SimpleLibrary.Core;
using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.DTOs.Responses;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Services;

namespace SimpleLibrary.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var response = await _authService.RegisterAsync(request);

            if (!response.Success)
            {
                return MapErrorToHttpResponse(response);
            }

            var responseData = new UserResponse
            {
                Id = response.Data!.Id,
                FullName = response.Data.FullName,
                Email = response.Data.Email,
                Role = response.Data.Role.ToString()
            };

            return Ok(new ApiResponse<UserResponse>(true, response.Message, responseData));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var response = await _authService.AuthenticateAsync(request);

            if (!response.Success)
            {
                return MapErrorToHttpResponse(response);
            }

            return Ok(new ApiResponse<string>(true, response.Message, response.Data));
        }

        private IActionResult MapErrorToHttpResponse<T>(ServiceResponse<T> response)
        {
            var apiResponse = new ApiResponse<T>(false, response.Message, default);

            return response.Error switch
            {
                ErrorType.Conflict => Conflict(apiResponse),           // HTTP 409
                ErrorType.NotFound => NotFound(apiResponse),           // HTTP 404
                ErrorType.Unauthorized => Unauthorized(apiResponse),   // HTTP 401
                ErrorType.Validation => BadRequest(apiResponse),       // HTTP 400
                _ => StatusCode(500, apiResponse)                      // HTTP 500
            };
        }
    }
}
