using SimpleLibrary.Core.Models;

namespace SimpleLibrary.Core.Interfaces.Services
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(User user);
    }
}
