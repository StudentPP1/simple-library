namespace SimpleLibrary.Core.Shared
{
    public class PagedResponse<T>
    {
        public IEnumerable<T> Items { get; init; } = new List<T>();
        public int TotalCount { get; init; }
        public int PageNumber { get; init; }
        public int PageSize { get; init; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    }
}
