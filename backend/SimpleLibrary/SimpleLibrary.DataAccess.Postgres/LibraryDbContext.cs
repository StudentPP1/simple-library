using Microsoft.EntityFrameworkCore;

namespace SimpleLibrary.DataAccess.Postgres
{
    public class LibraryDbContext : DbContext
    {
        public LibraryDbContext(DbContextOptions<LibraryDbContext> options) : base(options)
        {
        }

        // Майбутні таблиці
        // public DbSet<User> Users { get; set; }
        // public DbSet<Book> Books { get; set; }
        // public DbSet<BookCopy> BookCopies { get; set; }
        // public DbSet<Loan> Loans { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(LibraryDbContext).Assembly);

            base.OnModelCreating(modelBuilder);
        }
    }
}
