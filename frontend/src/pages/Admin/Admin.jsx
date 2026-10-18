import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Admin() {
  const [activeSection, setActiveSection] = useState('books');
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
    description: '',
  });

  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    fetchActiveLoans();
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const isPendingReservation = (status) => status === 'Pending' || status === 'Reserved' || status === 0;
  const isActiveLoan = (status) => status === 'Active' || status === 'Issued' || status === 1;

  const checkIsOverdue = (loan) => {
    if (typeof loan.isOverdue === 'boolean') return loan.isOverdue;
    if (!loan.dueDate || loan.status === 'Returned' || loan.status === 'Cancelled' || loan.status === 2) return false;
    const due = new Date(loan.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const totalBooks = books.length;
  const totalCopies = books.reduce((sum, b) => sum + (b.copiesCount || 1), 0);
  const activeLoansCount = loans.filter((l) => isActiveLoan(l.status)).length;
  const overdueCount = loans.filter((l) => checkIsOverdue(l)).length;

  const resetForm = () => {
    setEditBookId(null);
    setBookForm({
      title: '',
      author: '',
      genre: '',
      isbn: '',
      publicationYear: new Date().getFullYear(),
      copiesCount: 1,
      description: '',
    });
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editBookId) {
        await api.put(`/Books/${editBookId}`, {
          title: bookForm.title,
          author: bookForm.author,
          genre: bookForm.genre,
          isbn: bookForm.isbn,
          publicationYear: Number(bookForm.publicationYear),
          description: bookForm.description,
        });
        showMsg('success', 'Інформацію про книгу успішно оновлено!');
      } else {
        await api.post('/Books', {
          ...bookForm,
          publicationYear: Number(bookForm.publicationYear),
          copiesCount: Number(bookForm.copiesCount),
          description: bookForm.description,
        });
        showMsg('success', 'Нову книгу та її примірники додано!');
      }

      resetForm();
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
      description: book.description || '',
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

  const handleIssueLoan = async (loanId) => {
    try {
      await api.post(`/Loans/${loanId}/issue`, { days: 14 });
      showMsg('success', 'Книгу успішно видано читачу на 14 днів!');
      fetchActiveLoans();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Помилка при оформленні видачі.');
    }
  };

  const handleReturnLoan = async (loanId) => {
    try {
      await api.post(`/Loans/${loanId}/return`);
      showMsg('success', 'Повернення книги успішно зафіксовано!');
      fetchActiveLoans();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Помилка при фіксації повернення.');
    }
  };

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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7E3] pb-6">
        <div>
          <span className="px-2.5 py-1 bg-[#E8EFE8] text-[#294E40] text-xs font-bold rounded-full uppercase tracking-wider">
            Адміністрування
          </span>
          <h1 className="text-3xl font-black text-[#25312B] tracking-tight mt-1">
            Панель бібліотекаря
          </h1>
          <p className="text-sm text-[#69766E] mt-1">
            Управління книжковим фондом, реєстрація видач та контроль дедлайнів
          </p>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between border shadow-sm ${
            message.type === 'success'
              ? 'bg-[#E8EFE8] text-[#294E40] border-[#294E40]/20'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}>✕</button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7E3] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#69766E] uppercase tracking-wider">Унікальних книг</p>
            <p className="text-2xl font-black text-[#25312B] mt-1">{totalBooks}</p>
          </div>
          <div className="w-11 h-11 bg-[#E8EFE8] text-[#294E40] rounded-xl flex items-center justify-center text-xl font-bold">
            📚
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7E3] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#69766E] uppercase tracking-wider">Усього примірників</p>
            <p className="text-2xl font-black text-[#25312B] mt-1">{totalCopies}</p>
          </div>
          <div className="w-11 h-11 bg-[#E8EFE8] text-[#294E40] rounded-xl flex items-center justify-center text-xl font-bold">
            📖
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7E3] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#69766E] uppercase tracking-wider">Книг на руках</p>
            <p className="text-2xl font-black text-[#25312B] mt-1">{activeLoansCount}</p>
          </div>
          <div className="w-11 h-11 bg-[#E8EFE8] text-[#294E40] rounded-xl flex items-center justify-center text-xl font-bold">
            🤝
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7E3] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#69766E] uppercase tracking-wider">Прострочено</p>
            <p className="text-2xl font-black text-rose-700 mt-1">{overdueCount}</p>
          </div>
          <div className="w-11 h-11 bg-rose-50 text-rose-700 rounded-xl flex items-center justify-center text-xl font-bold">
            ⏰
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#E8EFE8] p-1 rounded-xl inline-flex gap-1 border border-[#E5E7E3]">
        <button
          onClick={() => {
            setActiveSection('books');
            fetchBooks();
          }}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition ${
            activeSection === 'books'
              ? 'bg-white text-[#25312B] shadow-sm'
              : 'text-[#69766E] hover:text-[#25312B]'
          }`}
        >
          📚 Керування книгами ({books.length})
        </button>

        <button
          onClick={() => {
            setActiveSection('loans');
            fetchActiveLoans();
          }}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition ${
            activeSection === 'loans'
              ? 'bg-white text-[#25312B] shadow-sm'
              : 'text-[#69766E] hover:text-[#25312B]'
          }`}
        >
          📋 Активні видачі ({loans.length})
        </button>
      </div>

      {/* SECTION 1: BOOKS */}
      {activeSection === 'books' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7E3] space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-[#25312B]">
                {editBookId ? '✏️ Редагувати книгу' : '➕ Додати нову книгу'}
              </h3>
              <p className="text-xs text-[#69766E] mt-0.5">
                Заповніть метадані та детальний опис книги
              </p>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#69766E] uppercase tracking-wider mb-1">
                  Назва книги
                </label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Clean Architecture"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E5E7E3] rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-[#294E40] focus:border-[#294E40] outline-none text-[#25312B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#69766E] uppercase tracking-wider mb-1">
                  Автор
                </label>
                <input
                  type="text"
                  required
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  placeholder="Роберт Мартін"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E5E7E3] rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-[#294E40] focus:border-[#294E40] outline-none text-[#25312B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#69766E] uppercase tracking-wider mb-1">
                  Жанр
                </label>
                <input
                  type="text"
                  required
                  value={bookForm.genre}
                  onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                  placeholder="Програмування"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E5E7E3] rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-[#294E40] focus:border-[#294E40] outline-none text-[#25312B]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-[#69766E] uppercase tracking-wider">
                    Опис книги (опціонально)
                  </label>
                  <span
                    className={`text-[10px] font-bold ${
                      (bookForm.description?.length || 0) >= 2000
                        ? 'text-rose-600'
                        : 'text-[#69766E]'
                    }`}
                  >
                    {bookForm.description?.length || 0} / 2000
                  </span>
                </div>
                <textarea
                  rows="3"
                  maxLength={2000}
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  placeholder="Коротка анотація, про що книга (до 2000 символів)..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E5E7E3] rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-[#294E40] focus:border-[#294E40] outline-none text-[#25312B] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#69766E] uppercase tracking-wider mb-1">
                  ISBN
                </label>
                <input
                  type="text"
                  required
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  placeholder="978-0134494166"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E5E7E3] rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-[#294E40] focus:border-[#294E40] outline-none text-[#25312B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#69766E] uppercase tracking-wider mb-1">
                    Рік видання
                  </label>
                  <input
                    type="number"
                    required
                    value={bookForm.publicationYear}
                    onChange={(e) => setBookForm({ ...bookForm, publicationYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E5E7E3] rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-[#294E40] focus:border-[#294E40] outline-none text-[#25312B]"
                  />
                </div>

                {!editBookId && (
                  <div>
                    <label className="block text-xs font-bold text-[#69766E] uppercase tracking-wider mb-1">
                      Кількість
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={bookForm.copiesCount}
                      onChange={(e) => setBookForm({ ...bookForm, copiesCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E5E7E3] rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-[#294E40] focus:border-[#294E40] outline-none text-[#25312B]"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#294E40] hover:bg-[#1f3a30] text-white font-bold rounded-xl text-sm transition shadow-sm"
                >
                  {editBookId ? 'Зберегти зміни' : 'Додати у фонд'}
                </button>
                {editBookId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-3 bg-[#E8EFE8] hover:bg-[#dbe7db] text-[#25312B] font-bold rounded-xl text-sm transition"
                  >
                    Скасувати
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-[#E5E7E3] overflow-hidden">
            <div className="p-6 border-b border-[#E5E7E3]">
              <h3 className="text-lg font-extrabold text-[#25312B]">Каталог книг у бібліотеці</h3>
              <p className="text-xs text-[#69766E] mt-0.5">Усі зареєстровані найменування фонду</p>
            </div>

            {loadingBooks ? (
              <div className="py-12 text-center text-[#69766E]">Завантаження...</div>
            ) : books.length === 0 ? (
              <div className="py-12 text-center text-[#69766E]">Каталог порожній.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-[#E5E7E3] text-xs font-bold text-[#69766E] uppercase">
                      <th className="py-3.5 px-5">Назва / Автор</th>
                      <th className="py-3.5 px-4">Жанр</th>
                      <th className="py-3.5 px-4">Рік</th>
                      <th className="py-3.5 px-5 text-right">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7E3] text-sm">
                    {books.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FAF9F6]/80 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-[#25312B]">{b.title}</div>
                          <div className="text-xs text-[#69766E] mt-0.5">{b.author || '—'}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-[#E8EFE8] text-[#294E40] text-xs font-bold rounded-lg border border-[#E5E7E3]">
                            {b.genre || 'Література'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-[#69766E] whitespace-nowrap">
                          {b.publicationYear}
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => handleEditClick(b)}
                              className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition"
                              title="Редагувати"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteClick(b.id)}
                              className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Видалити"
                            >
                              🗑️
                            </button>
                          </div>
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

      {/* SECTION 2: LOANS */}
      {activeSection === 'loans' && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7E3] overflow-hidden">
          <div className="p-6 border-b border-[#E5E7E3]">
            <h3 className="text-lg font-extrabold text-[#25312B]">Журнал активних видач</h3>
            <p className="text-xs text-[#69766E] mt-0.5">Обробка замовлень та контроль дедлайнів</p>
          </div>

          {loadingLoans ? (
            <div className="py-12 text-center text-[#69766E]">Завантаження...</div>
          ) : loans.length === 0 ? (
            <div className="py-12 text-center text-[#69766E]">Активних видач немає.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E5E7E3] text-xs font-bold text-[#69766E] uppercase">
                    <th className="py-3.5 px-5">Читач</th>
                    <th className="py-3.5 px-5">Книга</th>
                    <th className="py-3.5 px-4">Статус</th>
                    <th className="py-3.5 px-4">Дедлайн</th>
                    <th className="py-3.5 px-5 text-right">Управління</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7E3] text-sm">
                  {loans.map((loan) => {
                    const overdue = checkIsOverdue(loan);
                    const isPending = isPendingReservation(loan.status);

                    return (
                      <tr key={loan.id} className="hover:bg-[#FAF9F6]/80 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-[#25312B]">{loan.readerName || loan.readerEmail}</div>
                          <div className="text-xs text-[#69766E]">{loan.readerEmail}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-[#25312B]">{loan.bookTitle || loan.book?.title}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                              overdue
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : isPending
                                ? 'bg-[#E8EFE8] text-[#294E40] border-[#294E40]/20'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {overdue ? '⚠️ Прострочено' : isPending ? '📌 Заброньовано' : '📖 На руках'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-[#69766E]">
                          {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('uk-UA') : '—'}
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleIssueLoan(loan.id)}
                                  className="px-3.5 py-1.5 bg-[#294E40] hover:bg-[#1f3a30] text-white rounded-lg text-xs font-bold transition shadow-sm"
                                >
                                  Видати
                                </button>
                                <button
                                  onClick={() => handleCancelLoan(loan.id)}
                                  className="px-3.5 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold transition border border-rose-200"
                                >
                                  Скасувати
                                </button>
                              </>
                            )}
                            {!isPending && (
                              <button
                                onClick={() => handleReturnLoan(loan.id)}
                                className="px-3.5 py-1.5 bg-[#294E40] hover:bg-[#1f3a30] text-white rounded-lg text-xs font-bold transition shadow-sm"
                              >
                                Прийняти повернення
                              </button>
                            )}
                          </div>
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