
using Microsoft.EntityFrameworkCore;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Repositories;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.DataAccess.Postgres.Repositories
{
    public class LoanRepository : ILoanRepository
    {
        private readonly LibraryDbContext _context;

        public LoanRepository(LibraryDbContext context)
        {
            _context = context;
        }

        public async Task<Loan?> GetByIdAsync(Guid id)
        {
            return await _context.Loans
                .Include(l => l.BookCopy!).ThenInclude(c => c.Book)
                .Include(l => l.Reader)
                .FirstOrDefaultAsync(l => l.Id == id);
        }

        public async Task AddAsync(Loan loan)
        {
            await _context.Loans.AddAsync(loan);
        }

        public async Task<IEnumerable<Loan>> GetReaderLoansAsync(Guid readerId)
        {
            return await _context.Loans
                .AsNoTracking()
                .Include(l => l.BookCopy!).ThenInclude(c => c.Book)
                .Include(l => l.Reader)
                .Where(l => l.ReaderId == readerId)
                .OrderByDescending(l => l.ReservedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Loan>> GetActiveLoansAsync()
        {
            return await _context.Loans
                .Include(l => l.BookCopy!).ThenInclude(c => c.Book)
                .Include(l => l.Reader)
                .Where(l => l.Status == LoanStatus.Active || l.Status == LoanStatus.Pending)
                .OrderBy(l => l.DueDate)
                .ToListAsync();
        }

        public async Task<int> GetActiveLoansCountForReaderAsync(Guid readerId)
        {
            return await _context.Loans
                .CountAsync(l => l.ReaderId == readerId && (l.Status == LoanStatus.Pending || l.Status == LoanStatus.Active));
        }

        public async Task<bool> HasActiveLoanForBookAsync(Guid readerId, Guid bookId)
        {
            return await _context.Loans
                .AnyAsync(l => l.ReaderId == readerId
                            && l.BookCopy!.BookId == bookId
                            && (l.Status == LoanStatus.Pending || l.Status == LoanStatus.Active));
        }
    }
}
