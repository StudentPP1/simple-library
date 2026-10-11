using SimpleLibrary.Core;
using SimpleLibrary.Core.DTOs.Responses;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Services;
using SimpleLibrary.Core.Interfaces.UnitsOfWork;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.Application.Services
{
    public class LoanService : ILoanService
    {
        private readonly IUnitOfWork _unitOfWork;

        public LoanService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ServiceResponse<LoanResponse>> ReserveBookAsync(Guid bookId, Guid readerId)
        {
            var book = await _unitOfWork.BookRepository.GetByIdAsync(bookId);
            if (book == null)
            {
                return ServiceResponse<LoanResponse>.Fail("Книгу не знайдено.", ErrorType.NotFound);
            }

            var activeLoansCount = await _unitOfWork.LoanRepository.GetActiveLoansCountForReaderAsync(readerId);
            if (activeLoansCount >= 5)
            {
                return ServiceResponse<LoanResponse>.Fail("Ви досягли ліміту: не більше 5 активних книг або бронювань.", ErrorType.Conflict);
            }

            var hasThisBook = await _unitOfWork.LoanRepository.HasActiveLoanForBookAsync(readerId, bookId);
            if (hasThisBook)
            {
                return ServiceResponse<LoanResponse>.Fail("Ви вже забронювали або взяли цю книгу.", ErrorType.Conflict);
            }

            var availableCopy = await _unitOfWork.BookRepository.GetAvailableCopyAsync(bookId);
            if (availableCopy == null)
            {
                return ServiceResponse<LoanResponse>.Fail("На жаль, усі примірники цієї книги зараз зайняті.", ErrorType.Conflict);
            }

            availableCopy.ChangeStatus(CopyStatus.Reserved);

            var loan = new Loan(readerId, availableCopy.Id);
            await _unitOfWork.LoanRepository.AddAsync(loan);

            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex) when (ex.GetType().Name == "DbUpdateConcurrencyException")
            {
                return ServiceResponse<LoanResponse>.Fail("Хтось інший щойно забронював цей примірник. Спробуйте ще раз.", ErrorType.Conflict);
            }

            var savedLoan = await _unitOfWork.LoanRepository.GetByIdAsync(loan.Id);
            return ServiceResponse<LoanResponse>.Ok(MapToResponse(savedLoan!));
        }


        public async Task<ServiceResponse<LoanResponse>> IssueBookAsync(Guid loanId, Guid librarianId, int days)
        {
            var loan = await _unitOfWork.LoanRepository.GetByIdAsync(loanId);
            if (loan == null || loan.Status != LoanStatus.Pending)
            {
                return ServiceResponse<LoanResponse>.Fail("Бронювання не знайдено або воно вже неактивне.", ErrorType.NotFound);
            }

            loan.IssueToReader(librarianId, days);
            loan.BookCopy!.ChangeStatus(CopyStatus.IssuedOut);

            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex) when (ex.GetType().Name == "DbUpdateConcurrencyException")
            {
                return ServiceResponse<LoanResponse>.Fail("Стан примірника щойно змінився іншим користувачем. Спробуйте оновити сторінку.", ErrorType.Conflict);
            }

            return ServiceResponse<LoanResponse>.Ok(MapToResponse(loan));
        }

        public async Task<ServiceResponse<LoanResponse>> ReturnBookAsync(Guid loanId, Guid librarianId)
        {
            var loan = await _unitOfWork.LoanRepository.GetByIdAsync(loanId);
            if (loan == null || loan.Status != LoanStatus.Active)
            {
                return ServiceResponse<LoanResponse>.Fail("Активну видачу не знайдено.", ErrorType.NotFound);
            }

            loan.ReturnBook(librarianId);
            loan.BookCopy!.ChangeStatus(CopyStatus.Available);

            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex) when (ex.GetType().Name == "DbUpdateConcurrencyException")
            {
                return ServiceResponse<LoanResponse>.Fail("Стан примірника щойно змінився іншим користувачем. Спробуйте оновити сторінку.", ErrorType.Conflict);
            }

            return ServiceResponse<LoanResponse>.Ok(MapToResponse(loan));
        }

        public async Task<ServiceResponse<IEnumerable<LoanResponse>>> GetReaderLoansAsync(Guid readerId)
        {
            var loans = await _unitOfWork.LoanRepository.GetReaderLoansAsync(readerId);
            return ServiceResponse<IEnumerable<LoanResponse>>.Ok(loans.Select(MapToResponse));
        }

        public async Task<ServiceResponse<IEnumerable<LoanResponse>>> GetActiveLoansAsync()
        {
            var loans = await _unitOfWork.LoanRepository.GetActiveLoansAsync();
            return ServiceResponse<IEnumerable<LoanResponse>>.Ok(loans.Select(MapToResponse));
        }

        private static LoanResponse MapToResponse(Loan loan)
        {
            return new LoanResponse
            {
                Id = loan.Id,
                BookTitle = loan.BookCopy?.Book?.Title ?? "Невідома книга",
                InventoryNumber = loan.BookCopy?.InventoryNumber ?? "",
                ReaderName = loan.Reader?.FullName ?? "Невідомий читач",
                ReaderEmail = loan.Reader?.Email ?? "Невідомий email",
                ReservedAt = loan.ReservedAt,
                IssuedAt = loan.IssuedAt,
                DueDate = loan.DueDate,
                ReturnedAt = loan.ReturnedAt,
                Status = loan.Status.ToString()
            };
        }
    }
}
