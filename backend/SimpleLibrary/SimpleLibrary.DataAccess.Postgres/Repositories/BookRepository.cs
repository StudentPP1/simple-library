using Microsoft.EntityFrameworkCore;
using SimpleLibrary.Core.Enums;
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

        public async Task<Book?> GetByIdAsync(Guid id)
        {
            return await _context.Books
                .Include(b => b.Copies)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<(IEnumerable<(Book Book, int AvailableCopiesCount)> Items, int TotalCount)> GetPagedAsync(
            int pageNumber, int pageSize, string? searchTerm, string? genre)
        {
            var query = _context.Books.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                string searchLower = searchTerm.ToLower();
                query = query.Where(b => b.Title.ToLower().Contains(searchLower) ||
                                         b.Author.ToLower().Contains(searchLower));
            }

            if (!string.IsNullOrWhiteSpace(genre))
            {
                query = query.Where(b => b.Genre.ToLower() == genre.ToLower());
            }

            int totalCount = await query.CountAsync();

            var rows = await query
                .OrderBy(b => b.Title)
                .ThenBy(b => b.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new
                {
                    Book = b,
                    AvailableCopiesCount = b.Copies.Count(c => c.Status == CopyStatus.Available)
                })
                .ToListAsync();

            var items = rows.Select(r => (r.Book, r.AvailableCopiesCount)).ToList();

            return (items, totalCount);
        }

        public void Delete(Book book)
        {
            _context.Books.Remove(book);
        }
    }
}
