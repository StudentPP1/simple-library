-- Індекси для NFR-5 (ті самі, що в міграції AddPerformanceIndexes). Для ручного експерименту на тестовій БД.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Пошук: lower(Title/Author COLLATE "und-x-icu") LIKE '%...%' — тільки триграмний GIN-індекс на тому самому виразі
CREATE INDEX IF NOT EXISTS "IX_Books_Title_Trgm" ON "Books" USING gin (lower("Title" COLLATE "und-x-icu") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "IX_Books_Author_Trgm" ON "Books" USING gin (lower("Author" COLLATE "und-x-icu") gin_trgm_ops);

-- Фільтр за жанром + сортування за назвою: індекс віддає рядки вже впорядкованими, LIMIT зупиняє скан
CREATE INDEX IF NOT EXISTS "IX_Books_Genre_Title" ON "Books" (lower("Genre" COLLATE "und-x-icu"), "Title", "Id");

-- Каталог: ORDER BY Title, Id LIMIT/OFFSET без сортування всієї таблиці
CREATE INDEX IF NOT EXISTS "IX_Books_Title_Id" ON "Books" ("Title", "Id");

-- Кількість доступних примірників для кожної книги (Status = 0) — index-only scan
CREATE INDEX IF NOT EXISTS "IX_BookCopies_BookId_Status" ON "BookCopies" ("BookId", "Status");

-- Активні видачі та боржники: частковий індекс лише на Pending/Active (це крихітна частка історії)
CREATE INDEX IF NOT EXISTS "IX_Loans_Active_DueDate" ON "Loans" ("DueDate") WHERE "Status" IN (0, 1);

-- Ліміт «не більше 5 активних книг» перевіряється при кожному бронюванні
CREATE INDEX IF NOT EXISTS "IX_Loans_ReaderId_Status" ON "Loans" ("ReaderId", "Status");

ANALYZE "Books";
ANALYZE "BookCopies";
ANALYZE "Loans";
