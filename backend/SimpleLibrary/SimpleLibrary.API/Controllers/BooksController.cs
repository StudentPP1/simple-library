using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimpleLibrary.Core;
using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.DTOs.Responses;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Services;
using SimpleLibrary.Core.Shared;

namespace SimpleLibrary.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BooksController : ControllerBase
    {
        private readonly IBookService _bookService;
        private readonly ILogger<BooksController> _logger;

        public BooksController(IBookService bookService, ILogger<BooksController> logger)
        {
            _bookService = bookService;
            _logger = logger;
        }

        /// <summary>
        /// Перегляд електронного каталогу книг із пошуком, фільтрацією та пагінацією.
        /// Доступно всім користувачам.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCatalog([FromQuery] string? search = null, [FromQuery] string? genre = null, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var response = await _bookService.GetCatalogAsync(pageNumber, pageSize, search, genre);
                if (!response.Success) return MapErrorToHttpResponse(response);
                return Ok(new ApiResponse<PagedResponse<BookResponse>>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час отримання каталогу книг.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера. Спробуйте пізніше.", null));
            }
        }

        /// <summary>
        /// Отримання детальної інформації про книгу.
        /// Доступно всім користувачам.
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetBookById(Guid id)
        {
            try
            {
                var response = await _bookService.GetBookByIdAsync(id);
                if (!response.Success) return MapErrorToHttpResponse(response);
                return Ok(new ApiResponse<BookResponse>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час отримання книги за ID.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера. Спробуйте пізніше.", null));
            }
        }

        /// <summary>
        /// Додавання нової книги та генерація примірників.
        /// Доступно тільки Бібліотекарю.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Librarian")]
        public async Task<IActionResult> AddBook([FromBody] CreateBookRequest request)
        {
            try
            {
                var response = await _bookService.AddBookAsync(request);
                if (!response.Success) return MapErrorToHttpResponse(response);
                return StatusCode(201, new ApiResponse<BookResponse>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час додавання книги.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера. Спробуйте пізніше.", null));
            }
        }

        /// <summary>
        /// Редагування інформації про книгу.
        /// Доступно тільки Бібліотекарю.
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Librarian")]
        public async Task<IActionResult> UpdateBook(Guid id, [FromBody] UpdateBookRequest request)
        {
            try
            {
                var response = await _bookService.UpdateBookAsync(id, request);
                if (!response.Success) return MapErrorToHttpResponse(response);
                return Ok(new ApiResponse<BookResponse>(true, response.Message, response.Data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час оновлення книги.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера. Спробуйте пізніше.", null));
            }
        }

        /// <summary>
        /// Видалення книги з каталогу.
        /// Доступно тільки Бібліотекарю.
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Librarian")]
        public async Task<IActionResult> DeleteBook(Guid id)
        {
            try
            {
                var response = await _bookService.DeleteBookAsync(id);
                if (!response.Success) return MapErrorToHttpResponse(response);
                return Ok(new ApiResponse<bool>(true, response.Message, true));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Помилка під час видалення книги.");
                return StatusCode(500, new ApiResponse<object>(false, "Внутрішня помилка сервера. Спробуйте пізніше.", null));
            }
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
