import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [reservingId, setReservingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/Books?pageSize=100');
      const items = response.data?.data?.items || response.data?.data || [];
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
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Не вдалося забронювати книгу.');
    } finally {
      setReservingId(null);
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.author?.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre ? book.genre === selectedGenre : true;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner in Forest Green */}
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук за назвою або автором..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#E8EFE8] text-sm"
              />
            </div>

            {genres.length > 0 && (
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
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

      {/* Book Grid */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const availableCount = book.availableCopiesCount ?? book.copiesCount ?? 1;
            const isAvailable = availableCount > 0;

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-[#E5E7E3] shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    {/* Soft Sage Badge */}
                    <span className="px-2.5 py-1 bg-[#E8EFE8] text-[#294E40] text-[11px] font-bold rounded-lg border border-[#E5E7E3]">
                      {book.genre || 'Література'}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                        isAvailable
                          ? 'bg-[#E8EFE8] text-[#294E40] border-[#294E40]/20'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isAvailable ? `В наявності: ${availableCount}` : 'Немає в наявності'}
                    </span>
                  </div>

                  <div>
                    {/* Charcoal title */}
                    <h3 className="text-lg font-black text-[#25312B] group-hover:text-[#294E40] transition line-clamp-2">
                      {book.title}
                    </h3>
                    {/* Muted Green author */}
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

                  {/* Forest Green Button */}
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
      )}
    </div>
  );
}