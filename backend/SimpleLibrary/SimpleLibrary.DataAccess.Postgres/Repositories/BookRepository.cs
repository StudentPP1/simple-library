using Microsoft.EntityFrameworkCore;
using SimpleLibrary.Core.Interfaces.Repositories;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.DataAccess.Postgres.Repositories
{
    public class BookRepository : IBookRepository
    {
        private readonly LibraryDbContext _context;

        public BookRepository(LibraryDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Book book)
        {
            await _context.Books.AddAsync(book);
        }

        public async Task<(IEnumerable<Book> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize)
        {
            var query = _context.Books.Include(b => b.Copies).AsNoTracking();

            int totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(b => b.Title)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
    }
}
