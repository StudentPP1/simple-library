import { useState } from 'react';

export default function Admin() {
  // Мок-дані запитів від усіх читачів
  const [requests, setRequests] = useState([
    { id: 1, reader: 'Іванов І.І.', book: '1984', date: '2026-10-04', status: 'Заброньовано' },
    { id: 2, reader: 'Петренко О.М.', book: 'Кобзар', date: '2026-09-20', status: 'На руках' },
    { id: 3, reader: 'Іванов І.І.', book: 'Майстер і Маргарита', date: '2026-09-10', status: 'Протерміновано' },
  ]);

  // Функція для зміни статусу (імітація роботи API)
  const handleAction = (id, newStatus) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
  };

  const getStatusBadge = (status) => {
    if (status === 'На руках') return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">На руках</span>;
    if (status === 'Протерміновано') return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Протерміновано</span>;
    if (status === 'Заброньовано') return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Заброньовано</span>;
    if (status === 'Повернуто') return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Повернуто</span>;
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Панель бібліотекаря</h2>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Управління видачею книг</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-3 font-medium">Читач</th>
                <th className="px-6 py-3 font-medium">Книга</th>
                <th className="px-6 py-3 font-medium">Дата запиту</th>
                <th className="px-6 py-3 font-medium">Статус</th>
                <th className="px-6 py-3 font-medium text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{req.reader}</td>
                  <td className="px-6 py-4 text-gray-600">{req.book}</td>
                  <td className="px-6 py-4 text-gray-600">{req.date}</td>
                  <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {req.status === 'Заброньовано' && (
                      <button
                        onClick={() => handleAction(req.id, 'На руках')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        Видати
                      </button>
                    )}
                    {(req.status === 'На руках' || req.status === 'Протерміновано') && (
                      <button
                        onClick={() => handleAction(req.id, 'Повернуто')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                      >
                        Прийняти
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}