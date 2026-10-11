import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' або 'history'
  const [activeLoans, setActiveLoans] = useState([]);
  const [historyLoans, setHistoryLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Завантажуємо активні видачі
  const fetchActiveLoans = async () => {
    try {
      const response = await api.get('/Loans/my');
      const data = response.data?.data?.items || response.data?.data || response.data || [];
      setActiveLoans(Array.isArray(data) ? data.filter((l) => l.status !== 'Returned') : []);
    } catch (err) {
      try {
        const fallbackRes = await api.get('/Loans/me');
        const fallbackData = fallbackRes.data?.data?.items || fallbackRes.data?.data || fallbackRes.data || [];
        setActiveLoans(Array.isArray(fallbackData) ? fallbackData.filter((l) => l.status !== 'Returned') : []);
      } catch (fallbackErr) {
        console.error('Помилка завантаження активних видач:', fallbackErr);
      }
    }
  };

  // Завантажуємо історію закритих видач
  const fetchHistoryLoans = async () => {
    try {
      const response = await api.get('/Loans/history');
      const data = response.data?.data?.items || response.data?.data || response.data || [];
      setHistoryLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      try {
        const fallbackRes = await api.get('/Loans/my/history');
        const fallbackData = fallbackRes.data?.data?.items || fallbackRes.data?.data || fallbackRes.data || [];
        setHistoryLoans(Array.isArray(fallbackData) ? fallbackData : []);
      } catch (fallbackErr) {
        try {
          const myRes = await api.get('/Loans/my');
          const myData = myRes.data?.data?.items || myRes.data?.data || myRes.data || [];
          setHistoryLoans(
            Array.isArray(myData) ? myData.filter((l) => l.status === 'Returned' || l.returnedAt) : []
          );
        } catch (myErr) {
          console.error('Помилка завантаження історії читань:', myErr);
        }
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    await Promise.all([fetchActiveLoans(), fetchHistoryLoans()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Returned') return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getDaysLeft = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Мій кабінет</h2>
          <p className="text-gray-600 text-sm mt-1">
            Поточні книги на руках та історія прочитаних книг
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition text-sm self-start md:self-auto flex items-center gap-2"
        >
          🔄 Оновити дані
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Перемикач вкладок */}
      <div className="flex border-b mb-6 border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 px-6 font-bold text-sm transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📖 Поточні книги на руках
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-semibold">
            {activeLoans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-6 font-bold text-sm transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📜 Історія читань
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full font-semibold">
            {historyLoans.length}
          </span>
        </button>
      </div>

      {/* Вкладка 1: Поточні книги */}
      {activeTab === 'active' && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Завантаження ваших книг...</div>
          ) : activeLoans.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-lg font-medium text-gray-700 mb-2">У вас немає активних книг на руках</p>
              <p className="text-sm text-gray-400">Перейдіть у каталог, щоб забронювати або обрати нову книгу.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeLoans.map((loan) => {
                const overdue = isOverdue(loan.dueDate, loan.status);
                const daysLeft = getDaysLeft(loan.dueDate);

                return (
                  <div
                    key={loan.id}
                    className={`p-5 rounded-xl border transition shadow-sm relative flex flex-col justify-between ${
                      overdue
                        ? 'bg-red-50 border-red-300 shadow-red-100'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            overdue
                              ? 'bg-red-200 text-red-900 border border-red-300'
                              : loan.status === 'Reserved'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {overdue
                            ? '⚠️ Прострочено'
                            : loan.status === 'Reserved'
                            ? '📌 Заброньовано'
                            : '📖 На руках'}
                        </span>

                        {loan.issuedAt && (
                          <span className="text-xs text-gray-400">
                            Видано: {new Date(loan.issuedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {loan.bookTitle || loan.bookCopy?.book?.title || 'Назва книги'}
                      </h4>

                      <p className="text-sm text-gray-600 mb-4">
                        Автор: <span className="font-medium text-gray-800">{loan.bookAuthor || loan.bookCopy?.book?.author || '—'}</span>
                      </p>
                    </div>

                    <div
                      className={`pt-3 border-t mt-auto flex items-center justify-between text-sm ${
                        overdue ? 'border-red-200 text-red-800 font-bold' : 'border-gray-100 text-gray-700'
                      }`}
                    >
                      <span>Дата повернення:</span>
                      <div className="text-right">
                        <span className="text-base font-extrabold">
                          {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'}
                        </span>
                        {daysLeft !== null && (
                          <div className={`text-xs font-medium mt-0.5 ${overdue ? 'text-red-700' : 'text-gray-500'}`}>
                            {overdue
                              ? `Прострочено на ${Math.abs(daysLeft)} дн.`
                              : daysLeft === 0
                              ? 'Сьогодні останній день!'
                              : `Залишилось ${daysLeft} дн.`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Вкладка 2: Історія читань */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center gap-2">
            📜 Усі прочитані книги
            <span className="text-sm font-normal text-gray-500">
              ({historyLoans.length})
            </span>
          </h3>

          {loading ? (
            <div className="py-12 text-center text-gray-500">Завантаження історії...</div>
          ) : historyLoans.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-lg font-medium text-gray-700 mb-2">Історія читань порожня</p>
              <p className="text-sm text-gray-400">Тут відображатимуться всі закриті видачі після повернення книг.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {historyLoans.map((loan) => (
                <div key={loan.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      {loan.bookTitle || loan.bookCopy?.book?.title || 'Назва книги'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Автор: <span className="font-medium text-gray-800">{loan.bookAuthor || loan.bookCopy?.book?.author || '—'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border">
                    <div>
                      📅 Видано: <strong className="text-gray-700">{loan.issuedAt ? new Date(loan.issuedAt).toLocaleDateString() : '—'}</strong>
                    </div>
                    <div className="text-green-700">
                      ✅ Повернуто: <strong>{loan.returnedAt || loan.actualReturnDate ? new Date(loan.returnedAt || loan.actualReturnDate).toLocaleDateString() : '—'}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}