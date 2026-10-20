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
                CreateBook("Кобзар", "Тарас Шевченко", "Класична література", "978-966-155-325-1", 1840, 3, 450m),
                CreateBook("Тигролови", "Іван Багряний", "Класична література", "978-966-14-1234-5", 1944, 4, 280m),
                CreateBook("Місто", "Валер'ян Підмогильний", "Класична література", "978-966-03-7451-2", 1928, 4, 260m),
                CreateBook("Лісова пісня", "Леся Українка", "Класична література", "978-966-03-7132-0", 1911, 5, 220m),
                CreateBook("Захар Беркут", "Іван Франко", "Класична література", "978-966-10-3184-1", 1883, 3, 240m),
                CreateBook("Тіні забутих предків", "Михайло Коцюбинський", "Класична література", "978-966-03-7463-5", 1911, 2, 210m),
                CreateBook("Чорна рада", "Пантелеймон Куліш", "Класична література", "978-966-03-6852-8", 1857, 2, 250m),
                CreateBook("Кайдашева сім'я", "Іван Нечуй-Левицький", "Класична література", "978-966-03-6852-9", 1879, 6, 230m),
                CreateBook("Хіба ревуть воли, як ясла повні?", "Панас Мирний", "Класична література", "978-966-03-6853-0", 1880, 4, 260m),
                CreateBook("Мартин Боруля", "Іван Карпенко-Карий", "Класична література", "978-966-03-6853-1", 1886, 3, 190m),
                CreateBook("Маленький принц", "Антуан де Сент-Екзюпері", "Класична література", "978-1853261589", 1943, 3, 180m),
                CreateBook("Гордість і упередження", "Джейн Остін", "Класична література", "978-0141439518", 1813, 2, 320m),
                CreateBook("Убити пересмішника", "Гарпер Лі", "Класична література", "978-0060935467", 1960, 5, 350m),
                CreateBook("Сто років самотності", "Габрієль Гарсія Маркес", "Класична література", "978-0060883287", 1967, 3, 390m),

                CreateBook("1984", "Джордж Оруелл", "Фантастика", "978-0451524935", 1949, 5, 300m),
                CreateBook("Дюна", "Френк Герберт", "Фантастика", "978-0441172719", 1965, 4, 420m),
                CreateBook("Соляріс", "Станіслав Лем", "Фантастика", "978-0156027601", 1961, 3, 310m),
                CreateBook("Марсіянин", "Енді Вір", "Фантастика", "978-0553418026", 2011, 6, 380m),
                CreateBook("Фундація", "Айзек Азімов", "Фантастика", "978-0553293357", 1951, 4, 340m),
                CreateBook("Я, робот", "Айзек Азімов", "Фантастика", "978-0553294385", 1950, 3, 290m),

                CreateBook("Гаррі Поттер і філософський камінь", "Дж.К. Роулінг", "Фентезі", "978-0747532699", 1997, 6, 450m),
                CreateBook("Гаррі Поттер і Таємна кімната", "Дж.К. Роулінг", "Фентезі", "978-0747538493", 1998, 5, 450m),
                CreateBook("Володар Перснів: Братство Персня", "Дж.Р.Р. Толкін", "Фентезі", "978-0261102354", 1954, 3, 520m),
                CreateBook("Володар Перснів: Дві вежі", "Дж.Р.Р. Толкін", "Фентезі", "978-0261102361", 1954, 3, 520m),
                CreateBook("Хоббіт", "Дж.Р.Р. Толкін", "Фентезі", "978-0261102217", 1937, 4, 400m),
                CreateBook("Відьмак: Останнє бажання", "Анджей Сапковський", "Фентезі", "978-966-14-9343-6", 1993, 5, 330m),
                CreateBook("Гра престолів", "Джордж Р.Р. Мартін", "Фентезі", "978-0553103540", 1996, 7, 560m),
                CreateBook("Ім'я вітру", "Патрік Ротфусс", "Фентезі", "978-0756404741", 2007, 4, 480m),

                CreateBook("Clean Architecture", "Robert C. Martin", "Програмування", "978-0134494166", 2017, 2, 1250m),
                CreateBook("The Clean Coder", "Robert C. Martin", "Програмування", "978-0137081073", 2011, 2, 980m),
                CreateBook("CLR via C#", "Jeffrey Richter", "Програмування", "978-0735667457", 2012, 2, 1600m),
                CreateBook("C# 12 in a Nutshell", "Joseph Albahari", "Програмування", "978-1098147440", 2023, 3, 1900m),
                CreateBook("Design Patterns", "Erich Gamma, Richard Helm", "Програмування", "978-0201633610", 1994, 2, 1700m),
                CreateBook("Head First Design Patterns", "Eric Freeman", "Програмування", "978-0596007126", 2004, 4, 1350m),
                CreateBook("The Pragmatic Programmer", "Andrew Hunt, David Thomas", "Програмування", "978-0135957059", 1999, 3, 1400m),
                CreateBook("Domain-Driven Design", "Eric Evans", "Програмування", "978-0321125217", 2003, 1, 1800m),
                CreateBook("Refactoring", "Martin Fowler", "Програмування", "978-0134757599", 1999, 2, 1500m),
                CreateBook("Grokking Algorithms", "Aditya Bhargava", "Програмування", "978-1617292231", 2016, 4, 900m),
                CreateBook("Designing Data-Intensive Applications", "Martin Kleppmann", "Програмування", "978-1449373320", 2017, 3, 1650m),
                CreateBook("Code Complete", "Steve McConnell", "Програмування", "978-0735619678", 2004, 2, 1550m)
            };

            await context.Books.AddRangeAsync(books);
            await context.SaveChangesAsync();
        }

        private static Book CreateBook(string title, string author, string genre, string isbn, int year, int copiesCount, decimal price, string? description = null)
        {
            var book = new Book(title, author, genre, isbn, year, description, price);

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
