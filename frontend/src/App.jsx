import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login/Login';
import Admin from './pages/Admin/Admin';
import Register from './pages/Register/Register';
import Catalog from './pages/Catalog/Catalog';
import Dashboard from './pages/Dashboard/Dashboard';


function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900">

        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold tracking-wider">Система обліку бібліотеки</h1>

            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link to="/catalog" className="hover:text-blue-200 transition">Каталог</Link>
              <Link to="/dashboard" className="hover:text-blue-200 transition">Мій кабінет</Link>
              <Link to="/admin" className="hover:text-blue-200 transition">Адмін-панель</Link>
              <Link to="/login" className="bg-blue-700 px-4 py-2 rounded-md hover:bg-blue-800 transition ml-2">Вийти</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 mt-4 bg-white shadow rounded-lg">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;