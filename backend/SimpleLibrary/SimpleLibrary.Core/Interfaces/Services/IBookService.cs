using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.DTOs.Responses;
using SimpleLibrary.Core.Shared;

namespace SimpleLibrary.Core.Interfaces.Services
{
    public interface IBookService
    {
        Task<ServiceResponse<BookResponse>> AddBookAsync(CreateBookRequest request);
        Task<ServiceResponse<BookResponse>> GetBookByIdAsync(Guid id);
        Task<ServiceResponse<PagedResponse<BookResponse>>> GetCatalogAsync(int pageNumber, int pageSize, string? searchTerm, string? genre);
        Task<ServiceResponse<BookResponse>> UpdateBookAsync(Guid id, UpdateBookRequest request);
        Task<ServiceResponse<bool>> DeleteBookAsync(Guid id);
    }
}
