using SimpleLibrary.Core.Models;

namespace SimpleLibrary.Core.Interfaces.Repositories
{
    public interface IBookRepository
    {
        Task<Book?> GetByIdAsync(Guid id);
        Task<BookCopy?> GetAvailableCopyAsync(Guid bookId);
        Task<(IEnumerable<(Book Book, int AvailableCopiesCount)> Items, int TotalCount)> GetPagedAsync(
            int pageNumber, int pageSize, string? searchTerm, string? genre);
        Task AddAsync(Book book);
        void Delete(Book book);
    }
}
