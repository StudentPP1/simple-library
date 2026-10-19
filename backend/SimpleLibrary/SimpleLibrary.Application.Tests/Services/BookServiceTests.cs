using Moq;
using SimpleLibrary.Application.Services;
using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Repositories;
using SimpleLibrary.Core.Interfaces.UnitsOfWork;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.Application.Tests.Services
{
    public class BookServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IBookRepository> _mockBookRepository;
        private readonly BookService _bookService;

        public BookServiceTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockBookRepository = new Mock<IBookRepository>();

            _mockUow.Setup(u => u.BookRepository).Returns(_mockBookRepository.Object);
            _mockUow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _bookService = new BookService(_mockUow.Object);
        }

        [Fact]
        public async Task AddBookAsync_ValidRequest_AddsBookWithCopiesAndSavesChanges()
        {
            var request = CreateRequest(publicationYear: 2020, copiesCount: 3);

            var result = await _bookService.AddBookAsync(request);

            Assert.True(result.Success);
            Assert.Equal(ErrorType.None, result.Error);
            Assert.NotNull(result.Data);
            Assert.Equal("Clean Code", result.Data.Title);
            Assert.Equal(3, result.Data.AvailableCopiesCount);

            _mockBookRepository.Verify(r => r.AddAsync(It.Is<Book>(b =>
                b.Title == "Clean Code" &&
                b.Author == "Robert Martin" &&
                b.Copies.Count == 3 &&
                b.Copies.All(c => c.Status == CopyStatus.Available))), Times.Once);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public async Task AddBookAsync_NonPositivePublicationYear_ReturnsValidationError(int publicationYear)
        {
            var request = CreateRequest(publicationYear);

            var result = await _bookService.AddBookAsync(request);

            AssertValidationFailureWithoutSaving(result.Success, result.Error);
        }

        [Fact]
        public async Task AddBookAsync_PublicationYearInTheFuture_ReturnsValidationError()
        {
            var request = CreateRequest(publicationYear: DateTime.UtcNow.Year + 1);

            var result = await _bookService.AddBookAsync(request);

            AssertValidationFailureWithoutSaving(result.Success, result.Error);
        }

        [Fact]
        public async Task DeleteBookAsync_BookWithoutIssuedCopies_DeletesBookAndSavesChanges()
        {
            var book = CreateBookWithCopies(CopyStatus.Available, CopyStatus.Reserved);
            _mockBookRepository.Setup(r => r.GetByIdAsync(book.Id)).ReturnsAsync(book);

            var result = await _bookService.DeleteBookAsync(book.Id);

            Assert.True(result.Success);
            Assert.True(result.Data);
            Assert.Equal(ErrorType.None, result.Error);

            _mockBookRepository.Verify(r => r.Delete(book), Times.Once);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task DeleteBookAsync_BookWithIssuedOutCopy_ReturnsConflictError()
        {
            var book = CreateBookWithCopies(CopyStatus.Available, CopyStatus.IssuedOut);
            _mockBookRepository.Setup(r => r.GetByIdAsync(book.Id)).ReturnsAsync(book);

            var result = await _bookService.DeleteBookAsync(book.Id);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Conflict, result.Error);

            _mockBookRepository.Verify(r => r.Delete(It.IsAny<Book>()), Times.Never);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Theory]
        [InlineData(new[] { CopyStatus.Available, CopyStatus.IssuedOut }, "Available")]
        [InlineData(new[] { CopyStatus.Reserved, CopyStatus.IssuedOut }, "Reserved")]
        [InlineData(new[] { CopyStatus.IssuedOut, CopyStatus.IssuedOut }, "IssuedOut")]
        [InlineData(new[] { CopyStatus.Lost }, "Unavailable")]
        public async Task GetBookByIdAsync_ReturnsAvailabilityStatusByCopies(CopyStatus[] copyStatuses, string expectedStatus)
        {
            var book = CreateBookWithCopies(copyStatuses);
            _mockBookRepository.Setup(r => r.GetByIdAsync(book.Id)).ReturnsAsync(book);

            var result = await _bookService.GetBookByIdAsync(book.Id);

            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(expectedStatus, result.Data.Status);
            Assert.Equal(copyStatuses.Count(s => s == CopyStatus.Available), result.Data.AvailableCopiesCount);
            Assert.Equal(copyStatuses.Count(s => s == CopyStatus.Reserved), result.Data.ReservedCopiesCount);
            Assert.Equal(copyStatuses.Count(s => s == CopyStatus.IssuedOut), result.Data.IssuedCopiesCount);
        }

        private void AssertValidationFailureWithoutSaving(bool success, ErrorType error)
        {
            Assert.False(success);
            Assert.Equal(ErrorType.Validation, error);

            _mockBookRepository.Verify(r => r.AddAsync(It.IsAny<Book>()), Times.Never);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        private static CreateBookRequest CreateRequest(int publicationYear, int copiesCount = 1)
        {
            return new CreateBookRequest
            {
                Title = "  Clean Code  ",
                Author = "Robert Martin",
                Genre = "Programming",
                ISBN = "9780132350884",
                PublicationYear = publicationYear,
                CopiesCount = copiesCount
            };
        }

        private static Book CreateBookWithCopies(params CopyStatus[] copyStatuses)
        {
            var book = new Book("Clean Code", "Robert Martin", "Programming", "9780132350884", 2008);

            foreach (var status in copyStatuses)
            {
                var copy = new BookCopy(book.Id, $"INV-{Guid.NewGuid():N}");
                copy.ChangeStatus(status);
                book.AddCopy(copy);
            }

            return book;
        }
    }
}
