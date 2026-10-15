using System.ComponentModel.DataAnnotations;

namespace SimpleLibrary.Core.DTOs.Requests
{
    public class ForgotPasswordRequest
    {
        [Required(ErrorMessage = "Email є обов'язковим")]
        [EmailAddress(ErrorMessage = "Неправильний формат Email")]
        public string Email { get; init; } = string.Empty;
    }
}
