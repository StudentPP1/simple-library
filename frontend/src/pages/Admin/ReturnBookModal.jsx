import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ReturnBookModal({ onClose, onSuccess }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  // Завантажуємо список усіх активних (неповернених) видач
  const fetchActiveLoans = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/Loans/active'); // Або /Loans?status=Active
      const data = response.data?.data?.items || response.data?.data || response.data || [];
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Помилка завантаження активних видач:', err);
      setError('Не вдалося завантажити список активних видач.');
    } fontFinally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  // Обробник повернення книги
  const handleReturn = async (loanId) => {
    setProcessingId(loanId);
    setError('');

    try {
      // Відправляємо запит на повернення книги
      await api.post(`/Loans/${loanId}/return`);

      onSuccess('Книгу успішно повернуто в бібліотеку!');
      // Оновлюємо список активних видач
      fetchActiveLoans();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Не вдалося зафіксувати повернення книги.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold text-gray-800">📥 Повернення книг (FR-6)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
            ✕
          </button>
        </div>

        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        <div className="overflow-y-auto flex-1 pr-1">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Завантаження активних видач...</div>
          ) : loans.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Наразі немає активних (неповернених) видач.</div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 border rounded-lg bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition"
                >
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {loan.bookTitle || loan.bookCopy?.book?.title || 'Книга'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Читач: <span className="font-medium text-gray-800">{loan.readerName || loan.readerEmail || loan.readerId}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Примірник №: {loan.inventoryNumber || loan.bookCopyId} | Граничний термін: {' '}
                      <span className="font-semibold text-blue-700">
                        {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleReturn(loan.id)}
                    disabled={processingId === loan.id}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition shadow-sm whitespace-nowrap self-start sm:self-center"
                  >
                    {processingId === loan.id ? 'Обробка...' : '↩️ Прийняти повернення'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 transition"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}