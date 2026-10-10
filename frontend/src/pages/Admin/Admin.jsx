import { useState, useEffect } from 'react';
import api from '../../services/api';
import EditBookModal from './EditBookModal';
import IssueBookModal from './IssueBookModal';
import ReturnBookModal from './ReturnBookModal';

export default function Admin() {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: '',
    publicationYear: '',
    copiesCount: 1,
  });

  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Стан для відкриття модальних вікон
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Завантаження списку книг
  const fetchBooks = async () => {
    try {
      const response = await api.get('/Books');
      const data = response.data?.data?.items || response.data?.data || [];
      setBooks(data);
    } catch (err) {
      console.error('Помилка завантаження книг:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api.post('/Books', {
        title: formData.title.trim(),
        author: formData.author.trim(),
        genre: formData.genre.trim(),
        isbn: formData.isbn.trim(),
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : 0,
        copiesCount: parseInt(formData.copiesCount),
      });

      setStatus({ type: 'success', message: 'Книгу та примірники успішно додано до каталогу!' });

      setFormData({
        title: '',
        author: '',
        genre: '',
        isbn: '',
        publicationYear: '',
        copiesCount: 1,
      });

      fetchBooks(); // Оновлюємо список після додавання
    } catch (error) {
      console.error('Помилка при збереженні:', error);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Не вдалося додати книгу. Перевірте дані.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">Панель бібліотекаря</h2>

      {/* Повідомлення про статус операцій */}
      {status.message && (
        <div
          className={`p-4 mb-6 rounded-lg font-medium ${
            status.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Форма додавання нової книги (FR-4) */}
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 mb-8">
        <h3 className="text-xl font-semibold mb-6 text-blue-700 border-b pb-2">
          Додати нове надходження (FR-4)
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Назва книги *</label>
              <input
                type="text"
                name="title"
                required
                maxLength="250"
                value={formData.title}
                onChange={handleChange}
                placeholder="Введіть назву книги"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Автор *</label>
              <input
                type="text"
                name="author"
                required
                maxLength="150"
                value={formData.author}
                onChange={handleChange}
                placeholder="Наприклад: Тарас Шевченко"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Жанр</label>
              <input
                type="text"
                name="genre"
                maxLength="100"
                value={formData.genre}
                onChange={handleChange}
                placeholder="Наприклад: Фантастика"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ISBN</label>
              <input
                type="text"
                name="isbn"
                maxLength="20"
                value={formData.isbn}
                onChange={handleChange}
                placeholder="978-3-16-148410-0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Рік видання</label>
              <input
                type="number"
                name="publicationYear"
                min="1000"
                max={new Date().getFullYear()}
                value={formData.publicationYear}
                onChange={handleChange}
                placeholder="Наприклад: 2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Кількість примірників *</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <input
                  type="number"
                  name="copiesCount"
                  min="1"
                  max="100"
                  required
                  value={formData.copiesCount}
                  onChange={handleChange}
                  className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-center"
                />
                <p className="text-sm text-gray-500 italic">
                  Від 1 до 100 фізичних примірників цієї книги. Вони будуть автоматично створені в базі.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg transition duration-200 shadow-md ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {isLoading ? 'Відправка даних...' : '📚 Додати книгу в базу'}
          </button>
        </form>
      </div>

      {/* Список книг для редагування (FR-11) та панель дій (FR-5, FR-6) */}
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Управління книжковим фондом
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="px-3.5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-sm text-sm flex items-center gap-1.5"
            >
              📖 Видати (FR-5)
            </button>
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm text-sm flex items-center gap-1.5"
            >
              📥 Повернути (FR-6)
            </button>
          </div>
        </div>

        {books.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Книг у базі поки немає.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {books.map((book) => (
              <div key={book.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-900">{book.title}</h4>
                  <p className="text-sm text-gray-600">
                    {book.author} | <span className="text-blue-600">{book.genre || 'Без жанру'}</span> | Рік: {book.publicationYear || '—'}
                  </p>
                </div>
                <button
                  onClick={() => setEditingBook(book)}
                  className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition shadow-sm whitespace-nowrap"
                >
                  ✏️ Редагувати
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальне вікно редагування (FR-11) */}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSuccess={(msg) => {
            setStatus({ type: 'success', message: msg });
            fetchBooks();
          }}
        />
      )}

      {/* Модальне вікно видачі книги (FR-5) */}
      {isIssueModalOpen && (
        <IssueBookModal
          onClose={() => setIsIssueModalOpen(false)}
          onSuccess={(msg) => {
            setStatus({ type: 'success', message: msg });
            fetchBooks();
          }}
        />
      )}

      {/* Модальне вікно повернення книги (FR-6) */}
      {isReturnModalOpen && (
        <ReturnBookModal
          onClose={() => setIsReturnModalOpen(false)}
          onSuccess={(msg) => {
            setStatus({ type: 'success', message: msg });
            fetchBooks();
          }}
        />
      )}
    </div>
  );
}