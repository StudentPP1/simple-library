import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservingId, setReservingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Завантаження книг із каталогу
  const fetchBooks = async (searchQuery = '', genreQuery = '') => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (genreQuery) params.genre = genreQuery;

      const response = await api.get('/Books', { params });
      const data = response.data?.data?.items || response.data?.data || response.data || [];
      setBooks(Array.isArray(data) ? data : []);

      // Збираємо список унікальних жанрів для фільтра
      if (!genreQuery && genres.length === 0) {
        const uniqueGenres = [...new Set(data.map((b) => b.genre).filter(Boolean))];
        setGenres(uniqueGenres);
      }
    } catch (error) {
      console.error('Помилка завантаження каталогу:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks(search, selectedGenre);
  };

  const handleReset = () => {
    setSearch('');
    setSelectedGenre('');
    fetchBooks('', '');
  };

  // Обробка бронювання книги читачем (FR-13)
  const handleReserve = async (bookId) => {
    setReservingId(bookId);
    setMessage({ type: '', text: '' });

    try {
      // Спроба відправити запит на бронювання книги
      await api.post(`/Reservations`, { bookId });
      setMessage({ type: 'success', text: 'Книгу успішно заброньовано! Заберіть її в бібліотеці.' });
      fetchBooks(search, selectedGenre); // Оновлюємо статус книг
    } catch (err) {
      // Якщо ендпоінт /Reservations відрізняється, пробуємо резервний ендпоінт /Loans/reserve
      try {
        await api.post(`/Loans/reserve`, { bookId });
        setMessage({ type: 'success', text: 'Книгу успішно заброньовано! Заберіть її в бібліотеці.' });
        fetchBooks(search, selectedGenre);
      } catch (fallbackErr) {
        console.error(fallbackErr);
        setMessage({
          type: 'error',
          text: err.response?.data?.message || fallbackErr.response?.data?.message || 'Не вдалося забронювати книгу. Можливо, немає вільних примірників.',
        });
      }
    } finally {
      setReservingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Каталог книг</h2>

      {/* Сповіщення про статус бронювання */}
      {message.text && (
        <div
          className={`p-4 mb-6 rounded-lg font-medium text-center ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Форма пошуку та фільтрації (FR-12) */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl shadow-md border mb-8 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Пошук за назвою або автором..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Усі жанри</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Шукати
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-gray-600"
          >
            Скинути
          </button>
        </div>
      </form>

      {/* Список книг */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Завантаження каталогів...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Книг за вашим запитом не знайдено.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            const hasAvailableCopies = book.availableCopiesCount > 0 || book.copiesCount > 0;

            return (
              <div key={book.id} className="bg-white p-6 rounded-xl shadow-md border flex flex-col justify-between hover:shadow-lg transition">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {book.genre || 'Без жанру'}
                    </span>
                    <span className="text-xs text-gray-500">{book.publicationYear || '—'} р.</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">{book.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">Автор: <span className="font-medium text-gray-800">{book.author}</span></p>

                  {book.isbn && <p className="text-xs text-gray-400 mb-4">ISBN: {book.isbn}</p>}
                </div>

                <div className="pt-4 border-t flex items-center justify-between mt-auto">
                  <div className="text-xs text-gray-500">
                    Примірників: <span className="font-bold text-gray-700">{book.availableCopiesCount ?? book.copiesCount ?? 1}</span>
                  </div>

                  {/* Кнопка Бронювання (FR-13) */}
                  <button
                    onClick={() => handleReserve(book.id)}
                    disabled={reservingId === book.id || !hasAvailableCopies}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                      !hasAvailableCopies
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : reservingId === book.id
                        ? 'bg-amber-300 text-white cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {!hasAvailableCopies
                      ? 'Немає в наявності'
                      : reservingId === book.id
                      ? 'Бронювання...'
                      : '📌 Забронювати'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}