using SimpleLibrary.Core.DTOs.Responses;

namespace SimpleLibrary.Core.Interfaces.Services
{
    public interface ILoanService
    {
        Task<ServiceResponse<LoanResponse>> ReserveBookAsync(Guid bookId, Guid readerId);
        Task<ServiceResponse<LoanResponse>> IssueBookAsync(Guid loanId, Guid librarianId, int days);
        Task<ServiceResponse<LoanResponse>> ReturnBookAsync(Guid loanId, Guid librarianId);

        Task<ServiceResponse<IEnumerable<LoanResponse>>> GetReaderLoansAsync(Guid readerId);
        Task<ServiceResponse<IEnumerable<LoanResponse>>> GetActiveLoansAsync();
    }
}
