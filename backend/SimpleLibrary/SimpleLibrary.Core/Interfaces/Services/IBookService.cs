using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.DTOs.Responses;
using SimpleLibrary.Core.Shared;

namespace SimpleLibrary.Core.Interfaces.Services
{
    public interface IBookService
    {
        Task<ServiceResponse<BookResponse>> AddBookAsync(CreateBookRequest request);
        Task<ServiceResponse<PagedResponse<BookResponse>>> GetCatalogAsync(int pageNumber, int pageSize);
    }
}
