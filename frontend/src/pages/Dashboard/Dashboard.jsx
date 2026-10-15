import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('active');
  const [activeLoans, setActiveLoans] = useState([]);
  const [historyLoans, setHistoryLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({ id: null, text: '', type: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/Loans/my');
      const loans = response.data?.data || [];

      // Активні видачі та бронювання (крім повернутих та скасованих)
      setActiveLoans(
        loans.filter(
          (l) =>
            l.status !== 'Returned' &&
            l.status !== 'Cancelled' &&
            l.status !== 2 &&
            !l.returnedAt
        )
      );

      // Історія прочитаних та скасованих книг
      setHistoryLoans(
        loans.filter(
          (l) =>
            l.status === 'Returned' ||
            l.status === 'Cancelled' ||
            l.status === 2 ||
            l.returnedAt
        )
      );
    } catch (err) {
      console.error('Помилка завантаження видач користувача:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Скасування бронювання читачем
  const handleCancelReservation = async (loanId) => {
    if (!window.confirm('Ви дійсно бажаєте скасувати бронювання цієї книги?')) return;

    setActionMsg({ id: loanId, text: 'Скасування...', type: 'info' });
    try {
      const response = await api.post(`/Loans/${loanId}/cancel`);
      if (response.data?.success !== false) {
        setActionMsg({ id: loanId, text: 'Бронювання успішно скасовано!', type: 'success' });
        setTimeout(() => {
          setActionMsg({ id: null, text: '', type: '' });
          loadData();
        }, 1200);
      }
    } catch (err) {
      setActionMsg({
        id: loanId,
        text: err.response?.data?.message || 'Не вдалося скасувати бронювання.',
        type: 'error',
      });
      setTimeout(() => setActionMsg({ id: null, text: '', type: '' }), 3000);
    }
  };

  const checkIsOverdue = (loan) => {
    if (typeof loan.isOverdue === 'boolean') return loan.isOverdue;
    if (!loan.dueDate || loan.status === 'Returned' || loan.status === 'Cancelled') return false;
    const due = new Date(loan.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isPendingReservation = (status) => {
    return status === 'Pending' || status === 'Reserved' || status === 0;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Мій кабінет</h2>
          <p className="text-gray-600 text-sm mt-1">
            Поточні книги на руках та заброньовані примірники
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition text-sm flex items-center gap-2"
        >
          🔄 Оновити дані
        </button>
      </div>

      {/* Вкладки */}
      <div className="flex border-b mb-6 border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 px-6 font-bold text-sm transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📖 Поточні книги / Бронювання
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
          📜 Історія
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full font-semibold">
            {historyLoans.length}
          </span>
        </button>
      </div>

      {/* Контент активних книг */}
      {activeTab === 'active' && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Завантаження...</div>
          ) : activeLoans.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              У вас немає активних замовлень чи книг на руках.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeLoans.map((loan) => {
                const overdue = checkIsOverdue(loan);
                const isPending = isPendingReservation(loan.status);

                return (
                  <div
                    key={loan.id}
                    className={`p-5 rounded-xl border transition shadow-sm flex flex-col justify-between ${
                      overdue
                        ? 'bg-red-50 border-red-300'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            overdue
                              ? 'bg-red-200 text-red-900'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {overdue
                            ? '⚠️ Прострочено'
                            : isPending
                            ? '📌 Заброньовано'
                            : '📖 На руках'}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {loan.bookTitle || loan.book?.title || 'Назва книги'}
                      </h4>

                      <p className="text-sm text-gray-600 mb-4">
                        Автор: <span className="font-medium text-gray-800">{loan.bookAuthor || loan.book?.author || '—'}</span>
                      </p>
                    </div>

                    <div>
                      {actionMsg.id === loan.id && (
                        <div className={`p-2 mb-2 text-xs rounded font-medium ${
                          actionMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {actionMsg.text}
                        </div>
                      )}

                      {/* Кнопка скасування для читача [FR-13] */}
                      {isPending && (
                        <button
                          onClick={() => handleCancelReservation(loan.id)}
                          className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-xs transition border border-red-200"
                        >
                          ❌ Скасувати бронь
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Контент історії */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="divide-y divide-gray-200">
            {historyLoans.map((loan) => (
              <div key={loan.id} className="py-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    {loan.bookTitle || loan.book?.title}
                  </h4>
                  <p className="text-sm text-gray-600">{loan.bookAuthor || loan.book?.author}</p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  loan.status === 'Cancelled' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-800'
                }`}>
                  {loan.status === 'Cancelled' ? 'Скасовано' : 'Повернуто'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}