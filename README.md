# Simple Library

Вебзастосунок для бібліотеки: електронний каталог книг, облік примірників, бронювання, видача та повернення книг, кабінет читача і панель бібліотекаря.

Користувачі мають дві ролі:

- Читач - переглядає каталог, бронює книги, бачить свої видачі та історію читань.
- Бібліотекар - додає та редагує книги, оформлює видачу й повернення, бачить боржників.

## Команда

| Учасник | Роль | Зона відповідальності |
|---|---|---|
| Михайло Макутонін | Team Lead, DevOps | планування спринтів, код-рев'ю, деплой |
| Максим Лосєв | Backend Developer | ASP.NET Core API, бізнес-логіка, база даних |
| Michael Bondarchuk | Frontend Developer | React SPA, інтерфейс читача та бібліотекаря |
| Денис Ренцевич | QA Engineer | тестування, CI (GitHub Actions) |

## Технології

| Частина | Стек |
|---|---|
| Backend | .NET 8, ASP.NET Core Web API, Entity Framework Core 8, JWT, BCrypt, Swagger |
| База даних | PostgreSQL 16 |
| Frontend | React 19, Vite, React Router, Axios, Tailwind CSS |
| Тести | xUnit, Moq, coverlet (юніт-тести та покриття), Postman / Newman (API), Selenium, pytest (E2E), k6 (навантаження), Lighthouse (швидкість сторінок) |
| Інфраструктура | Docker, Docker Compose, GitHub Actions |
| Хмара та моніторинг | Google Cloud Run (бекенд), Cloudflare Pages (фронтенд), Neon (PostgreSQL), UptimeRobot |

## Структура проєкту

```
simple-library/
├── .github/workflows/ci.yml          # збірка й тести 
├── docker-compose.yml               # all services
├── .env.example               # шаблон змінних середовища
├── backend/SimpleLibrary/
│   ├── SimpleLibrary.Core/           # доменний шар
│   │   ├── Models/                  
│   │   ├── Enums/                    
│   │   ├── DTOs/                    
│   │   └── Interfaces/               
│   ├── SimpleLibrary.Application/    # бізнес-логіка
│   ├── SimpleLibrary.DataAccess.Postgres/  # EF Core
│   ├── SimpleLibrary.API/            # контролери, Swagger
│   ├── SimpleLibrary.Application.Tests/    # юніт-тести 
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── pages/                    # Login, Register, Catalog, Dashboard, Admin
    │   ├── services/api.js           # Axios-клієнт
    │   ├── App.jsx                   # маршрутизація
    │   └── main.jsx
    ├── .env.development              
    └── Dockerfile
```

### Архітектура бекенду

Бекенд поділено на шари, залежності спрямовані до ядра:

```
API -> Application -> Core <- DataAccess.Postgres
```

- **Core** тут лежать доменні моделі та інтерфейси (`IBookRepository`, `IAuthService`, `IUnitOfWork` тощо).
- **Application** реалізує бізнес-логіку через інтерфейси з Core і не залежить від EF Core чи ASP.NET.
- **DataAccess.Postgres** реалізує інтерфейси репозиторіїв з Core за допомогою EF Core.
- **API** збирає все разом через DI і відповідає лише за HTTP: маршрути, авторизацію.

Як дотримано принципи SOLID:

| Принцип | Де в коді |
|---|---|
| **S** - єдина відповідальність | кожен класс має свою спеціалізацію: приймає HTTP-запит, працює з БД, генерує токени |
| **O** - відкритість/закритість | кожен шар реєструє свої залежності окремим методом розширення (`AddApplicaсtionLogic`, `AddDataAccess`, `AddApiServices`), тож новий сервіс додається без зміни наявного коду |
| **L** - підстановка Лісков | сервіси працюють з абстракціями репозиторіїв; у тестах їх замінюють моки |
| **I** - розділення інтерфейсів | невеликі окремі інтерфейси: `IUserRepository`, `IBookRepository`, `IAuthService`, `IBookService`, `IJwtTokenGenerator` |
| **D** - інверсія залежностей | Application залежить від інтерфейсів з Core, а не від EF Core; реалізації підставляються через DI |

## Запуск

Потрібен лише [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
cp .env.example .env # у .env задайте власні змінні
```

```bash
docker compose up -d --build
```

Без заповненого `.env` Docker Compose не запуститься й повідомить, якої змінної бракує.

| Сервіс | Адреса |
|---|---|
| Фронтенд | http://localhost:3000 |
| API | http://localhost:5000/api |
| Swagger | http://localhost:5000/swagger |
| Стан сервера | http://localhost:5000/health |

Зупинити: `docker compose down`. 
Видалити разом із даними БД: `docker compose down -v`.

## Інтеграція компонентів

Система складається з трьох компонентів, які взаємодіють через REST API:

```
React SPA (Cloudflare Pages) --HTTPS, JSON, JWT--> ASP.NET Core API (Cloud Run) --EF Core--> PostgreSQL (Neon)
```

- Фронтенд звертається до API лише через Axios-клієнт `frontend/src/services/api.js`. Адресу API задає змінна `VITE_API_URL` під час збірки, JWT-токен додається до кожного запиту.
- API дозволяє запити лише з адрес зі змінної `CORS_ALLOWED_ORIGINS`.
- Бекенд працює з базою через EF Core, міграції застосовуються автоматично під час старту.
- Ендпоінт `/health` перевіряє, що бекенд працює і має з'єднання з базою даних.

Інтеграцію виконано локально через Docker Compose (розділ [Запуск](#запуск)) і в хмарі (розділ [Розгортання](#розгортання)).

## Розгортання

| Компонент | Адреса |
|---|---|
| Сайт | https://simple-library-eja.pages.dev |
| API (Swagger) | https://simple-library-api-39623256372.europe-west1.run.app/swagger/index.html |
| Стан сервера | https://simple-library-api-39623256372.europe-west1.run.app/health |

Розгортання автоматичне:

1. На кожен pull request і push у `main` CI ([ci.yml](.github/workflows/ci.yml)) запускає 6 перевірок: збірку й юніт-тести бекенду, збірку та лінтер фронтенду, API-тести (Newman) і E2E-тести в Chrome, Firefox та Edge.
2. Після злиття в `main` бекенд деплоїться в Google Cloud Run ([deploy-backend.yml](.github/workflows/deploy-backend.yml)): спочатку юніт-тести, потім збірка образу й деплой.
3. Фронтенд збирає та публікує Cloudflare Pages з гілки `main`.

Доступність сайту та API відстежує UptimeRobot.

## Управління залежностями

| Компонент | Файл | Як зафіксовано |
|---|---|---|
| Бекенд | `backend/SimpleLibrary/*/*.csproj` | точні версії NuGet-пакетів; усі пакети EF Core і ASP.NET Core з лінійки 8.0 |
| Фронтенд | `frontend/package.json`, `frontend/package-lock.json` | lock-файл фіксує точні версії, збірка в Docker виконує `npm ci` |
| E2E-тести | `tests/e2e/requirements.txt` | точні версії (`selenium==4.50.0`, `pytest==8.3.4`, `pytest-html==4.1.1`) |
| Середовища | `Dockerfile`, `.github/workflows/*.yml` | .NET 8, Node.js 20/22, Python 3.12, PostgreSQL 16 |

Конфігурація (паролі, ключі, адреси) не зберігається в коді: локально вона в `.env` (шаблон `.env.example`), у хмарі - у змінних середовища Cloud Run і Cloudflare Pages.

## Виконання вимог

Номери вимог відповідають специфікації з лабораторної роботи №1.

### Функціональні вимоги

| Вимога | Де реалізовано | Чим перевірено | Стан |
|---|---|---|---|
| FR-1 Реєстрація | `POST /api/Auth/register`, сторінка `/register` | юніт-тести, Postman, Selenium | виконано |
| FR-2 Вхід і вихід, JWT | `POST /api/Auth/login`, сторінка `/login` | юніт-тести, Postman, Selenium | виконано |
| FR-3 Каталог з посторінковим виведенням, сторінка книги | `GET /api/Books`, `GET /api/Books/{id}`, каталог з нескінченною прокруткою і вікном деталей книги; назва, автор, жанр, опис і ціна (поле `price`) | Postman, Selenium | виконано |
| FR-4 Додавання книг із примірниками | `POST /api/Books`, панель бібліотекаря | юніт-тести, Postman, Selenium | виконано |
| FR-5 Видача примірника читачу | `POST /api/Loans/{id}/issue` | Postman, Selenium | виконано |
| FR-6 Повернення книги | `POST /api/Loans/{id}/return` | Postman, Selenium | виконано |
| FR-7 Статус доступності в каталозі | поле `status` у `GET /api/Books` (`Available`, `Reserved`, `IssuedOut`) і кількість примірників за статусами; бейдж «В наявності: N», «Заброньована» або «Видана» | юніт-тести, Postman, Selenium | виконано |
| FR-8 Книги на руках і дедлайни в кабінеті | `GET /api/Loans/my`, сторінка `/dashboard`; прострочені видачі (поле `isOverdue`) виділяються червоним і позначкою «Прострочено» | Postman, Selenium | виконано |
| FR-9 Розмежування прав за ролями | `[Authorize(Roles = "Librarian")]`, маршрут `/admin` лише для бібліотекаря | Postman (401/403), Selenium | виконано |
| FR-10 Відновлення пароля | `POST /api/Auth/forgot-password`, `POST /api/Auth/reset-password`, лист через SMTP | юніт-тести, Postman | виконано |
| FR-11 Редагування книги | `PUT /api/Books/{id}`: дані книги, ціна та кількість примірників (`copiesCount`); під час зменшення списуються лише вільні примірники | юніт-тести, Postman, Selenium | виконано |
| FR-12 Пошук і фільтр за жанром | параметри `search` і `genre` у `GET /api/Books`, `GET /api/Books/genres` | Postman, Selenium | виконано |
| FR-13 Бронювання | `POST /api/Loans/reserve`, `POST /api/Loans/{id}/cancel`, автоматичне скасування прострочених бронювань | юніт-тести, Postman, Selenium | виконано |
| FR-14 Активні видачі та боржники | `GET /api/Loans/active`, вікно «Боржники» в панелі бібліотекаря | Postman | виконано |
| FR-15 Інтерфейс для читача та бібліотекаря | React SPA: каталог, кабінет, панель бібліотекаря | Selenium | виконано |
| FR-16 Видалення книги | `DELETE /api/Books/{id}` з підтвердженням; книгу, примірник якої виданий, видалити не можна | юніт-тести, Postman | виконано |
| FR-17 Історія читань | `GET /api/Loans/my`, вкладка «Історія» в кабінеті читача: книга, статус, дата видачі та дата повернення | Postman | виконано |

### Нефункціональні вимоги

| Вимога | Як забезпечено | Результат перевірки |
|---|---|---|
| NFR-1 Шифрування даних | паролі хешуються BCrypt, доступ за JWT, HTTPS у хмарі | перевірено Postman і кодом |
| NFR-2 Авторизація та контроль доступу | JWT і ролі Reader / Librarian | Postman: без токена 401, без ролі 403 |
| NFR-3 200+ одночасних користувачів | індекси бази даних для пошуку та видач | k6, 200 користувачів, база на 50 тис. книг: 0 % помилок |
| NFR-4 Доступність 99 % | Cloud Run, Cloudflare Pages, Neon; `/health` | моніторинг UptimeRobot |
| NFR-5 Відповідь до 1 с | серверна пагінація, індекси | k6: 95 % запитів пошуку за 0,054 с, бронювання за 0,062 с |
| NFR-6 Chrome, Edge, Firefox 140+ | React і Tailwind CSS без API, специфічних для одного браузера | E2E-тести в усіх трьох браузерах у CI |
| NFR-7 Різні розміри екранів | адаптивна верстка, бургер-меню на телефоні | Selenium, Lighthouse |
| NFR-8 Завантаження до 2 с | ліниве завантаження сторінок, кешування статичних файлів | Lighthouse: 0,4-0,5 с на комп'ютері, до 1,8 с на телефоні з повільним 4G |

Як запустити тести - у розділі [Тести](#тести), детальні результати - у звіті до лабораторної роботи №6.

## Тести

API- та E2E-тести працюють із системою, запущеною через `docker compose` (розділ [Запуск](#запуск)). CI запускає їх на кожен push і pull request у `main`.

Юніт-тести бекенду можна запустити в Docker, без встановленого .NET SDK:

```bash
docker compose --profile test run --rm --build tests
```

API-тести (Postman-колекція в `tests/api/`) запускаються через Newman. Код бібліотекаря береться з `LIBRARIAN_INVITE_CODE` у `.env`; через спецсимволи в коді його не можна вписати прямо в команду:

```powershell
$code = ((Get-Content .env | Where-Object { $_ -like 'LIBRARIAN_INVITE_CODE=*' }) -split '=', 2)[1]
$envFile = Get-Content tests/api/local.postman_environment.json -Raw -Encoding UTF8 | ConvertFrom-Json
($envFile.values | Where-Object { $_.key -eq 'librarianCode' }).value = $code
$tmp = Join-Path $env:TEMP 'simple-library.postman_environment.json'
$envFile | ConvertTo-Json -Depth 10 | Set-Content $tmp -Encoding UTF8
npx newman run tests/api/SimpleLibrary.postman_collection.json -e $tmp
Remove-Item $tmp
```

Колекцію можна також імпортувати в Postman разом з оточенням `local.postman_environment.json`.

Системні E2E-тести (Selenium + pytest, `tests/e2e/`) проходять сценарії читача й бібліотекаря в реальному браузері: Chrome, Firefox або Edge. Потрібен Python 3.12+, код бібліотекаря тести беруть з `.env`.

```bash
python -m venv tests/e2e/.venv
tests/e2e/.venv/Scripts/pip install -r tests/e2e/requirements.txt
tests/e2e/.venv/Scripts/python -m pytest tests/e2e --browser chrome --html=tests/e2e/reports/report-chrome.html --self-contained-html
```

Навантажувальні тести (k6) і аудит швидкості сторінок (Lighthouse) описані в [tests/load/README.md](tests/load/README.md) і [tests/lighthouse/README.md](tests/lighthouse/README.md).

## Робота з Git

- `main` - стабільна гілка, прямі коміти в неї не робимо.
- Кожна задача ведеться в окремій гілці: `feature/<назва>`, `test/<назва>`, `fix/<назва>`.
- Зміни потрапляють у `main` лише через pull request після код-рев'ю та успішного CI.
- Повідомлення комітів пишемо за [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `test:`, `docs:`.
