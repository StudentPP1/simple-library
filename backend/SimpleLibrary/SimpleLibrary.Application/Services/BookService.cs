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

            string? normalizedDescription = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

            var book = new Book(request.Title.Trim(), request.Author.Trim(), request.Genre.Trim(), request.ISBN.Trim(), request.PublicationYear, normalizedDescription, request.Price);

            for (int i = 0; i < request.CopiesCount; i++)
            {
                book.AddCopy(CreateCopy(book.Id));
            }

            await _unitOfWork.BookRepository.AddAsync(book);
            await _unitOfWork.SaveChangesAsync();

            var responseDto = MapToResponse(book, BookCopyCounts.From(book.Copies));
            return ServiceResponse<BookResponse>.Ok(responseDto, "Книга та примірники успішно додані.");
        }

        public async Task<ServiceResponse<BookResponse>> GetBookByIdAsync(Guid id)
        {
            var book = await _unitOfWork.BookRepository.GetByIdAsync(id);

            if (book == null)
            {
                return ServiceResponse<BookResponse>.Fail("Книгу не знайдено.", ErrorType.NotFound);
            }

            var responseDto = MapToResponse(book, BookCopyCounts.From(book.Copies));

            return ServiceResponse<BookResponse>.Ok(responseDto);
        }

        public async Task<ServiceResponse<IEnumerable<string>>> GetGenresAsync()
        {
            var genres = await _unitOfWork.BookRepository.GetGenresAsync();
            return ServiceResponse<IEnumerable<string>>.Ok(genres);
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

            searchTerm = searchTerm?.Trim();
            genre = genre?.Trim();

            var (items, totalCount) = await _unitOfWork.BookRepository.GetPagedAsync(pageNumber, pageSize, searchTerm, genre);

            var responseItems = items
                .Select(item => MapToResponse(item.Book, item.Copies))
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

            string? newDescription = request.Description == null
                ? book.Description
                : (string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim());

            book.UpdateInfo(request.Title.Trim(), request.Author.Trim(), request.Genre.Trim(), request.ISBN.Trim(), request.PublicationYear, newDescription, request.Price ?? book.Price);

            if (request.CopiesCount.HasValue)
            {
                var copiesError = await ChangeCopiesCountAsync(book, request.CopiesCount.Value);
                if (copiesError != null)
                {
                    return ServiceResponse<BookResponse>.Fail(copiesError, ErrorType.Conflict);
                }
            }

            await _unitOfWork.SaveChangesAsync();

            return ServiceResponse<BookResponse>.Ok(MapToResponse(book, BookCopyCounts.From(book.Copies)), "Книгу успішно оновлено.");
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

            try
            {
                _unitOfWork.BookRepository.Delete(book);
                await _unitOfWork.SaveChangesAsync();

                return ServiceResponse<bool>.Ok(true, "Книгу та всі її вільні примірники успішно видалено.");
            }
            catch (Exception ex)
            {
                if (ex.InnerException != null && (ex.InnerException.Message.Contains("23503") || ex.InnerException.Message.Contains("23001")))
                {
                    return ServiceResponse<bool>.Fail("Не можна видалити книгу, оскільки вона збережена в історії читань користувачів.", ErrorType.Conflict);
                }
                throw;
            }
        }

        /// <summary>
        /// Доводить кількість примірників у фонді до targetCount (FR-11).
        /// Нові примірники додаються, а зайві вільні списуються (статус Lost), щоб зберегти історію видач.
        /// Повертає текст помилки, якщо вільних примірників для списання не вистачає.
        /// </summary>
        private async Task<string?> ChangeCopiesCountAsync(Book book, int targetCount)
        {
            int difference = targetCount - book.ActiveCopiesCount;

            if (difference < 0)
            {
                var freeCopies = book.Copies.Where(c => c.Status == CopyStatus.Available).ToList();
                if (freeCopies.Count < -difference)
                {
                    return $"Не можна зменшити кількість до {targetCount}: списати можна лише вільні примірники, зараз їх {freeCopies.Count}.";
                }

                foreach (var copy in freeCopies.Take(-difference))
                {
                    copy.ChangeStatus(CopyStatus.Lost);
                }
            }

            for (int i = 0; i < difference; i++)
            {
                var copy = CreateCopy(book.Id);
                book.AddCopy(copy);
                await _unitOfWork.BookRepository.AddCopyAsync(copy);
            }

            return null;
        }

        private static BookCopy CreateCopy(Guid bookId)
        {
            string invNumber = $"INV-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
            return new BookCopy(bookId, invNumber);
        }

        private static BookResponse MapToResponse(Book book, BookCopyCounts copies)
        {
            return new BookResponse
            {
                Id = book.Id,
                Title = book.Title,
                Author = book.Author,
                Genre = book.Genre,
                ISBN = book.ISBN,
                PublicationYear = book.PublicationYear,
                Description = book.Description,
                Price = book.Price,
                AvailableCopiesCount = copies.Available,
                ReservedCopiesCount = copies.Reserved,
                IssuedCopiesCount = copies.IssuedOut,
                Status = copies.Availability.ToString()
            };
        }
    }
}
