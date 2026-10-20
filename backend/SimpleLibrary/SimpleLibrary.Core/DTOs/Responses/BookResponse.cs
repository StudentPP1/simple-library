namespace SimpleLibrary.Core.DTOs.Responses
{
    public class BookResponse
    {
        public Guid Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string Author { get; init; } = string.Empty;
        public string Genre { get; init; } = string.Empty;
        public string ISBN { get; init; } = string.Empty;
        public string? Description { get; init; }
        public int PublicationYear { get; init; }
        public decimal? Price { get; init; }

        public int AvailableCopiesCount { get; init; }
        public int ReservedCopiesCount { get; init; }
        public int IssuedCopiesCount { get; init; }

        /// <summary>
        /// Статус для каталогу: Available, Reserved, IssuedOut або Unavailable (FR-7).
        /// </summary>
        public string Status { get; init; } = string.Empty;
    }
}
