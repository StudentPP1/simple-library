using SimpleLibrary.Core.Enums;

namespace SimpleLibrary.Core.Models
{
    public class Book
    {
        public Guid Id { get; private set; }
        public string Title { get; private set; } = string.Empty;
        public string Author { get; private set; } = string.Empty;
        public string Genre { get; private set; } = string.Empty;
        public string ISBN { get; private set; } = string.Empty;
        public string? Description { get; private set; }
        public int PublicationYear { get; private set; }
        public decimal? Price { get; private set; }

        private readonly List<BookCopy> _copies = new();
        public IReadOnlyCollection<BookCopy> Copies => _copies.AsReadOnly();

        /// <summary>
        /// Кількість примірників у фонді: усі, крім списаних (Lost).
        /// </summary>
        public int ActiveCopiesCount => _copies.Count(c => c.Status != CopyStatus.Lost);

        private Book() { }

        public Book(string title, string author, string genre, string isbn, int publicationYear, string? description = null, decimal? price = null)
        {
            Id = Guid.NewGuid();
            Title = title;
            Author = author;
            Genre = genre;
            ISBN = isbn;
            PublicationYear = publicationYear;
            Description = description;
            Price = price;
        }

        public void AddCopy(BookCopy copy)
        {
            _copies.Add(copy);
        }

        public void UpdateInfo(string title, string author, string genre, string isbn, int publicationYear, string? description, decimal? price)
        {
            Title = title;
            Author = author;
            Genre = genre;
            ISBN = isbn;
            PublicationYear = publicationYear;
            Description = description;
            Price = price;
        }
    }
}
