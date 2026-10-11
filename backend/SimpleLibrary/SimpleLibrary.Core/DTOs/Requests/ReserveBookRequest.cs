using System.ComponentModel.DataAnnotations;

namespace SimpleLibrary.Core.DTOs.Requests
{
    public class ReserveBookRequest
    {
        [Required(ErrorMessage = "ID книги є обов'язковим")]
        public Guid BookId { get; init; }
    }
}
