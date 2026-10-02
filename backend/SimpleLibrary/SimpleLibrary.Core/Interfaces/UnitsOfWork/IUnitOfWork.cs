using SimpleLibrary.Core.Interfaces.Repositories;

namespace SimpleLibrary.Core.Interfaces.UnitsOfWork
{
    public interface IUnitOfWork : IDisposable
    {
        IUserRepository UserRepository { get; }

        Task<int> SaveChangesAsync();
    }
}
