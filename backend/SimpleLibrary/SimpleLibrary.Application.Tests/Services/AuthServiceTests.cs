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
        private readonly Mock<IEmailSender> _mockEmailSender;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockJwtGenerator = new Mock<IJwtTokenGenerator>();
            _mockConfig = new Mock<IConfiguration>();
            _mockEmailSender = new Mock<IEmailSender>();

            _mockUow.Setup(u => u.UserRepository).Returns(_mockUserRepository.Object);

            _authService = new AuthService(_mockUow.Object, _mockJwtGenerator.Object, _mockConfig.Object, _mockEmailSender.Object);
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

        [Fact]
        public async Task ForgotPasswordAsync_ExistingUser_SetsResetTokenAndSendsEmail()
        {
            var user = CreateUser();
            _mockUserRepository.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

            var result = await _authService.ForgotPasswordAsync(new ForgotPasswordRequest { Email = user.Email });

            Assert.True(result.Success);
            Assert.Equal(ErrorType.None, result.Error);

            Assert.Matches("^[0-9A-F]{32}$", user.PasswordResetToken);
            Assert.InRange(user.PasswordResetTokenExpiry!.Value, DateTime.UtcNow.AddMinutes(59), DateTime.UtcNow.AddMinutes(61));

            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
            _mockEmailSender.Verify(e => e.SendEmailAsync(
                user.Email,
                It.IsAny<string>(),
                It.Is<string>(body => body.Contains(user.PasswordResetToken!))), Times.Once);
        }

        [Fact]
        public async Task ForgotPasswordAsync_UnknownEmail_ReturnsSameSuccessMessageWithoutSendingEmail()
        {
            var existingUser = CreateUser();
            _mockUserRepository.Setup(r => r.GetByEmailAsync(existingUser.Email)).ReturnsAsync(existingUser);
            _mockUserRepository.Setup(r => r.GetByEmailAsync("unknown@test.com")).ReturnsAsync((User?)null);

            var existingResult = await _authService.ForgotPasswordAsync(new ForgotPasswordRequest { Email = existingUser.Email });
            _mockUow.Invocations.Clear();
            _mockEmailSender.Invocations.Clear();

            var unknownResult = await _authService.ForgotPasswordAsync(new ForgotPasswordRequest { Email = "unknown@test.com" });

            Assert.True(unknownResult.Success);
            Assert.Equal(existingResult.Message, unknownResult.Message);

            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
            _mockEmailSender.Verify(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task ForgotPasswordAsync_EmailWithSpacesAndUpperCase_IsNormalizedBeforeLookup()
        {
            _mockUserRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

            await _authService.ForgotPasswordAsync(new ForgotPasswordRequest { Email = "  TEST@Test.COM  " });

            _mockUserRepository.Verify(r => r.GetByEmailAsync("test@test.com"), Times.Once);
        }

        [Fact]
        public async Task ResetPasswordAsync_ValidToken_ChangesPasswordAndClearsToken()
        {
            var user = CreateUserWithResetToken("VALID_TOKEN", DateTime.UtcNow.AddMinutes(30));
            _mockUserRepository.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
            var request = CreateResetRequest(user.Email, "VALID_TOKEN", "NewPassword123");

            var result = await _authService.ResetPasswordAsync(request);

            Assert.True(result.Success);
            Assert.Equal(ErrorType.None, result.Error);

            Assert.True(BCrypt.Net.BCrypt.Verify("NewPassword123", user.PasswordHash));
            Assert.False(BCrypt.Net.BCrypt.Verify(OldPassword, user.PasswordHash));
            Assert.Null(user.PasswordResetToken);
            Assert.Null(user.PasswordResetTokenExpiry);

            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task ResetPasswordAsync_UnknownUser_ReturnsValidationError()
        {
            _mockUserRepository.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
            var request = CreateResetRequest("unknown@test.com", "ANY_TOKEN", "NewPassword123");

            var result = await _authService.ResetPasswordAsync(request);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Validation, result.Error);
            Assert.Equal(InvalidTokenMessage, result.Message);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task ResetPasswordAsync_WrongToken_ReturnsValidationErrorAndKeepsPassword()
        {
            var user = CreateUserWithResetToken("VALID_TOKEN", DateTime.UtcNow.AddMinutes(30));
            string oldHash = user.PasswordHash;
            _mockUserRepository.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
            var request = CreateResetRequest(user.Email, "WRONG_TOKEN", "NewPassword123");

            var result = await _authService.ResetPasswordAsync(request);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Validation, result.Error);
            Assert.Equal(InvalidTokenMessage, result.Message);

            Assert.Equal(oldHash, user.PasswordHash);
            Assert.Equal("VALID_TOKEN", user.PasswordResetToken);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task ResetPasswordAsync_ExpiredToken_ReturnsValidationErrorAndKeepsPassword()
        {
            var user = CreateUserWithResetToken("VALID_TOKEN", DateTime.UtcNow.AddMinutes(-1));
            string oldHash = user.PasswordHash;
            _mockUserRepository.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
            var request = CreateResetRequest(user.Email, "VALID_TOKEN", "NewPassword123");

            var result = await _authService.ResetPasswordAsync(request);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Validation, result.Error);
            Assert.Equal(InvalidTokenMessage, result.Message);

            Assert.Equal(oldHash, user.PasswordHash);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task ResetPasswordAsync_UserWithoutRequestedReset_ReturnsValidationError()
        {
            var user = CreateUser();
            _mockUserRepository.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
            var request = CreateResetRequest(user.Email, "ANY_TOKEN", "NewPassword123");

            var result = await _authService.ResetPasswordAsync(request);

            Assert.False(result.Success);
            Assert.Equal(ErrorType.Validation, result.Error);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task ResetPasswordAsync_SameTokenUsedTwice_SecondAttemptFails()
        {
            var user = CreateUserWithResetToken("VALID_TOKEN", DateTime.UtcNow.AddMinutes(30));
            _mockUserRepository.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

            var firstResult = await _authService.ResetPasswordAsync(CreateResetRequest(user.Email, "VALID_TOKEN", "FirstPassword123"));
            var secondResult = await _authService.ResetPasswordAsync(CreateResetRequest(user.Email, "VALID_TOKEN", "SecondPassword123"));

            Assert.True(firstResult.Success);
            Assert.False(secondResult.Success);
            Assert.Equal(ErrorType.Validation, secondResult.Error);

            Assert.True(BCrypt.Net.BCrypt.Verify("FirstPassword123", user.PasswordHash));
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task ResetPasswordAsync_EmailWithSpacesAndUpperCase_IsNormalizedBeforeLookup()
        {
            var user = CreateUserWithResetToken("VALID_TOKEN", DateTime.UtcNow.AddMinutes(30));
            _mockUserRepository.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
            var request = CreateResetRequest("  TEST@Test.COM  ", "VALID_TOKEN", "NewPassword123");

            var result = await _authService.ResetPasswordAsync(request);

            Assert.True(result.Success);
            _mockUserRepository.Verify(r => r.GetByEmailAsync("test@test.com"), Times.Once);
        }

        private const string OldPassword = "OldPassword123";
        private const string InvalidTokenMessage = "Недійсний або прострочений токен відновлення.";

        private static User CreateUser()
        {
            return new User("Test", "test@test.com", BCrypt.Net.BCrypt.HashPassword(OldPassword), UserRole.Reader);
        }

        private static User CreateUserWithResetToken(string token, DateTime expiry)
        {
            var user = CreateUser();
            user.SetPasswordResetToken(token, expiry);
            return user;
        }

        private static ResetPasswordRequest CreateResetRequest(string email, string token, string newPassword)
        {
            return new ResetPasswordRequest { Email = email, Token = token, NewPassword = newPassword };
        }
    }
}
