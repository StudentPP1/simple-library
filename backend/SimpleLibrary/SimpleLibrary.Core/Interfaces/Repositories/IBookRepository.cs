using SimpleLibrary.Core.Models;

namespace SimpleLibrary.Core.Interfaces.Repositories
{
    public interface IBookRepository
    {
        Task AddAsync(Book book);
        Task<Book?> GetByIdAsync(Guid id);
        Task<(IEnumerable<(Book Book, int AvailableCopiesCount)> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize);
    }
}
