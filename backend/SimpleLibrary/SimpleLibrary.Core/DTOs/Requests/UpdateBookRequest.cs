using System.ComponentModel.DataAnnotations;

namespace SimpleLibrary.Core.DTOs.Requests
{
    public class UpdateBookRequest
    {
        [Required(ErrorMessage = "Назва книги обов'язкова")]
        [MaxLength(250)]
        public string Title { get; init; } = string.Empty;

        [Required(ErrorMessage = "Автор обов'язковий")]
        [MaxLength(150)]
        public string Author { get; init; } = string.Empty;

        [MaxLength(100)]
        public string Genre { get; init; } = string.Empty;

        [MaxLength(20)]
        public string ISBN { get; init; } = string.Empty;

        public int PublicationYear { get; init; }
    }
}
