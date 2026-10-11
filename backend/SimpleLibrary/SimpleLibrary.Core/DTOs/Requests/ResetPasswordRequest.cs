using System.ComponentModel.DataAnnotations;

namespace SimpleLibrary.Core.DTOs.Requests
{
    public class ResetPasswordRequest
    {
        [Required(ErrorMessage = "Email є обов'язковим")]
        public string Email { get; init; } = string.Empty;

        [Required(ErrorMessage = "Токен є обов'язковим")]
        public string Token { get; init; } = string.Empty;

        [Required(ErrorMessage = "Новий пароль є обов'язковим")]
        [MinLength(8, ErrorMessage = "Пароль має містити щонайменше 8 символів.")]
        [MaxLength(72, ErrorMessage = "Пароль не може бути довшим за 72 символи.")]
        public string NewPassword { get; init; } = string.Empty;
    }
}
