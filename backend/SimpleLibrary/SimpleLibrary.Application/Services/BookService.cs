using SimpleLibrary.Core;
using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.DTOs.Responses;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Services;
using SimpleLibrary.Core.Interfaces.UnitsOfWork;
using SimpleLibrary.Core.Models;
using SimpleLibrary.Core.Shared;

namespace SimpleLibrary.Application.Services
{
    public class BookService : IBookService
    {
        private readonly IUnitOfWork _unitOfWork;

        public BookService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ServiceResponse<BookResponse>> AddBookAsync(CreateBookRequest request)
        {
            var book = new Book(request.Title, request.Author, request.Genre, request.ISBN, request.PublicationYear);

            for (int i = 0; i < request.CopiesCount; i++)
            {
                string invNumber = $"INV-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
                var copy = new BookCopy(book.Id, invNumber);

                book.AddCopy(copy);
            }

            await _unitOfWork.BookRepository.AddAsync(book);
            await _unitOfWork.SaveChangesAsync();

            var responseDto = MapToResponse(book);
            return ServiceResponse<BookResponse>.Ok(responseDto, "Книга та примірники успішно додані.");
        }

        public async Task<ServiceResponse<PagedResponse<BookResponse>>> GetCatalogAsync(int pageNumber, int pageSize)
        {
            var (items, totalCount) = await _unitOfWork.BookRepository.GetPagedAsync(pageNumber, pageSize);

            var responseItems = items.Select(MapToResponse).ToList();

            var pagedResponse = new PagedResponse<BookResponse>
            {
                Items = responseItems,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            return ServiceResponse<PagedResponse<BookResponse>>.Ok(pagedResponse);
        }

        private static BookResponse MapToResponse(Book book)
        {
            return new BookResponse
            {
                Id = book.Id,
                Title = book.Title,
                Author = book.Author,
                Genre = book.Genre,
                ISBN = book.ISBN,
                PublicationYear = book.PublicationYear,
                AvailableCopiesCount = book.Copies.Count(c => c.Status == CopyStatus.Available)
            };
        }
    }
}
