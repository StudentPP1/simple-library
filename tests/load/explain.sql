-- Плани виконання ключових запитів API (NFR-5). Ті самі SQL, що генерує EF Core.
-- Запуск: docker compose exec -T db psql -U postgres -d SimpleLibraryDb < tests/load/explain.sql
\pset pager off
\echo '=== 1. Пошук: кількість (GET /books?search=море)'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*)::int FROM "Books" AS b
WHERE lower(b."Title" COLLATE "und-x-icu") LIKE '%море%' OR lower(b."Author" COLLATE "und-x-icu") LIKE '%море%';

\echo '=== 2. Пошук: сторінка результатів'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT b."Id", b."Title", (SELECT count(*)::int FROM "BookCopies" AS b0 WHERE b."Id" = b0."BookId" AND b0."Status" = 0)
FROM "Books" AS b
WHERE lower(b."Title" COLLATE "und-x-icu") LIKE '%море%' OR lower(b."Author" COLLATE "und-x-icu") LIKE '%море%'
ORDER BY b."Title", b."Id" LIMIT 10 OFFSET 0;

\echo '=== 3. Фільтр за жанром (GET /books?genre=Роман)'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT b."Id", b."Title", (SELECT count(*)::int FROM "BookCopies" AS b0 WHERE b."Id" = b0."BookId" AND b0."Status" = 0)
FROM "Books" AS b
WHERE lower(b."Genre" COLLATE "und-x-icu") = 'роман'
ORDER BY b."Title", b."Id" LIMIT 10 OFFSET 0;

\echo '=== 4. Каталог, сторінка 3 (GET /books?pageNumber=3)'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT b."Id", b."Title", (SELECT count(*)::int FROM "BookCopies" AS b0 WHERE b."Id" = b0."BookId" AND b0."Status" = 0)
FROM "Books" AS b
ORDER BY b."Title", b."Id" LIMIT 10 OFFSET 20;

\echo '=== 5. Активні видачі та боржники (GET /loans/active)'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT l."Id", l."DueDate", c."InventoryNumber", bk."Title", u."Email"
FROM "Loans" AS l
JOIN "BookCopies" AS c ON l."BookCopyId" = c."Id"
JOIN "Books" AS bk ON c."BookId" = bk."Id"
JOIN "Users" AS u ON l."ReaderId" = u."Id"
WHERE l."Status" IN (0, 1)
ORDER BY l."DueDate";
