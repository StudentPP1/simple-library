using SimpleLibrary.Core.Interfaces.Repositories;
using SimpleLibrary.Core.Interfaces.UnitsOfWork;

namespace SimpleLibrary.DataAccess.Postgres.UnitsOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly LibraryDbContext _context;

        public IUserRepository UserRepository { get; }

        public UnitOfWork(LibraryDbContext context, IUserRepository userRepository)
        {
            _context = context;
            UserRepository = userRepository;
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
