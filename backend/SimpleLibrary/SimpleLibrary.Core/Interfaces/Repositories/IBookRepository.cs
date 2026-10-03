using SimpleLibrary.Core.Models;

namespace SimpleLibrary.Core.Interfaces.Repositories
{
    public interface IBookRepository
    {
        Task AddAsync(Book book);
        Task<(IEnumerable<Book> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize);
    }
}
