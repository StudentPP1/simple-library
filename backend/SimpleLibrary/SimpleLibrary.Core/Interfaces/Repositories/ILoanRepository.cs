using SimpleLibrary.Core.Models;

namespace SimpleLibrary.Core.Interfaces.Repositories
{
    public interface ILoanRepository
    {
        Task<Loan?> GetByIdAsync(Guid id);
        Task AddAsync(Loan loan);
        Task<IEnumerable<Loan>> GetReaderLoansAsync(Guid readerId);
        Task<IEnumerable<Loan>> GetActiveLoansAsync();
        Task<IEnumerable<Loan>> GetExpiredPendingLoansAsync(DateTime expirationDate);

        Task<int> GetActiveLoansCountForReaderAsync(Guid readerId);
        Task<bool> HasActiveLoanForBookAsync(Guid readerId, Guid bookId);
    }
}
