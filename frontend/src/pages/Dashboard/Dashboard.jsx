import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Dashboard() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchMyLoans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/Loans/my');
      setLoans(response.data?.data || []);
    } catch (err) {
      console.error('Помилка завантаження кабінету:', err);
      showMessage('error', 'Не вдалося завантажити Ваші книги.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLoans();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleCancelReservation = async (loanId) => {
    if (!window.confirm('Ви дійсно бажаєте скасувати бронювання цієї книги?')) return;
    try {
      await api.post(`/Loans/${loanId}/cancel`);
      showMessage('success', 'Бронювання успішно скасовано.');
      fetchMyLoans();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Не вдалося скасувати бронювання.');
    }
  };

  const isPending = (status) => status === 'Pending' || status === 'Reserved' || status === 0;
  const isActive = (status) => status === 'Active' || status === 'Issued' || status === 1;

  const currentLoans = loans.filter((l) => isPending(l.status) || isActive(l.status));
  const historyLoans = loans.filter((l) => !isPending(l.status) && !isActive(l.status));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Dashboard Banner */}
      <div className="bg-white p-8 rounded-3xl border border-[#E5E7E3] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-[#E8EFE8] text-[#294E40] text-xs font-bold rounded-full uppercase tracking-wider">
            Особистий профіль
          </span>
          <h1 className="text-3xl font-black text-[#25312B] mt-1">Мій кабінет читача</h1>
          <p className="text-sm text-[#69766E] mt-0.5">
            Керуйте своїми бронюваннями та переглядайте історію читання
          </p>
        </div>

        <button
          onClick={fetchMyLoans}
          className="px-4 py-2.5 bg-[#E8EFE8] hover:bg-[#dbe7db] text-[#294E40] font-bold rounded-xl text-xs transition flex items-center gap-2 self-start sm:self-auto border border-[#E5E7E3]"
        >
          🔄 Оновити дані
        </button>
      </div>

      {/* Messages */}
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

      {/* Tab Controls in Soft Sage */}
      <div className="bg-[#E8EFE8] p-1.5 rounded-2xl inline-flex gap-1 border border-[#E5E7E3]">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black transition ${
            activeTab === 'current'
              ? 'bg-white text-[#25312B] shadow-sm'
              : 'text-[#69766E] hover:text-[#25312B]'
          }`}
        >
          Поточні книги ({currentLoans.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black transition ${
            activeTab === 'history'
              ? 'bg-white text-[#25312B] shadow-sm'
              : 'text-[#69766E] hover:text-[#25312B]'
          }`}
        >
          Історія ({historyLoans.length})
        </button>
      </div>

      {/* Current Loans */}
      {activeTab === 'current' && (
        <div>
          {loading ? (
            <div className="py-12 text-center text-[#69766E]">Завантаження книг...</div>
          ) : currentLoans.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-[#E5E7E3] shadow-sm space-y-2">
              <span className="text-4xl">📖</span>
              <h3 className="text-base font-extrabold text-[#25312B]">У вас немає активних книг або броней</h3>
              <p className="text-xs text-[#69766E]">Перейдіть у каталог, щоб вибрати цікаву книгу.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentLoans.map((loan) => {
                const pending = isPending(loan.status);
                // Прострочену видачу виділяємо червоним (FR-8); isOverdue рахує бекенд
                const overdue = !pending && loan.isOverdue;

                return (
                  <div
                    key={loan.id}
                    className={`bg-white p-6 rounded-2xl border shadow-sm space-y-4 flex flex-col justify-between ${
                      overdue ? 'border-rose-300 ring-1 ring-rose-200' : 'border-[#E5E7E3]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                            pending
                              ? 'bg-[#E8EFE8] text-[#294E40] border-[#294E40]/20'
                              : overdue
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {pending ? '📌 Заброньовано' : overdue ? '⚠️ Прострочено' : '📖 Видано на руки'}
                        </span>

                        <span className={`text-xs font-medium ${overdue ? 'text-rose-700 font-bold' : 'text-[#69766E]'}`}>
                          Дедлайн: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('uk-UA') : 'Очікує видачі'}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-[#25312B]">
                        {loan.bookTitle || loan.book?.title || 'Книга'}
                      </h3>
                      <p className="text-xs font-semibold text-[#69766E]">
                        {loan.bookAuthor || loan.book?.author || 'Автор'}
                      </p>
                    </div>

                    {pending && (
                      <button
                        onClick={() => handleCancelReservation(loan.id)}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200"
                      >
                        ❌ Скасувати бронь
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-[#E5E7E3] shadow-sm overflow-hidden">
          {historyLoans.length === 0 ? (
            <div className="p-12 text-center text-[#69766E] text-xs">Історія порожня.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E5E7E3] text-xs font-bold text-[#69766E] uppercase">
                    <th className="py-4 px-6">Книга</th>
                    <th className="py-4 px-6">Статус</th>
                    <th className="py-4 px-6">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7E3]">
                  {historyLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-[#FAF9F6]/80 transition">
                      <td className="py-4 px-6 font-bold text-[#25312B]">
                        {loan.bookTitle || loan.book?.title || 'Книга'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-[#E8EFE8] text-[#294E40] text-xs font-bold rounded-lg border border-[#E5E7E3]">
                          {loan.status === 'Returned' ? 'Повернено' : 'Скасовано'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-[#69766E]">
                        {loan.returnDate
                          ? new Date(loan.returnDate).toLocaleDateString('uk-UA')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}