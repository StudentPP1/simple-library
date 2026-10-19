using SimpleLibrary.Core.Enums;

namespace SimpleLibrary.Core.Models
{
    /// <summary>
    /// Кількість примірників книги за статусами та загальний статус книги для каталогу (FR-7).
    /// </summary>
    public record BookCopyCounts(int Available, int Reserved, int IssuedOut)
    {
        public static BookCopyCounts From(IEnumerable<BookCopy> copies)
        {
            var list = copies.ToList();

            return new BookCopyCounts(
                list.Count(c => c.Status == CopyStatus.Available),
                list.Count(c => c.Status == CopyStatus.Reserved),
                list.Count(c => c.Status == CopyStatus.IssuedOut));
        }

        /// <summary>
        /// Є вільний примірник - книга в наявності. Інакше бронювання важливіше за видачу,
        /// бо прострочене бронювання скасовується автоматично і примірник звільниться раніше.
        /// </summary>
        public BookAvailability Availability =>
            Available > 0 ? BookAvailability.Available
            : Reserved > 0 ? BookAvailability.Reserved
            : IssuedOut > 0 ? BookAvailability.IssuedOut
            : BookAvailability.Unavailable;
    }
}
