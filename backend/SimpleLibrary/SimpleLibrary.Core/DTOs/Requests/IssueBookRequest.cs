using System.ComponentModel.DataAnnotations;

namespace SimpleLibrary.Core.DTOs.Requests
{
    public class IssueBookRequest
    {
        [Range(1, 365, ErrorMessage = "Термін видачі має бути від 1 до 365 днів")]
        public int Days { get; init; } = 14;
    }
}
