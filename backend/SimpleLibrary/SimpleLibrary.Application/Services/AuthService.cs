using SimpleLibrary.Core;
using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Services;
using SimpleLibrary.Core.Interfaces.UnitsOfWork;
using SimpleLibrary.Core.Models;
using Microsoft.Extensions.Configuration;

namespace SimpleLibrary.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly IConfiguration _configuration;

        public AuthService(IUnitOfWork unitOfWork, IJwtTokenGenerator jwtTokenGenerator, IConfiguration configuration)
        {
            _unitOfWork = unitOfWork;
            _jwtTokenGenerator = jwtTokenGenerator;
            _configuration = configuration;
        }

        public async Task<ServiceResponse<User>> RegisterAsync(RegisterRequest request)
        {
            string email = NormalizeEmail(request.Email);
            string fullName = request.FullName.Trim();

            var role = UserRole.Reader;

            if (!string.IsNullOrWhiteSpace(request.LibrarianSecretCode))
            {
                if (request.LibrarianSecretCode != _configuration["SecuritySettings:LibrarianInviteCode"])
                {
                    return ServiceResponse<User>.Fail("Неправильний інвайт-код бібліотекаря.", ErrorType.Validation);
                }

                role = UserRole.Librarian;
            }

            var existingUser = await _unitOfWork.UserRepository.GetByEmailAsync(email);
            if (existingUser != null)
            {
                return ServiceResponse<User>.Fail("Користувач з таким Email вже існує.", ErrorType.Conflict);
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var newUser = new User(fullName, email, passwordHash, role);

            await _unitOfWork.UserRepository.AddAsync(newUser);
            await _unitOfWork.SaveChangesAsync();

            return ServiceResponse<User>.Ok(newUser, "Реєстрація успішна.");
        }

        public async Task<ServiceResponse<string>> AuthenticateAsync(LoginRequest request)
        {
            string email = NormalizeEmail(request.Email);

            var user = await _unitOfWork.UserRepository.GetByEmailAsync(email);

            if (user == null)
            {
                return ServiceResponse<string>.Fail("Неправильний Email або пароль.", ErrorType.Unauthorized);
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return ServiceResponse<string>.Fail("Неправильний Email або пароль.", ErrorType.Unauthorized);
            }

            string token = _jwtTokenGenerator.GenerateToken(user);

            return ServiceResponse<string>.Ok(token, "Авторизація успішна.");
        }

        private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
    }
}
