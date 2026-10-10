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
| Денис Ренцевич | QA Engineer, DevOps | тестування, CI (GitHub Actions), деплой |

## Технології

| Частина | Стек |
|---|---|
| Backend | .NET 8, ASP.NET Core Web API, Entity Framework Core 8, JWT, BCrypt, Swagger |
| База даних | PostgreSQL 16 |
| Frontend | React 19, Vite, React Router, Axios, Tailwind CSS |
| Тести | xUnit, Moq |
| Інфраструктура | Docker, Docker Compose, GitHub Actions |

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

Міграції бази даних застосовуються автоматично під час старту бекенду.

Зупинити: `docker compose down`. 
Видалити разом із даними БД: `docker compose down -v`.

## Тести

Юніт-тести бекенду можна запустити в Docker, без встановленого .NET SDK:

```bash
docker compose --profile test run --rm --build tests
```

CI (GitHub Actions) на кожен push і pull request у `main` збирає й тестує бекенд, а також збирає та перевіряє лінтером фронтенд.

## Робота з Git

- `main` - стабільна гілка, прямі коміти в неї не робимо.
- Кожна задача ведеться в окремій гілці: `feature/<назва>`, `test/<назва>`, `fix/<назва>`.
- Зміни потрапляють у `main` лише через pull request після код-рев'ю та успішного CI.
- Повідомлення комітів пишемо за [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `test:`, `docs:`.

## Посилання та деплой
+ реєстрація [читатача](https://simple-library-eja.pages.dev/register)
+ реєстрація [бібліотекаря](https://simple-library-eja.pages.dev/register?secret_key=8bHoiGdP4SMPTAHEQuOZDYRyIm0UE4cs)
+ [swagger](https://simple-library-api-39623256372.europe-west1.run.app/swagger/index.html)

Пострес база на Neon, front автоматично підтягується з main, backend через github a