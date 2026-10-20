using System.ComponentModel.DataAnnotations;

namespace SimpleLibrary.Core.DTOs.Requests
{
    public class UpdateBookRequest
    {
        [Required(ErrorMessage = "Назва книги обов'язкова")]
        [MaxLength(250, ErrorMessage = "Назва не може бути довшою за 250 символів")]
        public string Title { get; init; } = string.Empty;

        [Required(ErrorMessage = "Автор обов'язковий")]
        [MaxLength(150)]
        public string Author { get; init; } = string.Empty;

        [MaxLength(100)]
        public string Genre { get; init; } = string.Empty;

        [MaxLength(20)]
        public string ISBN { get; init; } = string.Empty;

        /// <summary>
        /// Опис книги. Якщо передати null або не передати поле взагалі - старий опис збережеться.
        /// Щоб видалити існуючий опис, передайте порожній рядок "".
        /// </summary>
        [MaxLength(2000, ErrorMessage = "Опис не може перевищувати 2000 символів")]
        public string? Description { get; init; }

        public int PublicationYear { get; init; }

        /// <summary>
        /// Ціна книги. Якщо не передати - стара ціна збережеться.
        /// </summary>
        [Range(typeof(decimal), "0", "100000", ErrorMessage = "Ціна має бути від 0 до 100000")]
        public decimal? Price { get; init; }

        /// <summary>
        /// Нова кількість примірників у фонді. Якщо не передати - кількість не зміниться.
        /// Під час зменшення списуються лише вільні примірники.
        /// </summary>
        [Range(1, 100, ErrorMessage = "Кількість примірників має бути від 1 до 100")]
        public int? CopiesCount { get; init; }
    }
}
