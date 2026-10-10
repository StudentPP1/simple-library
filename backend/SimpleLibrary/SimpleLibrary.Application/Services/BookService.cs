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
        private const int MinPageSize = 1;
        private const int MaxPageSize = 100;

        private readonly IUnitOfWork _unitOfWork;

        public BookService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ServiceResponse<BookResponse>> AddBookAsync(CreateBookRequest request)
        {
            if (request.PublicationYear < 1 || request.PublicationYear > DateTime.UtcNow.Year)
            {
                return ServiceResponse<BookResponse>.Fail($"Рік видання має бути до {DateTime.UtcNow.Year}", ErrorType.Validation);
            }

            var book = new Book(request.Title, request.Author, request.Genre, request.ISBN, request.PublicationYear);

            for (int i = 0; i < request.CopiesCount; i++)
            {
                string invNumber = $"INV-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
                var copy = new BookCopy(book.Id, invNumber);

                book.AddCopy(copy);
            }

            await _unitOfWork.BookRepository.AddAsync(book);
            await _unitOfWork.SaveChangesAsync();

            var responseDto = MapToResponse(book, book.Copies.Count(c => c.Status == CopyStatus.Available));
            return ServiceResponse<BookResponse>.Ok(responseDto, "Книга та примірники успішно додані.");
        }

        public async Task<ServiceResponse<BookResponse>> GetBookByIdAsync(Guid id)
        {
            var book = await _unitOfWork.BookRepository.GetByIdAsync(id);

            if (book == null)
            {
                return ServiceResponse<BookResponse>.Fail("Книгу не знайдено.", ErrorType.NotFound);
            }

            int availableCopies = book.Copies.Count(c => c.Status == CopyStatus.Available);
            var responseDto = MapToResponse(book, availableCopies);

            return ServiceResponse<BookResponse>.Ok(responseDto);
        }

        public async Task<ServiceResponse<PagedResponse<BookResponse>>> GetCatalogAsync(int pageNumber, int pageSize, string? searchTerm, string? genre)
        {
            if (pageSize < MinPageSize || pageSize > MaxPageSize)
            {
                return ServiceResponse<PagedResponse<BookResponse>>.Fail(
                    $"Розмір сторінки має бути від {MinPageSize} до {MaxPageSize}.", ErrorType.Validation);
            }

            if (pageNumber < 1)
            {
                return ServiceResponse<PagedResponse<BookResponse>>.Fail(
                    "Номер сторінки має бути не меншим за 1.", ErrorType.Validation);
            }

            var (items, totalCount) = await _unitOfWork.BookRepository.GetPagedAsync(pageNumber, pageSize, searchTerm, genre);

            var responseItems = items
                .Select(item => MapToResponse(item.Book, item.AvailableCopiesCount))
                .ToList();

            var pagedResponse = new PagedResponse<BookResponse>
            {
                Items = responseItems,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            return ServiceResponse<PagedResponse<BookResponse>>.Ok(pagedResponse);
        }

        public async Task<ServiceResponse<BookResponse>> UpdateBookAsync(Guid id, UpdateBookRequest request)
        {
            if (request.PublicationYear < 1 || request.PublicationYear > DateTime.UtcNow.Year)
            {
                return ServiceResponse<BookResponse>.Fail($"Рік видання має бути до {DateTime.UtcNow.Year}", ErrorType.Validation);
            }

            var book = await _unitOfWork.BookRepository.GetByIdAsync(id);
            if (book == null)
            {
                return ServiceResponse<BookResponse>.Fail("Книгу не знайдено.", ErrorType.NotFound);
            }

            book.UpdateInfo(request.Title, request.Author, request.Genre, request.ISBN, request.PublicationYear);

            await _unitOfWork.SaveChangesAsync();

            int availableCopies = book.Copies.Count(c => c.Status == CopyStatus.Available);
            return ServiceResponse<BookResponse>.Ok(MapToResponse(book, availableCopies), "Книгу успішно оновлено.");
        }

        public async Task<ServiceResponse<bool>> DeleteBookAsync(Guid id)
        {
            var book = await _unitOfWork.BookRepository.GetByIdAsync(id);
            if (book == null)
            {
                return ServiceResponse<bool>.Fail("Книгу не знайдено.", ErrorType.NotFound);
            }

            if (book.Copies.Any(c => c.Status == CopyStatus.IssuedOut))
            {
                return ServiceResponse<bool>.Fail("Не можна видалити книгу, оскільки її примірники зараз знаходяться у читачів.", ErrorType.Conflict);
            }

            _unitOfWork.BookRepository.Delete(book);
            await _unitOfWork.SaveChangesAsync();

            return ServiceResponse<bool>.Ok(true, "Книгу та всі її вільні примірники успішно видалено.");
        }

        private static BookResponse MapToResponse(Book book, int availableCopiesCount)
        {
            return new BookResponse
            {
                Id = book.Id,
                Title = book.Title,
                Author = book.Author,
                Genre = book.Genre,
                ISBN = book.ISBN,
                PublicationYear = book.PublicationYear,
                AvailableCopiesCount = availableCopiesCount
            };
        }
    }
}
