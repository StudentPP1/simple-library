using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SimpleLibrary.DataAccess.Postgres.Migrations
{
    /// <summary>
    /// Індекси для NFR-5 (час відповіді &lt; 1 с). Навантажувальний тест на 50 000 книг і 200 користувачах
    /// показав p95 пошуку 8,95 с через повний перебір таблиць (tests/load/README.md).
    /// Пошук робить lower(col COLLATE "und-x-icu") LIKE '%...%', тому потрібні триграмні GIN-індекси саме
    /// на цьому виразі — їх не можна описати через HasIndex, тому міграція на сирому SQL.
    /// </summary>
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            migrationBuilder.Sql("""CREATE INDEX IF NOT EXISTS "IX_Books_Title_Trgm" ON "Books" USING gin (lower("Title" COLLATE "und-x-icu") gin_trgm_ops);""");
            migrationBuilder.Sql("""CREATE INDEX IF NOT EXISTS "IX_Books_Author_Trgm" ON "Books" USING gin (lower("Author" COLLATE "und-x-icu") gin_trgm_ops);""");
            migrationBuilder.Sql("""CREATE INDEX IF NOT EXISTS "IX_Books_Genre_Title" ON "Books" (lower("Genre" COLLATE "und-x-icu"), "Title", "Id");""");
            migrationBuilder.Sql("""CREATE INDEX IF NOT EXISTS "IX_Books_Title_Id" ON "Books" ("Title", "Id");""");

            migrationBuilder.Sql("""CREATE INDEX IF NOT EXISTS "IX_BookCopies_BookId_Status" ON "BookCopies" ("BookId", "Status");""");

            // Частковий індекс: активних видач (Pending = 0, Active = 1) — крихітна частка всієї історії
            migrationBuilder.Sql("""CREATE INDEX IF NOT EXISTS "IX_Loans_Active_DueDate" ON "Loans" ("DueDate") WHERE "Status" IN (0, 1);""");
            migrationBuilder.Sql("""CREATE INDEX IF NOT EXISTS "IX_Loans_ReaderId_Status" ON "Loans" ("ReaderId", "Status");""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Loans_ReaderId_Status";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Loans_Active_DueDate";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_BookCopies_BookId_Status";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Books_Title_Id";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Books_Genre_Title";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Books_Author_Trgm";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Books_Title_Trgm";""");
        }
    }
}
