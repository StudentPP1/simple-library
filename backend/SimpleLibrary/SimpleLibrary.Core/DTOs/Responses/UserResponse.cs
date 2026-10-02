namespace SimpleLibrary.Core.DTOs.Responses
{
    public class UserResponse
    {
        public Guid Id { get; init; }
        public string FullName { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public string Role { get; init; } = string.Empty;
    }
}
