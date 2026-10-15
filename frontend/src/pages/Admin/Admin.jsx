import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Admin() {
  const [activeSection, setActiveSection] = useState('books'); // 'books' або 'loans'

  // ==========================================
  // СТАН ДЛЯ КЕРУВАННЯ КНИГАМИ
  // ==========================================
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [editBookId, setEditBookId] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: '',
    publicationYear: new Date().getFullYear(),
    copiesCount: 1,
  });

  // ==========================================
  // СТАН ДЛЯ КЕРУВАННЯ ВИДАЧАМИ ТА БОРЖНИКАМИ
  // ==========================================
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Завантаження списку книг
  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const response = await api.get('/Books?pageSize=100');
      const items = response.data?.data?.items || response.data?.data || [];
      setBooks(items);
    } catch (err) {
      console.error('Помилка завантаження книг:', err);
      showMsg('error', 'Не вдалося завантажити каталог книг.');
    } finally {
      setLoadingBooks(false);
    }
  };

  // Завантаження активних видач та заброньованих книг
  const fetchActiveLoans = async () => {
    setLoadingLoans(true);
    try {
      const response = await api.get('/Loans/active');
      setLoans(response.data?.data || []);
    } catch (err) {
      console.error('Помилка завантаження активних видач:', err);
      showMsg('error', 'Не вдалося завантажити список видач.');
    } finally {
      setLoadingLoans(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // ==========================================
  // ХЕЛПЕРІ ДЛЯ СТАТУСІВ ТА ДЕДЛАЙНІВ
  // ==========================================
  const isPendingReservation = (status) => {
    return status === 'Pending' || status === 'Reserved' || status === 0;
  };

  const isActiveLoan = (status) => {
    return status === 'Active' || status === 'Issued' || status === 1;
  };

  const checkIsOverdue = (loan) => {
    if (typeof loan.isOverdue === 'boolean') {
      return loan.isOverdue;
    }
    if (!loan.dueDate || loan.status === 'Returned' || loan.status === 'Cancelled' || loan.status === 2) {
      return false;
    }
    const due = new Date(loan.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // ==========================================
  // ОБРОБНИКИ ДІЙ З КНИГАМИ
  // ==========================================
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editBookId) {
        // Оновлення книги
        await api.put(`/Books/${editBookId}`, {
          title: bookForm.title,
          author: bookForm.author,
          genre: bookForm.genre,
          isbn: bookForm.isbn,
          publicationYear: Number(bookForm.publicationYear),
        });
        showMsg('success', 'Інформацію про книгу успішно оновлено!');
      } else {
        // Створення нової книги
        await api.post('/Books', {
          ...bookForm,
          publicationYear: Number(bookForm.publicationYear),
          copiesCount: Number(bookForm.copiesCount),
        });
        showMsg('success', 'Нову книгу та її примірники додано!');
      }

      setBookForm({
        title: '',
        author: '',
        genre: '',
        isbn: '',
        publicationYear: new Date().getFullYear(),
        copiesCount: 1,
      });
      setEditBookId(null);
      fetchBooks();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Помилка під час збереження книги.');
    }
  };

  const handleEditClick = (book) => {
    setEditBookId(book.id);
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      genre: book.genre || '',
      isbn: book.isbn || '',
      publicationYear: book.publicationYear || new Date().getFullYear(),
      copiesCount: 1,
    });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Ви дійсно бажаєте видалити цю книгу з каталогу?')) return;
    try {
      await api.delete(`/Books/${id}`);
      showMsg('success', 'Книгу успішно видалено.');
      fetchBooks();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Помилка при видаленні книги.');
    }
  };

  // ==========================================
  // ОБРОБНИКИ ДІЙ З ВИДАЧАМИ ТА БРОНЮВАННЯМИ
  // ==========================================
  // [FR-5] Оформлення видачі
  const handleIssueLoan = async (loanId) => {
    try {
      await api.post(`/Loans/${loanId}/issue`, { days: 14 });
      showMsg('success', 'Книгу успішно видано читачу на 14 днів!');
      fetchActiveLoans();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Помилка при оформленні видачі.');
    }
  };

  // [FR-6] Фіксація повернення книги
  const handleReturnLoan = async (loanId) => {
    try {
      await api.post(`/Loans/${loanId}/return`);
      showMsg('success', 'Повернення книги успішно зафіксовано! Примірник знову в наявності.');
      fetchActiveLoans();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Помилка при фіксації повернення.');
    }
  };

  // [FR-13] Скасування бронювання бібліотекарем
  const handleCancelLoan = async (loanId) => {
    if (!window.confirm('Ви дійсно бажаєте скасувати це бронювання?')) return;
    try {
      await api.post(`/Loans/${loanId}/cancel`);
      showMsg('success', 'Бронювання книги успішно скасовано!');
      fetchActiveLoans();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Помилка при скасуванні бронювання.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-3 sm:px-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">⚙️ Панель бібліотекаря</h2>

      {/* Повідомлення про результат операції */}
      {message.text && (
        <div
          className={`p-4 mb-6 rounded-lg text-sm font-semibold flex items-center justify-between ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-sm font-bold opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Перемикач розділів */}
      <div className="flex border-b mb-8 border-gray-200 overflow-x-auto">
        <button
          onClick={() => {
            setActiveSection('books');
            fetchBooks();
          }}
          className={`py-3 px-6 font-bold text-sm whitespace-nowrap transition border-b-2 -mb-px ${
            activeSection === 'books'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📚 Керування книгами
        </button>

        <button
          onClick={() => {
            setActiveSection('loans');
            fetchActiveLoans();
          }}
          className={`py-3 px-6 font-bold text-sm whitespace-nowrap transition border-b-2 -mb-px ${
            activeSection === 'loans'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Активні видачі та боржники
        </button>
      </div>

      {/* ========================================== */}
      {/* РОЗДІЛ 1: КЕРУВАННЯ КНИГАМИ               */}
      {/* ========================================== */}
      {activeSection === 'books' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Форма додання/редагування книги */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-1 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editBookId ? '✏️ Редагувати книгу' : '➕ Додати нову книгу'}
            </h3>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Назва книги</label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Наприклад: 1984"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Автор</label>
                <input
                  type="text"
                  required
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  placeholder="Джордж Орвелл"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Жанр</label>
                <input
                  type="text"
                  required
                  value={bookForm.genre}
                  onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                  placeholder="Антиутопія"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ISBN</label>
                <input
                  type="text"
                  required
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  placeholder="978-0451524935"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Рік видання</label>
                  <input
                    type="number"
                    required
                    value={bookForm.publicationYear}
                    onChange={(e) => setBookForm({ ...bookForm, publicationYear: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {!editBookId && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Примірників</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={bookForm.copiesCount}
                      onChange={(e) => setBookForm({ ...bookForm, copiesCount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow-sm"
                >
                  {editBookId ? 'Зберегти зміни' : 'Створити книгу'}
                </button>
                {editBookId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditBookId(null);
                      setBookForm({
                        title: '',
                        author: '',
                        genre: '',
                        isbn: '',
                        publicationYear: new Date().getFullYear(),
                        copiesCount: 1,
                      });
                    }}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-lg text-sm transition"
                  >
                    Скасувати
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Таблиця наявних книг у бібліотеці */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Наявні книги у фонді</h3>

            {loadingBooks ? (
              <div className="py-8 text-center text-gray-500">Завантаження каталогу...</div>
            ) : books.length === 0 ? (
              <div className="py-8 text-center text-gray-500">Каталог порожній. Додайте першу книгу!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-600">
                      <th className="p-3">Назва / Автор</th>
                      <th className="p-3">Жанр</th>
                      <th className="p-3">Рік</th>
                      <th className="p-3 text-right">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {books.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-bold text-gray-900">{b.title}</div>
                          <div className="text-xs text-gray-500">{b.author}</div>
                        </td>
                        <td className="p-3 text-xs">{b.genre}</td>
                        <td className="p-3 text-xs">{b.publicationYear}</td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEditClick(b)}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-semibold transition"
                            title="Редагувати"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteClick(b.id)}
                            className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold transition"
                            title="Видалити"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* РОЗДІЛ 2: АКТИВНІ ВИДАЧІ ТА БОРЖНИКИ       */}
      {/* ========================================== */}
      {activeSection === 'loans' && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Активні бронювання та видачі</h3>

          {loadingLoans ? (
            <div className="py-8 text-center text-gray-500">Завантаження записів...</div>
          ) : loans.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Немає активних видач або заброньованих книг.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="p-3">Читач</th>
                    <th className="p-3">Книга / Примірник</th>
                    <th className="p-3">Статус</th>
                    <th className="p-3">Дедлайн</th>
                    <th className="p-3 text-right">Управління</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loans.map((loan) => {
                    const overdue = checkIsOverdue(loan);
                    const isPending = isPendingReservation(loan.status);
                    const isActive = isActiveLoan(loan.status);

                    return (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-semibold text-gray-900">{loan.readerName || loan.readerEmail || 'Читач'}</div>
                          <div className="text-xs text-gray-400">{loan.readerEmail}</div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-gray-800">{loan.bookTitle || loan.book?.title || 'Назва книги'}</div>
                          <div className="text-xs text-gray-500">Код: {loan.inventoryNumber || '—'}</div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              overdue
                                ? 'bg-red-100 text-red-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {overdue
                              ? '⚠️ Прострочено'
                              : isPending
                              ? '📌 Заброньовано'
                              : '📖 Видано'}
                          </span>
                        </td>

                        <td className="p-3 text-xs whitespace-nowrap">
                          {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'}
                        </td>

                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          {/* Дії для Заброньованих книг (Pending/Reserved) */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleIssueLoan(loan.id)}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow-sm transition"
                              >
                                Видати читачу
                              </button>

                              <button
                                onClick={() => handleCancelLoan(loan.id)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm transition"
                              >
                                Скасувати бронь
                              </button>
                            </>
                          )}

                          {/* Дії для Виданих/Прострочених книг (Active/Issued/Overdue) */}
                          {(isActive || overdue) && (
                            <button
                              onClick={() => handleReturnLoan(loan.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition"
                            >
                              Прийняти повернення
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}