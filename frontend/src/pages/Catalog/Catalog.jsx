import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Викликаємо метод GetCatalog з BooksController
    api.get('/Books')
      .then(response => {
        // Залежно від реалізації PagedResponse на бекенді, масив книг може лежати в data.items або data.data
        const booksData = response.data.data.items || response.data.data || [];
        setBooks(booksData);
      })
      .catch(error => {
        console.error('Помилка завантаження каталогу:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Електронний каталог</h2>

      {loading ? (
        <p className="text-gray-600">Завантаження книг...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.length > 0 ? books.map((book) => (
            <div key={book.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{book.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{book.author}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                {/* Якщо бекенд повертає статус наявності, можна додати умову тут */}
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  В наявності
                </span>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition">
                  Забронювати
                </button>
              </div>
            </div>
          )) : (
            <p className="text-gray-500">Каталог поки порожній.</p>
          )}
        </div>
      )}
    </div>
  );
}