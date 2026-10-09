import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Стан для фільтрів пошуку
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  // Допоміжний список жанрів
  const genres = ['Фантастика', 'Детектив', 'Роман', 'Поезія', 'Історія', 'Наука'];

  // Функція завантаження книг з урахуванням фільтрів
  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      // Формуємо query-параметри для GET /api/books
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedGenre) params.genre = selectedGenre;

      const response = await api.get('/Books', { params });

      // Перевіряємо структуру відповіді (PagedResponse або масив)
      const data = response.data?.data?.items || response.data?.data || [];
      setBooks(data);
    } catch (err) {
      console.error(err);
      setError('Не вдалося завантажити каталог книг.');
    } finally {
      setLoading(false);
    }
  };

  // Завантажуємо книги при першому рендері та при зміні жанру
  useEffect(() => {
    fetchBooks();
  }, [selectedGenre]);

  // Обробник відправки форми пошуку
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  // Очищення фільтрів
  const handleReset = () => {
    setSearchTerm('');
    setSelectedGenre('');
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Електронний каталог книг</h2>

      {/* Блок пошуку та фільтрації (FR-12) */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-center">

          {/* Поле пошуку за назвою/автором */}
          <div className="flex-1 w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Пошук за назвою або автором..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Фільтр за жанром */}
          <div className="w-full sm:w-48">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Усі жанри</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Кнопка Шукати */}
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Шукати
          </button>

          {/* Кнопка Скинути */}
          {(searchTerm || selectedGenre) && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
            >
              Скинути
            </button>
          )}
        </form>
      </div>

      {/* Відображення стану завантаження / помилки */}
      {loading && <div className="text-center py-8 text-gray-500">Завантаження книг...</div>}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">{error}</div>}

      {/* Сітка книг */}
      {!loading && !error && (
        books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div key={book.id || book.isbn} className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 mb-2 inline-block">
                  {book.genre || 'Без жанру'}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{book.title}</h3>
                <p className="text-gray-600 text-sm mb-3">Автор: {book.author}</p>

                <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3 mt-auto">
                  <span>Рік: {book.publicationYear || 'N/A'}</span>
                  <span>ISBN: {book.isbn || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            За вашим запитом книг не знайдено.
          </div>
        )
      )}
    </div>
  );
}