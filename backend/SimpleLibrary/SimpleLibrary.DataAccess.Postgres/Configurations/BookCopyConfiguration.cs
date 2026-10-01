using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.DataAccess.Postgres.Configurations
{
    public class BookCopyConfiguration : IEntityTypeConfiguration<BookCopy>
    {
        public void Configure(EntityTypeBuilder<BookCopy> builder)
        {
            builder.HasKey(c => c.Id);

            builder.Property(c => c.InventoryNumber).IsRequired().HasMaxLength(50);

            builder.HasIndex(c => c.InventoryNumber).IsUnique();
        }
    }
}