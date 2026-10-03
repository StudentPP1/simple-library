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

        public BooksController(IBookService bookService)
        {
            _bookService = bookService;
        }

        /// <summary>
        /// Перегляд електронного каталогу книг із пагінацією.
        /// Доступно всім користувачам.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCatalog([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var response = await _bookService.GetCatalogAsync(pageNumber, pageSize);

            if (!response.Success)
            {
                return MapErrorToHttpResponse(response);
            }

            return Ok(new ApiResponse<PagedResponse<BookResponse>>(true, response.Message, response.Data));
        }

        /// <summary>
        /// Додавання нової книги та генерація примірників.
        /// Доступно ТІЛЬКИ Бібліотекарю (FR-9).
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Librarian")]
        public async Task<IActionResult> AddBook([FromBody] CreateBookRequest request)
        {
            var response = await _bookService.AddBookAsync(request);

            if (!response.Success)
            {
                return MapErrorToHttpResponse(response);
            }

            return StatusCode(201, new ApiResponse<BookResponse>(true, response.Message, response.Data));
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
