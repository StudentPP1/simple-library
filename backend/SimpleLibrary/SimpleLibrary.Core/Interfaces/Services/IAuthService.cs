using SimpleLibrary.Core.DTOs.Requests;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.Core.Interfaces.Services
{
    public interface IAuthService
    {
        Task<ServiceResponse<User>> RegisterAsync(RegisterRequest request);
        Task<ServiceResponse<string>> AuthenticateAsync(LoginRequest request);

        Task<ServiceResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequest request);
        Task<ServiceResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request);
    }
}
