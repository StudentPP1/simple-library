import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({ id: null, type: '', text: '' });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (genre.trim()) params.genre = genre.trim();

      const response = await api.get('/Books', { params });

      // Розпаковуємо ApiResponse<PagedResponse<BookResponse>>
      const pagedData = response.data?.data;
      const items = pagedData?.items || (Array.isArray(pagedData) ? pagedData : []);

      setBooks(items);
    } catch (err) {
      console.error('Помилка завантаження каталогу:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleReset = () => {
    setSearch('');
    setGenre('');
    setTimeout(() => {
      fetchBooks();
    }, 50);
  };

  const handleReserve = async (book) => {
    setActionMessage({ id: book.id, type: 'info', text: 'Обробка бронювання...' });

    try {
      const response = await api.post('/Loans/reserve', {
        bookId: book.id
      });

      if (response.data?.success) {
        setActionMessage({ id: book.id, type: 'success', text: 'Книгу успішно заброньовано!' });
      } else {
        setActionMessage({
          id: book.id,
          type: 'error',
          text: response.data?.message || 'Не вдалося забронювати книгу.'
        });
      }
    } catch (err) {
      setActionMessage({
        id: book.id,
        type: 'error',
        text: err.response?.data?.message || 'Помилка під час бронювання.'
      });
    }

    setTimeout(() => {
      setActionMessage({ id: null, type: '', text: '' });
    }, 4000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Каталог книг</h2>

      {/* Форма пошуку */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl shadow-md mb-8 border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук за назвою або автором..."
          className="flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />

        <input
          type="text"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="Жанр"
          className="w-full sm:w-48 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="submit"
            className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Шукати
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Скинути
          </button>
        </div>
      </form>

      {/* Список книг */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Завантаження каталогу...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border p-8">
          Книг за вашим запитом не знайдено.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {book.genre || 'Без жанру'}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-3 mb-1">{book.title}</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Автор: <span className="font-semibold text-gray-800">{book.author}</span>
                </p>
                <div className="text-xs text-gray-400 space-y-1 mb-4">
                  <p>Рік видання: {book.publicationYear || '—'}</p>
                  <p>ISBN: {book.isbn || '—'}</p>
                </div>
              </div>

              <div>
                {actionMessage.id === book.id && (
                  <div className={`p-2 mb-3 text-xs rounded font-medium ${
                    actionMessage.type === 'success' ? 'bg-green-100 text-green-800' :
                    actionMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {actionMessage.text}
                  </div>
                )}

                <button
                  onClick={() => handleReserve(book)}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition shadow-sm text-sm"
                >
                  📌 Забронювати книгу
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}