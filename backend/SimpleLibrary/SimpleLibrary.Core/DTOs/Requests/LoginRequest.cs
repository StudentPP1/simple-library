using System.ComponentModel.DataAnnotations;

namespace SimpleLibrary.Core.DTOs.Requests
{
    public class LoginRequest
    {
        [Required(ErrorMessage = "Email є обов'язковим.")]
        [EmailAddress(ErrorMessage = "Email має неправильний формат.")]
        [MaxLength(100, ErrorMessage = "Email не може бути довшим за 100 символів.")]
        public string Email { get; init; } = string.Empty;

        [Required(ErrorMessage = "Пароль є обов'язковим.")]
        [MaxLength(72, ErrorMessage = "Пароль не може бути довшим за 72 символи.")]
        public string Password { get; init; } = string.Empty;
    }
}
