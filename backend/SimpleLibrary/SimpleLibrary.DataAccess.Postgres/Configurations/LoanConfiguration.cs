using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.DataAccess.Postgres.Configurations
{
    public class LoanConfiguration : IEntityTypeConfiguration<Loan>
    {
        public void Configure(EntityTypeBuilder<Loan> builder)
        {
            builder.HasKey(l => l.Id);

            builder.HasOne(l => l.Reader)
                   .WithMany(u => u.Loans)
                   .HasForeignKey(l => l.ReaderId)
                   .OnDelete(DeleteBehavior.Restrict); 

            builder.HasOne(l => l.BookCopy)
                   .WithMany(c => c.Loans)
                   .HasForeignKey(l => l.BookCopyId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(l => l.IssuedBy)
                   .WithMany()
                   .HasForeignKey(l => l.IssuedByUserId)
                   .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(l => l.ReturnedBy)
                   .WithMany()
                   .HasForeignKey(l => l.ReturnedByUserId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}