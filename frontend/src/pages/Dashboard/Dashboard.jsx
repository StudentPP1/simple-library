import { useState } from 'react';

export default function Dashboard() {
  const [user] = useState({
    name: 'Іванов Іван Іванович',
    email: 'reader@example.com',
    ticketNumber: 'LIB-2026-4502',
    status: 'Активний'
  });

  const [myBooks] = useState([
    { id: 1, title: '1984', author: 'Джордж Оруелл', dueDate: '2026-10-15', status: 'На руках' },
    { id: 2, title: 'Майстер і Маргарита', author: 'Михайло Булгаков', dueDate: '2026-10-01', status: 'Протерміновано' },
    { id: 3, title: 'Чистий код', author: 'Роберт Мартін', dueDate: '-', status: 'Заброньовано' },
  ]);

  const getStatusBadge = (status) => {
    if (status === 'На руках') return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">На руках</span>;
    if (status === 'Протерміновано') return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Протерміновано</span>;
    if (status === 'Заброньовано') return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Заброньовано</span>;
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Особистий кабінет</h2>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Читацький квиток</p>
          <p className="text-lg font-mono font-semibold text-blue-700">{user.ticketNumber}</p>
          <p className="text-sm text-green-600 font-medium mt-1">Статус: {user.status}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Мої книги</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-3 font-medium">Назва книги</th>
                <th className="px-6 py-3 font-medium">Автор</th>
                <th className="px-6 py-3 font-medium">Повернути до</th>
                <th className="px-6 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {myBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{book.title}</td>
                  <td className="px-6 py-4 text-gray-600">{book.author}</td>
                  <td className={`px-6 py-4 font-medium ${book.status === 'Протерміновано' ? 'text-red-600' : 'text-gray-900'}`}>
                    {book.dueDate}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(book.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}