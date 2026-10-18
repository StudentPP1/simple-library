using Microsoft.EntityFrameworkCore;
using Moq;
using SimpleLibrary.Application.Services;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Repositories;
using SimpleLibrary.Core.Interfaces.UnitsOfWork;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.Application.Tests.Services
{
    public class LoanServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IBookRepository> _mockBookRepository;
        private readonly Mock<ILoanRepository> _mockLoanRepository;
        private readonly LoanService _loanService;

        private readonly Guid _readerId = Guid.NewGuid();
        private readonly Book _book = new("Clean Code", "Robert Martin", "Programming", "9780132350884", 2008);
        private readonly BookCopy _availableCopy;

        public LoanServiceTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockBookRepository = new Mock<IBookRepository>();
            _mockLoanRepository = new Mock<ILoanRepository>();

            _mockUow.Setup(u => u.BookRepository).Returns(_mockBookRepository.Object);
            _mockUow.Setup(u => u.LoanRepository).Returns(_mockLoanRepository.Object);
            _mockUow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _availableCopy = new BookCopy(_book.Id, "INV-00000001");

            _mockBookRepository.Setup(r => r.GetByIdAsync(_book.Id)).ReturnsAsync(_book);
            _mockBookRepository.Setup(r => r.GetAvailableCopyAsync(_book.Id)).ReturnsAsync(_availableCopy);
            _mockLoanRepository.Setup(r => r.GetActiveLoansCountForReaderAsync(_readerId)).ReturnsAsync(0);
            _mockLoanRepository.Setup(r => r.HasActiveLoanForBookAsync(_readerId, _book.Id)).ReturnsAsync(false);

            _loanService = new LoanService(_mockUow.Object);
        }

        [Fact]
        public async Task ReserveBookAsync_ValidRequest_ReservesCopyAndCreatesPendingLoan()
        {
            Loan? createdLoan = null;
            _mockLoanRepository
                .Setup(r => r.AddAsync(It.IsAny<Loan>()))
                .Callback<Loan>(loan => createdLoan = loan)
                .Returns(Task.CompletedTask);
            _mockLoanRepository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(() => createdLoan);

            var result = await _loanService.ReserveBookAsync(_book.Id, _readerId);

            Assert.True(result.Success);
            Assert.Equal(ErrorType.None, result.Error);
            Assert.NotNull(result.Data);
            Assert.Equal(nameof(LoanStatus.Pending), result.Data.Status);

            Assert.Equal(CopyStatus.Reserved, _availableCopy.Status);
            Assert.NotNull(createdLoan);
            Assert.Equal(_readerId, createdLoan.ReaderId);
            Assert.Equal(_availableCopy.Id, createdLoan.BookCopyId);

            _mockLoanRepository.Verify(r => r.AddAsync(It.IsAny<Loan>()), Times.Once);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Theory]
        [InlineData(5)]
        [InlineData(6)]
        public async Task ReserveBookAsync_ActiveLoansLimitReached_ReturnsConflictError(int activeLoansCount)
        {
            _mockLoanRepository
                .Setup(r => r.GetActiveLoansCountForReaderAsync(_readerId))
                .ReturnsAsync(activeLoansCount);

            var result = await _loanService.ReserveBookAsync(_book.Id, _readerId);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Conflict, result.Error);
            AssertNothingReserved();
        }

        [Fact]
        public async Task ReserveBookAsync_ReaderAlreadyHasThisBook_ReturnsConflictError()
        {
            _mockLoanRepository
                .Setup(r => r.HasActiveLoanForBookAsync(_readerId, _book.Id))
                .ReturnsAsync(true);

            var result = await _loanService.ReserveBookAsync(_book.Id, _readerId);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Conflict, result.Error);
            AssertNothingReserved();
        }

        [Fact]
        public async Task ReserveBookAsync_ConcurrencyConflictOnSave_ReturnsConflictError()
        {
            _mockUow
                .Setup(u => u.SaveChangesAsync())
                .ThrowsAsync(new DbUpdateConcurrencyException("Copy status was changed by another transaction."));

            var result = await _loanService.ReserveBookAsync(_book.Id, _readerId);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Conflict, result.Error);
            Assert.Null(result.Data);

            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
            _mockLoanRepository.Verify(r => r.GetByIdAsync(It.IsAny<Guid>()), Times.Never);
        }

        [Fact]
        public async Task CancelReservationAsync_AsReader_OwnReservation_ReturnsSuccess()
        {
            var loan = new Loan(_readerId, _availableCopy.Id);

            typeof(Loan).GetProperty(nameof(Loan.BookCopy))?.SetValue(loan, _availableCopy);

            _mockLoanRepository.Setup(r => r.GetByIdAsync(loan.Id)).ReturnsAsync(loan);

            var result = await _loanService.CancelReservationAsync(loan.Id, _readerId, UserRole.Reader.ToString());

            Assert.True(result.Success);
            Assert.Equal(LoanStatus.Cancelled, loan.Status);
            Assert.Equal(CopyStatus.Available, _availableCopy.Status);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CancelReservationAsync_AsReader_OtherPersonReservation_ReturnsForbidden()
        {
            var otherReaderId = Guid.NewGuid();
            var loan = new Loan(otherReaderId, _availableCopy.Id);
            typeof(Loan).GetProperty(nameof(Loan.BookCopy))?.SetValue(loan, _availableCopy);

            _mockLoanRepository.Setup(r => r.GetByIdAsync(loan.Id)).ReturnsAsync(loan);

            var result = await _loanService.CancelReservationAsync(loan.Id, _readerId, UserRole.Reader.ToString());

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Forbidden, result.Error);
            Assert.NotEqual(LoanStatus.Cancelled, loan.Status);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        private void AssertNothingReserved()
        {
            Assert.Equal(CopyStatus.Available, _availableCopy.Status);

            _mockLoanRepository.Verify(r => r.AddAsync(It.IsAny<Loan>()), Times.Never);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
        }
    }
}
