using SimpleLibrary.Core.Enums;

namespace SimpleLibrary.Core.Models
{
    public class BookCopy
    {
        public Guid Id { get; private set; }

        public Guid BookId { get; private set; }
        public Book? Book { get; private set; }

        public string InventoryNumber { get; private set; } = string.Empty;
        public CopyStatus Status { get; private set; }

        private readonly List<Loan> _loans = new();
        public IReadOnlyCollection<Loan> Loans => _loans.AsReadOnly();

        private BookCopy() { }

        public BookCopy(Guid bookId, string inventoryNumber)
        {
            Id = Guid.NewGuid();
            BookId = bookId;
            InventoryNumber = inventoryNumber;
            Status = CopyStatus.Available; 
        }
    }
}
