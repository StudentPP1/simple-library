using System.ComponentModel.DataAnnotations;

namespace SimpleLibrary.Core.DTOs.Requests
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Повне ім'я є обов'язковим.")]
        [MaxLength(150, ErrorMessage = "Повне ім'я не може бути довшим за 150 символів.")]
        public string FullName { get; init; } = string.Empty;

        [Required(ErrorMessage = "Email є обов'язковим.")]
        [EmailAddress(ErrorMessage = "Email має неправильний формат.")]
        [MaxLength(100, ErrorMessage = "Email не може бути довшим за 100 символів.")]
        public string Email { get; init; } = string.Empty;

        [Required(ErrorMessage = "Пароль є обов'язковим.")]
        [MinLength(8, ErrorMessage = "Пароль має містити щонайменше 8 символів.")]
        [MaxLength(72, ErrorMessage = "Пароль не може бути довшим за 72 символи.")]
        public string Password { get; init; } = string.Empty;

        public string? LibrarianSecretCode { get; init; }
    }
}
