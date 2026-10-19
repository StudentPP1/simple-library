-- Наповнення БД реалістичним обсягом даних для перевірки NFR-5 (час відповіді < 1 с).
-- 50 000 книг, 150 000 примірників, 5 000 читачів, 200 000 записів в історії видач.
-- ЛИШЕ для локальної/тестової бази! Запуск:
--   docker compose exec -T db psql -U postgres -d SimpleLibraryDb < tests/load/seed-large.sql
BEGIN;

INSERT INTO "Books" ("Id", "Title", "Author", "Genre", "ISBN", "PublicationYear", "Description")
SELECT gen_random_uuid(),
       (ARRAY['Тіні','Світло','Дорога','Місто','Пісня','Таємниця','Історія','Сад','Море','Вітер'])[1 + i % 10]
         || ' ' || (ARRAY['забутих предків','над Дніпром','без кінця','у пітьмі','старого замку','і час','двох світів','на світанку'])[1 + (i / 10) % 8]
         || ' №' || i,
       (ARRAY['Шевченко Т.','Франко І.','Українка Л.','Коцюбинський М.','Стус В.','Жадан С.','Андрухович Ю.','Забужко О.','Kafka F.','Orwell G.'])[1 + (i / 7) % 10],
       (ARRAY['Роман','Поезія','Фантастика','Історія','Детектив','Наука','Програмування','Філософія','Драма','Дитяча'])[1 + (i / 3) % 10],
       '978-' || lpad(i::text, 9, '0'),
       1900 + i % 125,
       'Згенерована книга для навантажувального тестування'
FROM generate_series(1, 50000) AS i;

INSERT INTO "BookCopies" ("Id", "BookId", "InventoryNumber", "Status")
SELECT gen_random_uuid(), b."Id", 'LOAD-' || substr(b."ISBN", 5) || '-' || c, 0
FROM "Books" b
CROSS JOIN generate_series(1, 3) AS c
WHERE b."ISBN" LIKE '978-0%' AND b."Description" = 'Згенерована книга для навантажувального тестування';

-- Читачі для історії видач (пароль ніде не використовується — вхід під ними неможливий)
INSERT INTO "Users" ("Id", "Email", "FullName", "PasswordHash", "Role")
SELECT gen_random_uuid(), 'history.reader.' || i || '@seed.local', 'Читач історії ' || i, '!seed-no-login', 0
FROM generate_series(1, 5000) AS i;

-- Історія: 200 000 повернених видач (Status = 2 Returned)
INSERT INTO "Loans" ("Id", "BookCopyId", "ReaderId", "ReservedAt", "IssuedAt", "DueDate", "ReturnedAt", "Status")
SELECT gen_random_uuid(), c."Id", u."Id",
       now() - (n || ' days')::interval - interval '1 day',
       now() - (n || ' days')::interval,
       now() - (n || ' days')::interval + interval '14 days',
       now() - (n || ' days')::interval + interval '10 days',
       2
FROM (SELECT row_number() OVER () AS rn, "Id" FROM "BookCopies" WHERE "InventoryNumber" LIKE 'LOAD-%') c
JOIN (SELECT row_number() OVER () AS rn, "Id" FROM "Users" WHERE "Email" LIKE 'history.reader.%@seed.local') u
  ON u.rn = 1 + (c.rn % 5000)
CROSS JOIN LATERAL (SELECT (c.rn % 700) + 15 AS n) d
CROSS JOIN generate_series(1, 2) AS rep
WHERE c.rn <= 100000;

COMMIT;
ANALYZE;

SELECT (SELECT count(*) FROM "Books") AS books, (SELECT count(*) FROM "BookCopies") AS copies,
       (SELECT count(*) FROM "Users") AS users, (SELECT count(*) FROM "Loans") AS loans;
