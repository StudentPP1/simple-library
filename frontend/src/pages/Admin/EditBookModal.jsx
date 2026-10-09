import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function EditBookModal({ book, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: '',
    publicationYear: '',
    copiesCount: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Заповнюємо форму поточними даними книги
  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        genre: book.genre || '',
        isbn: book.isbn || '',
        publicationYear: book.publicationYear || '',
        copiesCount: book.copiesCount || 1,
      });
    }
  }, [book]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Відправляємо PUT-запит на оновлення книги за її ID
      await api.put(`/Books/${book.id}`, {
        title: formData.title.trim(),
        author: formData.author.trim(),
        genre: formData.genre.trim(),
        isbn: formData.isbn.trim(),
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : 0,
        copiesCount: parseInt(formData.copiesCount),
      });

      onSuccess('Інформацію про книгу успішно оновлено!');
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Не вдалося оновити дані книги.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold text-gray-800">Редагування книги</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
            ✕
          </button>
        </div>

        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Назва книги *</label>
            <input
              type="text"
              name="title"
              required
              maxLength="250"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Автор *</label>
              <input
                type="text"
                name="author"
                required
                maxLength="150"
                value={formData.author}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Жанр</label>
              <input
                type="text"
                name="genre"
                maxLength="100"
                value={formData.genre}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ISBN</label>
              <input
                type="text"
                name="isbn"
                maxLength="20"
                value={formData.isbn}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Рік видання</label>
              <input
                type="number"
                name="publicationYear"
                value={formData.publicationYear}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Кількість примірників *</label>
            <input
              type="number"
              name="copiesCount"
              min="1"
              max="100"
              required
              value={formData.copiesCount}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              {isLoading ? 'Збереження...' : 'Зберегти зміни'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}