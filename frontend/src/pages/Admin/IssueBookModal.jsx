import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function IssueBookModal({ onClose, onSuccess }) {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [availableCopies, setAvailableCopies] = useState([]);
  const [selectedCopyId, setSelectedCopyId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');

  // Завантажуємо список книг та користувачів
  useEffect(() => {
    const loadInitialData = async () => {
      setFetchingData(true);
      try {
        const [booksRes, usersRes] = await Promise.all([
          api.get('/Books'),
          api.get('/Users') // Або відповідний endpoint списку читачів /api/Users або /api/Auth/users
        ]);

        const booksData = booksRes.data?.data?.items || booksRes.data?.data || [];
        const usersData = usersRes.data?.data?.items || usersRes.data?.data || [];

        setBooks(booksData);
        setUsers(usersData);

        // Встановлюємо дефолтну дату повернення (через 14 днів)
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + 14);
        setDueDate(defaultDue.toISOString().split('T')[0]);
      } catch (err) {
        console.error(err);
        setError('Не вдалося завантажити необхідні дані.');
      } finally {
        setFetchingData(false);
      }
    };

    loadInitialData();
  }, []);

  // При виборі книги підвантажуємо вільні примірники
  useEffect(() => {
    if (!selectedBookId) {
      setAvailableCopies([]);
      setSelectedCopyId('');
      return;
    }

    const fetchCopies = async () => {
      try {
        const res = await api.get(`/Books/${selectedBookId}/copies`);
        const copies = res.data?.data || res.data || [];
        // Фільтруємо лише доступні примірники (status === 'Available' або isAvailable === true)
        const freeCopies = copies.filter(c => c.status === 'Available' || c.isAvailable);
        setAvailableCopies(freeCopies);
        if (freeCopies.length > 0) {
          setSelectedCopyId(freeCopies[0].id);
        } else {
          setSelectedCopyId('');
        }
      } catch (err) {
        console.error('Помилка завантаження примірників:', err);
        setAvailableCopies([]);
      }
    };

    fetchCopies();
  }, [selectedBookId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCopyId || !selectedUserId || !dueDate) {
      setError('Будь ласка, заповніть усі обов’язкові поля.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Відправляємо POST-запит на створення видачі (Loans / Issue)
      await api.post('/Loans', {
        bookCopyId: selectedCopyId,
        readerId: selectedUserId,
        dueDate: new Date(dueDate).toISOString()
      });

      onSuccess('Книгу успішно видано читачу!');
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Не вдалося оформити видачу книги.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold text-gray-800">📖 Оформлення видачі книги (FR-5)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
            ✕
          </button>
        </div>

        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        {fetchingData ? (
          <div className="py-8 text-center text-gray-500">Завантаження даних...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Вибір книги */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Виберіть книгу *</label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Оберіть книгу --</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.author})
                  </option>
                ))}
              </select>
            </div>

            {/* Вибір примірника */}
            {selectedBookId && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Доступні примірники *</label>
                {availableCopies.length > 0 ? (
                  <select
                    value={selectedCopyId}
                    onChange={(e) => setSelectedCopyId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableCopies.map((copy) => (
                      <option key={copy.id} value={copy.id}>
                        Примірник №{copy.inventoryNumber || copy.id.substring(0, 8)} (В наявності)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-red-500 italic font-medium">Немає вільних примірників цієї книги.</p>
                )}
              </div>
            )}

            {/* Вибір читача */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Читач (Користувач) *</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Оберіть читача --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.email} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Дата повернення */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Дата повернення (Дедлайн) *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Кнопки */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 transition"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedCopyId}
                className={`px-4 py-2 text-white rounded-md transition ${
                  isLoading || !selectedCopyId ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Оформлення...' : 'Оформити видачу'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}