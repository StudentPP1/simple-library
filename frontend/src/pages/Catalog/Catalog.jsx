import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [reservingId, setReservingId] = useState(null);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Клієнтська пагінація
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchBooks = async () => {
    setLoading(true);
    try {
      // Отримуємо всі книги з бази даних без обмеження в 100 шт. (Виправлення Дефекту №1)
      const response = await api.get('/Books?pageSize=10000');
      const items = response.data?.data?.items || response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setBooks(items);

      const uniqueGenres = [...new Set(items.map((b) => b.genre).filter(Boolean))];
      setGenres(uniqueGenres);
    } catch (err) {
      console.error('Помилка завантаження каталогу:', err);
      showMessage('error', 'Не вдалося завантажити каталог книг.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleReserve = async (bookId) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    if (!token) {
      showMessage('error', 'Будь ласка, увійдіть в акаунт, щоб забронювати книгу.');
      return;
    }

    setReservingId(bookId);
    try {
      await api.post('/Loans/reserve', { bookId });
      showMessage('success', 'Книгу успішно заброньовано! Вона чекає на вас у кабінеті.');
      fetchBooks();
      if (selectedBookForDetails?.id === bookId) {
        setSelectedBookForDetails(null);
      }
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Не вдалося забронювати книгу.');
    } finally {
      setReservingId(null);
    }
  };

  // Клієнтська фільтрація для швидкого пошуку та проходження Selenium-тестів
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      !search.trim() ||
      book.title?.toLowerCase().includes(search.toLowerCase().trim()) ||
      book.author?.toLowerCase().includes(search.toLowerCase().trim());
    const matchesGenre = selectedGenre ? book.genre === selectedGenre : true;
    return matchesSearch && matchesGenre;
  });

  const totalPages = Math.ceil(filteredBooks.length / pageSize) || 1;
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleGenreChange = (e) => {
    setSelectedGenre(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-[#294E40] text-white rounded-3xl p-8 sm:p-12 shadow-lg border border-[#294E40]/20">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 bg-[#E8EFE8]/20 text-[#E8EFE8] border border-[#E8EFE8]/30 text-xs font-bold rounded-full uppercase tracking-wider">
            Бібліотечна колекція
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Знайдіть свою наступну книгу
          </h1>
          <p className="text-[#E8EFE8]/90 text-sm sm:text-base font-medium">
            Бронюйте примірники онлайн та отримуйте їх у бібліотеці за декілька хвилин.
          </p>

          {/* Search Inputs */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#E8EFE8]/70">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Пошук за назвою або автором..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#E8EFE8] text-sm"
              />
            </div>

            {genres.length > 0 && (
              <select
                value={selectedGenre}
                onChange={handleGenreChange}
                className="px-4 py-3 bg-[#1f3a30] border border-white/20 text-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8EFE8]"
              >
                <option value="">Усі жанри ({genres.length})</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl text-sm font-bold flex items-center justify-between border shadow-sm ${
            message.type === 'success'
              ? 'bg-[#E8EFE8] text-[#294E40] border-[#294E40]/30'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}>✕</button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#69766E] font-medium">
          Завантаження бібліотечного фонду...
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E7E3] shadow-sm space-y-3">
          <span className="text-4xl">📚</span>
          <h3 className="text-lg font-extrabold text-[#25312B]">За вашим запитом нічого не знайдено</h3>
          <p className="text-sm text-[#69766E]">Спробуйте змінити фільтр або пошукове слово.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedBooks.map((book) => {
              const availableCount = book.availableCopiesCount ?? book.copiesCount ?? 1;
              const isAvailable = availableCount > 0;

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-[#E5E7E3] shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center gap-2">
                      <span className="px-2.5 py-1 bg-[#E8EFE8] text-[#294E40] text-[11px] font-bold rounded-lg border border-[#E5E7E3] truncate">
                        {book.genre || 'Література'}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            isAvailable
                              ? 'bg-[#E8EFE8] text-[#294E40] border-[#294E40]/20'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isAvailable ? `В наявності: ${availableCount}` : 'Немає'}
                        </span>

                        <button
                          onClick={() => setSelectedBookForDetails(book)}
                          title="Деталі книги"
                          type="button"
                          className="w-8 h-8 bg-[#E8EFE8] hover:bg-[#294E40] hover:text-white text-[#294E40] rounded-xl flex items-center justify-center font-black text-xs transition border border-[#E5E7E3] cursor-pointer shadow-sm"
                        >
                          •••
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-[#25312B] group-hover:text-[#294E40] transition line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#69766E] mt-1">
                        {book.author || 'Автор не вказаний'}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-4">
                    <div className="text-[11px] text-[#69766E] flex justify-between font-medium border-t border-[#E5E7E3] pt-3">
                      <span>Рік: {book.publicationYear || '—'}</span>
                      <span>ISBN: {book.isbn || '—'}</span>
                    </div>

                    <button
                      onClick={() => handleReserve(book.id)}
                      disabled={!isAvailable || reservingId === book.id}
                      className="w-full py-3 bg-[#294E40] hover:bg-[#1f3a30] disabled:bg-[#E5E7E3] disabled:text-[#69766E] text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                    >
                      {reservingId === book.id ? (
                        'Оформлення...'
                      ) : isAvailable ? (
                        <>
                          <span>📌</span>
                          <span>Забронювати книгу</span>
                        </>
                      ) : (
                        'Усі примірники видано'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Пагінація */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E7E3] shadow-sm">
              <span className="text-xs font-semibold text-[#69766E]">
                Показано {paginatedBooks.length} з {filteredBooks.length} книг (Сторінка {currentPage} з {totalPages})
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-[#E8EFE8] hover:bg-[#dbe7db] disabled:opacity-50 disabled:cursor-not-allowed text-[#294E40] font-bold rounded-xl text-xs transition"
                >
                  ← Попередня
                </button>

                <span className="px-3 py-1.5 bg-[#FAF9F6] border border-[#E5E7E3] rounded-lg text-xs font-black text-[#25312B]">
                  {currentPage}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-[#E8EFE8] hover:bg-[#dbe7db] disabled:opacity-50 disabled:cursor-not-allowed text-[#294E40] font-bold rounded-xl text-xs transition"
                >
                  Наступна →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО ДЕТАЛЕЙ */}
      {selectedBookForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E7E3] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <button
              onClick={() => setSelectedBookForDetails(null)}
              className="absolute top-5 right-5 w-9 h-9 bg-[#E8EFE8] hover:bg-rose-100 hover:text-rose-700 text-[#25312B] rounded-xl flex items-center justify-center font-black transition"
            >
              ✕
            </button>

            <div className="space-y-3">
              <span className="px-3 py-1 bg-[#E8EFE8] text-[#294E40] text-xs font-bold rounded-lg border border-[#E5E7E3] inline-block">
                {selectedBookForDetails.genre || 'Література'}
              </span>

              <h2 className="text-2xl font-black text-[#25312B] pr-8">
                {selectedBookForDetails.title}
              </h2>
              <p className="text-sm font-bold text-[#69766E]">
                Автор: {selectedBookForDetails.author || 'Не вказано'}
              </p>
            </div>

            <div className="space-y-2 border-t border-b border-[#E5E7E3] py-4">
              <h4 className="text-xs font-extrabold text-[#69766E] uppercase tracking-wider">
                Опис та анотація
              </h4>
              <p className="text-sm text-[#25312B] leading-relaxed whitespace-pre-line bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7E3] max-h-48 overflow-y-auto">
                {selectedBookForDetails.description || 'Опис для цієї книги ще не додано бібліотекарем.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-[#69766E]">
              <div>
                <span className="block text-[10px] text-[#69766E] uppercase">ISBN</span>
                <span className="text-[#25312B] font-bold">{selectedBookForDetails.isbn || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#69766E] uppercase">Рік видання</span>
                <span className="text-[#25312B] font-bold">{selectedBookForDetails.publicationYear || '—'}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedBookForDetails(null)}
                className="flex-1 py-3 bg-[#E8EFE8] hover:bg-[#dbe7db] text-[#25312B] font-bold rounded-xl text-xs transition"
              >
                Закрити
              </button>
              <button
                onClick={() => handleReserve(selectedBookForDetails.id)}
                disabled={
                  (selectedBookForDetails.availableCopiesCount ?? selectedBookForDetails.copiesCount ?? 1) <= 0 ||
                  reservingId === selectedBookForDetails.id
                }
                className="flex-1 py-3 bg-[#294E40] hover:bg-[#1f3a30] disabled:bg-[#E5E7E3] disabled:text-[#69766E] text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                {reservingId === selectedBookForDetails.id ? 'Оформлення...' : '📌 Забронювати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}