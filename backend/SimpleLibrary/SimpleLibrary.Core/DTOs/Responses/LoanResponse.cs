namespace SimpleLibrary.Core.DTOs.Responses
{
    public class LoanResponse
    {
        public Guid Id { get; init; }
        public string BookTitle { get; init; } = string.Empty;
        public string InventoryNumber { get; init; } = string.Empty;

        public string ReaderName { get; init; } = string.Empty;
        public string ReaderEmail { get; init; } = string.Empty;

        public DateTime? ReservedAt { get; init; }
        public DateTime? IssuedAt { get; init; }
        public DateTime? DueDate { get; init; }
        public DateTime? ReturnedAt { get; init; }

        public string Status { get; init; } = string.Empty;

        public bool IsOverdue => Status == "Active" && DueDate.HasValue && DueDate.Value < DateTime.UtcNow;
    }
}
