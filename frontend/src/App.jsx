import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register'; // Додано імпорт
import Catalog from './pages/Catalog/Catalog';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900">

        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-wider">Система обліку бібліотеки</h1>
            <a href="/login" className="text-sm bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition">Вийти</a>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 mt-4 bg-white shadow rounded-lg">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} /> {/* Додано маршрут */}
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/dashboard" element={<h2 className="text-xl font-semibold">Особистий кабінет читача</h2>} />
            <Route path="/admin" element={<h2 className="text-xl font-semibold">Панель бібліотекаря</h2>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;