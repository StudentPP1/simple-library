using SimpleLibrary.Core.Enums;

namespace SimpleLibrary.Core.Models
{
    public class Loan
    {
        public Guid Id { get; private set; }

        public Guid ReaderId { get; private set; }
        public User? Reader { get; private set; }

        public Guid BookCopyId { get; private set; }
        public BookCopy? BookCopy { get; private set; }

        public Guid? IssuedByUserId { get; private set; }
        public User? IssuedBy { get; private set; }

        public Guid? ReturnedByUserId { get; private set; }
        public User? ReturnedBy { get; private set; }

        public DateTime? ReservedAt { get; private set; }
        public DateTime? IssuedAt { get; private set; }
        public DateTime? DueDate { get; private set; }
        public DateTime? ReturnedAt { get; private set; }

        public LoanStatus Status { get; private set; }

        private Loan() { }

        public Loan(Guid readerId, Guid bookCopyId)
        {
            Id = Guid.NewGuid();
            ReaderId = readerId;
            BookCopyId = bookCopyId;
            ReservedAt = DateTime.UtcNow;
            Status = LoanStatus.Pending;
        }
    }
}
