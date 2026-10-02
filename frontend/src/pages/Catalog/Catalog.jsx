import { useState } from 'react';

export default function Catalog() {
  // Тимчасові мок-дані
  const [books] = useState([
    { id: 1, title: '1984', author: 'Джордж Оруелл', status: 'Available' },
    { id: 2, title: 'Майстер і Маргарита', author: 'Михайло Булгаков', status: 'Reserved' },
    { id: 3, title: 'Кобзар', author: 'Тарас Шевченко', status: 'IssuedOut' },
    { id: 4, title: 'Чистий код', author: 'Роберт Мартін', status: 'Available' },
  ]);

  // Функція для рендеру відповідного бейджа статусу
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">В наявності</span>;
      case 'Reserved':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Заброньовано</span>;
      case 'IssuedOut':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Видана</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Шапка каталогу з пошуком */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Електронний каталог</h2>
        <input
          type="text"
          placeholder="Пошук за назвою..."
          className="px-4 py-2 border border-gray-300 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Сітка карток книг */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <div key={book.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition flex flex-col">
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{book.title}</h3>
              <p className="text-gray-600 mb-4">{book.author}</p>
            </div>

            <div className="flex justify-between items-center mt-4 border-t pt-4">
              {getStatusBadge(book.status)}
              <button
                disabled={book.status !== 'Available'}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
                  book.status === 'Available' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Забронювати
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}