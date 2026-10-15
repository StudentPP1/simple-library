using Microsoft.EntityFrameworkCore;
using SimpleLibrary.Core.Models;

namespace SimpleLibrary.DataAccess.Postgres
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(LibraryDbContext context)
        {
            if (await context.Books.AnyAsync())
            {
                return;
            }

            var books = new List<Book>
            {
                // Жанр: Класична література (14 книг)
                CreateBook("Кобзар", "Тарас Шевченко", "Класична література", "978-966-155-325-1", 1840, 3),
                CreateBook("Тигролови", "Іван Багряний", "Класична література", "978-966-14-1234-5", 1944, 4),
                CreateBook("Місто", "Валер'ян Підмогильний", "Класична література", "978-966-03-7451-2", 1928, 4),
                CreateBook("Лісова пісня", "Леся Українка", "Класична література", "978-966-03-7132-0", 1911, 5),
                CreateBook("Захар Беркут", "Іван Франко", "Класична література", "978-966-10-3184-1", 1883, 3),
                CreateBook("Тіні забутих предків", "Михайло Коцюбинський", "Класична література", "978-966-03-7463-5", 1911, 2),
                CreateBook("Чорна рада", "Пантелеймон Куліш", "Класична література", "978-966-03-6852-8", 1857, 2),
                CreateBook("Кайдашева сім'я", "Іван Нечуй-Левицький", "Класична література", "978-966-03-6852-9", 1879, 6),
                CreateBook("Хіба ревуть воли, як ясла повні?", "Панас Мирний", "Класична література", "978-966-03-6853-0", 1880, 4),
                CreateBook("Мартин Боруля", "Іван Карпенко-Карий", "Класична література", "978-966-03-6853-1", 1886, 3),
                CreateBook("Маленький принц", "Антуан де Сент-Екзюпері", "Класична література", "978-1853261589", 1943, 3),
                CreateBook("Гордість і упередження", "Джейн Остін", "Класична література", "978-0141439518", 1813, 2),
                CreateBook("Убити пересмішника", "Гарпер Лі", "Класична література", "978-0060935467", 1960, 5),
                CreateBook("Сто років самотності", "Габрієль Гарсія Маркес", "Класична література", "978-0060883287", 1967, 3),

                // Жанр: Фантастика (6 книг)
                CreateBook("1984", "Джордж Оруелл", "Фантастика", "978-0451524935", 1949, 5),
                CreateBook("Дюна", "Френк Герберт", "Фантастика", "978-0441172719", 1965, 4),
                CreateBook("Соляріс", "Станіслав Лем", "Фантастика", "978-0156027601", 1961, 3),
                CreateBook("Марсіянин", "Енді Вір", "Фантастика", "978-0553418026", 2011, 6),
                CreateBook("Фундація", "Айзек Азімов", "Фантастика", "978-0553293357", 1951, 4),
                CreateBook("Я, робот", "Айзек Азімов", "Фантастика", "978-0553294385", 1950, 3),

                // Жанр: Фентезі (8 книг)
                CreateBook("Гаррі Поттер і філософський камінь", "Дж.К. Роулінг", "Фентезі", "978-0747532699", 1997, 6),
                CreateBook("Гаррі Поттер і Таємна кімната", "Дж.К. Роулінг", "Фентезі", "978-0747538493", 1998, 5),
                CreateBook("Володар Перснів: Братство Персня", "Дж.Р.Р. Толкін", "Фентезі", "978-0261102354", 1954, 3),
                CreateBook("Володар Перснів: Дві вежі", "Дж.Р.Р. Толкін", "Фентезі", "978-0261102361", 1954, 3),
                CreateBook("Хоббіт", "Дж.Р.Р. Толкін", "Фентезі", "978-0261102217", 1937, 4),
                CreateBook("Відьмак: Останнє бажання", "Анджей Сапковський", "Фентезі", "978-966-14-9343-6", 1993, 5),
                CreateBook("Гра престолів", "Джордж Р.Р. Мартін", "Фентезі", "978-0553103540", 1996, 7),
                CreateBook("Ім'я вітру", "Патрік Ротфусс", "Фентезі", "978-0756404741", 2007, 4),

                // Жанр: Програмування (12 книг)
                CreateBook("Clean Architecture", "Robert C. Martin", "Програмування", "978-0134494166", 2017, 2),
                CreateBook("The Clean Coder", "Robert C. Martin", "Програмування", "978-0137081073", 2011, 2),
                CreateBook("CLR via C#", "Jeffrey Richter", "Програмування", "978-0735667457", 2012, 2),
                CreateBook("C# 12 in a Nutshell", "Joseph Albahari", "Програмування", "978-1098147440", 2023, 3),
                CreateBook("Design Patterns", "Erich Gamma, Richard Helm", "Програмування", "978-0201633610", 1994, 2),
                CreateBook("Head First Design Patterns", "Eric Freeman", "Програмування", "978-0596007126", 2004, 4),
                CreateBook("The Pragmatic Programmer", "Andrew Hunt, David Thomas", "Програмування", "978-0135957059", 1999, 3),
                CreateBook("Domain-Driven Design", "Eric Evans", "Програмування", "978-0321125217", 2003, 1),
                CreateBook("Refactoring", "Martin Fowler", "Програмування", "978-0134757599", 1999, 2),
                CreateBook("Grokking Algorithms", "Aditya Bhargava", "Програмування", "978-1617292231", 2016, 4),
                CreateBook("Designing Data-Intensive Applications", "Martin Kleppmann", "Програмування", "978-1449373320", 2017, 3),
                CreateBook("Code Complete", "Steve McConnell", "Програмування", "978-0735619678", 2004, 2)
            };


            await context.Books.AddRangeAsync(books);
            await context.SaveChangesAsync();
        }

        private static Book CreateBook(string title, string author, string genre, string isbn, int year, int copiesCount)
        {
            var book = new Book(title, author, genre, isbn, year);

            for (int i = 0; i < copiesCount; i++)
            {
                string invNumber = $"INV-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
                var copy = new BookCopy(book.Id, invNumber);
                book.AddCopy(copy);
            }

            return book;
        }
    }
}
