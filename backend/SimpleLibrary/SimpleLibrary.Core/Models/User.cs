using SimpleLibrary.Core.Enums;

namespace SimpleLibrary.Core.Models
{
    public class User
    {
        public Guid Id { get; private set; }
        public string FullName { get; private set; } = string.Empty;
        public string Email { get; private set; } = string.Empty;
        public string PasswordHash { get; private set; } = string.Empty;
        public UserRole Role { get; private set; }

        private readonly List<Loan> _loans = new();
        public IReadOnlyCollection<Loan> Loans => _loans.AsReadOnly();

        private User() { }

        public User(string fullName, string email, string passwordHash, UserRole role)
        {
            Id = Guid.NewGuid();
            FullName = fullName;
            Email = email;
            PasswordHash = passwordHash;
            Role = role;
        }
    }
}
