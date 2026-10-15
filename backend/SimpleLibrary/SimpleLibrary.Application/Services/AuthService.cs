using Microsoft.Extensions.Configuration;
using SimpleLibrary.Core;
using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.Enums;
using SimpleLibrary.Core.Interfaces.Services;
using SimpleLibrary.Core.Interfaces.UnitsOfWork;
using SimpleLibrary.Core.Models;
using System.Security.Cryptography;

namespace SimpleLibrary.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly IConfiguration _configuration;
        private readonly IEmailSender _emailSender;

        public AuthService(IUnitOfWork unitOfWork, IJwtTokenGenerator jwtTokenGenerator, IConfiguration configuration, IEmailSender emailSender)
        {
            _unitOfWork = unitOfWork;
            _jwtTokenGenerator = jwtTokenGenerator;
            _configuration = configuration;
            _emailSender = emailSender;
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

        public async Task<ServiceResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            string email = NormalizeEmail(request.Email);
            var user = await _unitOfWork.UserRepository.GetByEmailAsync(email);

            if (user != null)
            {
                string resetToken = RandomNumberGenerator.GetHexString(32);
                DateTime expiry = DateTime.UtcNow.AddHours(1);

                user.SetPasswordResetToken(resetToken, expiry);
                await _unitOfWork.SaveChangesAsync();

                string subject = "Відновлення пароля - Simple Library";
                string body = $"<h2>Відновлення пароля</h2><p>Ваш код для скидання пароля: <b>{resetToken}</b></p><p>Код дійсний 1 годину.</p>";

                await _emailSender.SendEmailAsync(user.Email, subject, body);
            }

            return ServiceResponse<bool>.Ok(true, "Якщо email зареєстровано, ми відправили на нього лист з інструкціями.");
        }

        public async Task<ServiceResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request)
        {
            string email = NormalizeEmail(request.Email);
            var user = await _unitOfWork.UserRepository.GetByEmailAsync(email);

            if (user == null || user.PasswordResetToken != request.Token || user.PasswordResetTokenExpiry < DateTime.UtcNow)
            {
                return ServiceResponse<bool>.Fail("Недійсний або прострочений токен відновлення.", ErrorType.Validation);
            }

            string newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.ResetPassword(newPasswordHash);

            await _unitOfWork.SaveChangesAsync();

            return ServiceResponse<bool>.Ok(true, "Пароль успішно змінено. Тепер ви можете увійти.");
        }

        private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
    }
}
