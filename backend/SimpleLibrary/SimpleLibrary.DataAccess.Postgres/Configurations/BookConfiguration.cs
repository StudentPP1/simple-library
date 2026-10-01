using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.DataAccess.Postgres.Configurations
{
    public class BookConfiguration : IEntityTypeConfiguration<Book>
    {
        public void Configure(EntityTypeBuilder<Book> builder)
        {
            builder.HasKey(b => b.Id);

            builder.Property(b => b.Title).IsRequired().HasMaxLength(250);
            builder.Property(b => b.Author).IsRequired().HasMaxLength(150);
            builder.Property(b => b.ISBN).HasMaxLength(20);

            builder.HasMany(b => b.Copies)
                   .WithOne(c => c.Book)
                   .HasForeignKey(c => c.BookId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}