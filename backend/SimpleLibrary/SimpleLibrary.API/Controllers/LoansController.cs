using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimpleLibrary.Core;
using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.DTOs.Responses;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Services;
using System.Security.Claims;

namespace SimpleLibrary.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LoansController : ControllerBase
    {
        private readonly ILoanService _loanService;
        private readonly ILogger<LoansController> _logger;

        public LoansController(ILoanService loanService, ILogger<LoansController> logger)
        {
            _loanService = loanService;
            _logger = logger;
        }

        /// <summary>
        /// Бронювання книги читачем.
        /// </summary>
        [HttpPost("reserve")]
        public async Task<IActionResult> ReserveBook([FromBody] ReserveBookRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var response = await _loanService.ReserveBookAsync(request.BookId, userId);

                if (!response.Success) return MapErrorToHttpResponse(response);

                return StatusCode(201, new ApiResponse<LoanResponse>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час бронювання книги.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера.", null));
            }
        }

        /// <summary>
        /// Оформлення видачі примірника читачу.
        /// Доступно тільки Бібліотекарю.
        /// </summary>
        [HttpPost("{id:guid}/issue")]
        [Authorize(Roles = "Librarian")]
        public async Task<IActionResult> IssueBook(Guid id, [FromBody] IssueBookRequest request)
        {
            try
            {
                var librarianId = GetCurrentUserId();
                var response = await _loanService.IssueBookAsync(id, librarianId, request.Days);

                if (!response.Success) return MapErrorToHttpResponse(response);

                return Ok(new ApiResponse<LoanResponse>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час видачі книги.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера.", null));
            }
        }

        /// <summary>
        /// Фіксація повернення книги.
        /// Доступно тільки Бібліотекарю.
        /// </summary>
        [HttpPost("{id:guid}/return")]
        [Authorize(Roles = "Librarian")]
        public async Task<IActionResult> ReturnBook(Guid id)
        {
            try
            {
                var librarianId = GetCurrentUserId();
                var response = await _loanService.ReturnBookAsync(id, librarianId);

                if (!response.Success) return MapErrorToHttpResponse(response);

                return Ok(new ApiResponse<LoanResponse>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час повернення книги.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера.", null));
            }
        }

        /// <summary>
        /// Особистий кабінет читача: історія та активні книги.
        /// </summary>
        [HttpGet("my")]
        public async Task<IActionResult> GetMyLoans()
        {
            try
            {
                var userId = GetCurrentUserId();
                var response = await _loanService.GetReaderLoansAsync(userId);

                return Ok(new ApiResponse<IEnumerable<LoanResponse>>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час отримання історії користувача.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера.", null));
            }
        }

        /// <summary>
        /// Список активних видач і боржників.
        /// Доступно тільки Бібліотекарю.
        /// </summary>
        [HttpGet("active")]
        [Authorize(Roles = "Librarian")]
        public async Task<IActionResult> GetActiveLoans()
        {
            try
            {
                var response = await _loanService.GetActiveLoansAsync();
                return Ok(new ApiResponse<IEnumerable<LoanResponse>>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час отримання активних видач.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера.", null));
            }
        }

        /// <summary>
        /// Скасування бронювання (FR-13).
        /// Читач може скасувати свою бронь. Бібліотекар - будь-яку.
        /// </summary>
        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> CancelReservation(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "";

                var response = await _loanService.CancelReservationAsync(id, userId, userRole);

                if (!response.Success) return MapErrorToHttpResponse(response);

                return Ok(new ApiResponse<bool>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час скасування бронювання.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера.", null));
            }
        }

        private Guid GetCurrentUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdStr, out var userId))
                return userId;

            throw new UnauthorizedAccessException("Користувач не авторизований.");
        }

        private IActionResult MapErrorToHttpResponse<T>(ServiceResponse<T> response)
        {
            var apiResponse = new ApiResponse<T>(false, response.Message, default);

            return response.Error switch
            {
                ErrorType.Conflict => Conflict(apiResponse),           // HTTP 409
                ErrorType.NotFound => NotFound(apiResponse),           // HTTP 404
                ErrorType.Unauthorized => Unauthorized(apiResponse),   // HTTP 401
                ErrorType.Forbidden => StatusCode(403, apiResponse),   // HTTP 403
                ErrorType.Validation => BadRequest(apiResponse),       // HTTP 400
                _ => StatusCode(500, apiResponse)                      // HTTP 500
            };
        }
    }
}
