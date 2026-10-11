import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function DebtorsModal({ onClose }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('overdue'); // 'overdue' (лише боржники) або 'all' (усі активні)

  // Перевірка, чи прострочена видача
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Кількість днів прострочення
  const getOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today - due;
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const fetchLoans = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/Loans/active');
      const data = response.data?.data?.items || response.data?.data || response.data || [];
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Помилка завантаження активних видач:', err);
      setError('Не вдалося завантажити список видач та боржників.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Фільтрація даних залежно від обраного режиму
  const overdueLoans = loans.filter((loan) => isOverdue(loan.dueDate));
  const displayedLoans = filter === 'overdue' ? overdueLoans : loans;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl border max-h-[85vh] flex flex-col">
        {/* Заголовок та закриття */}
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-800">📋 Боржники та активні видачі </h3>
            <p className="text-xs text-gray-500 mt-0.5">Автоматичний моніторинг прострочених книг</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
            ✕
          </button>
        </div>

        {/* Перемикач фільтрації */}
        <div className="flex items-center justify-between gap-4 mb-4 bg-gray-50 p-2 rounded-lg border">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition ${
                filter === 'overdue'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border hover:bg-gray-100'
              }`}
            >
              ⚠️ Боржники ({overdueLoans.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border hover:bg-gray-100'
              }`}
            >
              📚 Усі активні видачі ({loans.length})
            </button>
          </div>

          <button
            onClick={fetchLoans}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
          >
            🔄 Оновити
          </button>
        </div>

        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        {/* Список боржників / видач */}
        <div className="overflow-y-auto flex-1 pr-1">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Аналіз даних видач...</div>
          ) : displayedLoans.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {filter === 'overdue' ? (
                <p className="text-green-600 font-semibold">🎉 Чудово! Боржників з простроченими книгами немає.</p>
              ) : (
                <p>Наразі немає активних видач у системі.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedLoans.map((loan) => {
                const overdue = isOverdue(loan.dueDate);
                const overdueDays = getOverdueDays(loan.dueDate);

                return (
                  <div
                    key={loan.id}
                    className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                      overdue
                        ? 'bg-red-50 border-red-300 shadow-sm'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">
                          {loan.bookTitle || loan.bookCopy?.book?.title || 'Книга'}
                        </h4>
                        {overdue ? (
                          <span className="text-xs font-extrabold bg-red-200 text-red-900 px-2 py-0.5 rounded-full border border-red-300">
                            Прострочено на {overdueDays} дн.
                          </span>
                        ) : (
                          <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Вчасно
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700">
                        👤 Читач: <span className="font-semibold">{loan.readerName || loan.readerEmail || 'Невідомий'}</span>
                      </p>
                      {loan.readerEmail && (
                        <p className="text-xs text-gray-500">
                          ✉️ Email: <a href={`mailto:${loan.readerEmail}`} className="text-blue-600 hover:underline">{loan.readerEmail}</a>
                        </p>
                      )}
                    </div>

                    <div className="text-right border-t md:border-t-0 pt-2 md:pt-0 flex flex-col md:items-end justify-between">
                      <div className="text-xs text-gray-500">
                        Гранична дата:
                        <span className={`ml-1 font-bold ${overdue ? 'text-red-700 text-sm' : 'text-gray-800'}`}>
                          {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1">
                        Примірник №: {loan.inventoryNumber || loan.bookCopyId || '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Нижня панель */}
        <div className="flex justify-between items-center pt-4 border-t mt-4 text-xs text-gray-500">
          <span>Всього боржників: <strong className="text-red-600">{overdueLoans.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 transition font-medium"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}