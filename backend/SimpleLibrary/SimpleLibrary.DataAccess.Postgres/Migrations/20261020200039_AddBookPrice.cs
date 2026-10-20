using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SimpleLibrary.DataAccess.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class AddBookPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Books",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            // Ціни для книг з початкового наповнення бази (DbSeeder), які вже є в базі
            migrationBuilder.Sql(@"
                UPDATE ""Books"" AS b SET ""Price"" = v.price
                FROM (VALUES
                    ('978-966-155-325-1', 450),
                    ('978-966-14-1234-5', 280),
                    ('978-966-03-7451-2', 260),
                    ('978-966-03-7132-0', 220),
                    ('978-966-10-3184-1', 240),
                    ('978-966-03-7463-5', 210),
                    ('978-966-03-6852-8', 250),
                    ('978-966-03-6852-9', 230),
                    ('978-966-03-6853-0', 260),
                    ('978-966-03-6853-1', 190),
                    ('978-1853261589', 180),
                    ('978-0141439518', 320),
                    ('978-0060935467', 350),
                    ('978-0060883287', 390),
                    ('978-0451524935', 300),
                    ('978-0441172719', 420),
                    ('978-0156027601', 310),
                    ('978-0553418026', 380),
                    ('978-0553293357', 340),
                    ('978-0553294385', 290),
                    ('978-0747532699', 450),
                    ('978-0747538493', 450),
                    ('978-0261102354', 520),
                    ('978-0261102361', 520),
                    ('978-0261102217', 400),
                    ('978-966-14-9343-6', 330),
                    ('978-0553103540', 560),
                    ('978-0756404741', 480),
                    ('978-0134494166', 1250),
                    ('978-0137081073', 980),
                    ('978-0735667457', 1600),
                    ('978-1098147440', 1900),
                    ('978-0201633610', 1700),
                    ('978-0596007126', 1350),
                    ('978-0135957059', 1400),
                    ('978-0321125217', 1800),
                    ('978-0134757599', 1500),
                    ('978-1617292231', 900),
                    ('978-1449373320', 1650),
                    ('978-0735619678', 1550)
                ) AS v(isbn, price)
                WHERE b.""ISBN"" = v.isbn AND b.""Price"" IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price",
                table: "Books");
        }
    }
}
