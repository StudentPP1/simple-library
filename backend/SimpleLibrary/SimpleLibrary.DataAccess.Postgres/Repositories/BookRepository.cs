using Microsoft.EntityFrameworkCore;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Repositories;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.DataAccess.Postgres.Repositories
{
    public class BookRepository : IBookRepository
    {
        private const string IcuCollation = "und-x-icu";
        private const string UkrainianCollation = "uk-x-icu";

        private readonly LibraryDbContext _context;

        public BookRepository(LibraryDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Book book)
        {
            await _context.Books.AddAsync(book);
        }

        public async Task<IEnumerable<string>> GetGenresAsync()
        {
            return await _context.Books
                .AsNoTracking()
                .Where(b => b.Genre != "")
                .Select(b => b.Genre)
                .Distinct()
                .OrderBy(g => EF.Functions.Collate(g, UkrainianCollation)) // за українською абеткою
                .ToListAsync();
        }

        public async Task<Book?> GetByIdAsync(Guid id)
        {
            return await _context.Books
                .Include(b => b.Copies)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<BookCopy?> GetAvailableCopyAsync(Guid bookId)
        {
            return await _context.BookCopies
                .FirstOrDefaultAsync(c => c.BookId == bookId && c.Status == CopyStatus.Available);
        }

        public async Task<(IEnumerable<(Book Book, BookCopyCounts Copies)> Items, int TotalCount)> GetPagedAsync(
            int pageNumber, int pageSize, string? searchTerm, string? genre)
        {
            var query = _context.Books.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                string searchLower = searchTerm.ToLowerInvariant();
                query = query.Where(b => EF.Functions.Collate(b.Title, IcuCollation).ToLower().Contains(searchLower) ||
                                         EF.Functions.Collate(b.Author, IcuCollation).ToLower().Contains(searchLower));
            }

            if (!string.IsNullOrWhiteSpace(genre))
            {
                string genreLower = genre.ToLowerInvariant();
                query = query.Where(b => EF.Functions.Collate(b.Genre, IcuCollation).ToLower() == genreLower);
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
                    Available = b.Copies.Count(c => c.Status == CopyStatus.Available),
                    Reserved = b.Copies.Count(c => c.Status == CopyStatus.Reserved),
                    IssuedOut = b.Copies.Count(c => c.Status == CopyStatus.IssuedOut)
                })
                .ToListAsync();

            var items = rows.Select(r => (r.Book, new BookCopyCounts(r.Available, r.Reserved, r.IssuedOut))).ToList();

            return (items, totalCount);
        }

        public async Task AddCopyAsync(BookCopy copy)
        {
            // Явно позначаємо примірник як новий: інакше EF прийме його за наявний через вже заданий Id
            await _context.BookCopies.AddAsync(copy);
        }

        public void Delete(Book book)
        {
            _context.Books.Remove(book);
        }
    }
}
