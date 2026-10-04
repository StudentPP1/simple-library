using Microsoft.Extensions.Configuration;
using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.Interfaces.Repositories;
using SimpleLibrary.Core.Interfaces.Services;
using SimpleLibrary.Core.Interfaces.UnitsOfWork;
using SimpleLibrary.Application.Services;
using SimpleLibrary.Core.Models;
using SimpleLibrary.Core.Enums;
using Moq;
using Xunit;

namespace SimpleLibrary.Application.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<IJwtTokenGenerator> _mockJwtGenerator;
        private readonly Mock<IConfiguration> _mockConfig;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockJwtGenerator = new Mock<IJwtTokenGenerator>();
            _mockConfig = new Mock<IConfiguration>();

            _mockUow.Setup(u => u.UserRepository).Returns(_mockUserRepository.Object);

            _authService = new AuthService(_mockUow.Object, _mockJwtGenerator.Object, _mockConfig.Object);
        }

        [Fact]
        public async Task RegisterAsync_ExistingEmail_ReturnsConflictError()
        {
            var request = new RegisterRequest { Email = "test@test.com", Password = "password", FullName = "Test" };

            _mockUserRepository
                .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(new User("Test", "test@test.com", "hash", UserRole.Reader));

            var result = await _authService.RegisterAsync(request);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Conflict, result.Error);
            Assert.Equal("Користувач з таким Email вже існує.", result.Message);

            _mockUserRepository.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task RegisterAsync_ValidData_ReturnsSuccess()
        {
            var request = new RegisterRequest { Email = "new@test.com", Password = "password123", FullName = "New User" };

            _mockUserRepository
                .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((User?)null);

            var result = await _authService.RegisterAsync(request);

            Assert.True(result.Success);
            Assert.Equal(ErrorType.None, result.Error);
            Assert.NotNull(result.Data);
            Assert.Equal("new@test.com", result.Data.Email);

            _mockUserRepository.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_ValidLibrarianCode_ReturnsLibrarianRole()
        {
            var request = new RegisterRequest
            {
                Email = "admin@test.com",
                Password = "password123",
                FullName = "Librarian",
                LibrarianSecretCode = "SECRET_CODE"
            };

            _mockUserRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

            _mockConfig.Setup(c => c["SecuritySettings:LibrarianInviteCode"]).Returns("SECRET_CODE");

            var result = await _authService.RegisterAsync(request);

            Assert.True(result.Success);
            Assert.Equal(UserRole.Librarian, result.Data!.Role);
        }

        [Fact]
        public async Task RegisterAsync_InvalidLibrarianCode_ReturnsValidationError()
        {
            var request = new RegisterRequest
            {
                Email = "hacker@test.com",
                Password = "password123",
                FullName = "Hacker",
                LibrarianSecretCode = "WRONG_CODE"
            };

            _mockUserRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
            _mockConfig.Setup(c => c["SecuritySettings:LibrarianInviteCode"]).Returns("SECRET_CODE");

            var result = await _authService.RegisterAsync(request);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Validation, result.Error);
            Assert.Equal("Неправильний інвайт-код бібліотекаря.", result.Message);
        }

        [Fact]
        public async Task AuthenticateAsync_UserNotFound_ReturnsUnauthorized()
        {
            var request = new LoginRequest { Email = "notfound@test.com", Password = "password123" };

            _mockUserRepository.Setup(r => r.GetByEmailAsync(request.Email)).ReturnsAsync((User?)null);

            var result = await _authService.AuthenticateAsync(request);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Unauthorized, result.Error);
        }

        [Fact]
        public async Task AuthenticateAsync_WrongPassword_ReturnsUnauthorized()
        {
            var request = new LoginRequest { Email = "test@test.com", Password = "WrongPassword!" };

            string correctHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123");
            var dbUser = new User("Test", request.Email, correctHash, UserRole.Reader);

            _mockUserRepository.Setup(r => r.GetByEmailAsync(request.Email)).ReturnsAsync(dbUser);

            var result = await _authService.AuthenticateAsync(request);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Unauthorized, result.Error);
        }

        [Fact]
        public async Task AuthenticateAsync_ValidCredentials_ReturnsToken()
        {
            string plainPassword = "MySecretPassword123";
            var request = new LoginRequest { Email = "test@test.com", Password = plainPassword };

            string hash = BCrypt.Net.BCrypt.HashPassword(plainPassword);
            var dbUser = new User("Test", request.Email, hash, UserRole.Reader);

            _mockUserRepository.Setup(r => r.GetByEmailAsync(request.Email)).ReturnsAsync(dbUser);

            _mockJwtGenerator.Setup(j => j.GenerateToken(dbUser)).Returns("super_fake_jwt_token");

            var result = await _authService.AuthenticateAsync(request);

            Assert.True(result.Success);
            Assert.Equal(ErrorType.None, result.Error);
            Assert.Equal("super_fake_jwt_token", result.Data);
            Assert.Equal("Авторизація успішна.", result.Message);
        }
    }
}
