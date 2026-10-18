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

        public int AvailableCopiesCount { get; init; }
    }
}
