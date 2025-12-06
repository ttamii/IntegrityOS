import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import ObjectsList from './pages/ObjectsList';
import ImportData from './pages/ImportData';
import Reports from './pages/Reports';
import About from './pages/About';
import Login from './pages/Login';
import DefectManagement from './pages/DefectManagement';
import Profile from './pages/Profile';
import { LogOut } from 'lucide-react';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

// Main Layout with Sidebar
function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const userRole = user?.role || 'guest';

    const getRoleName = (role: string) => {
        const roles: Record<string, string> = {
            admin: 'Администратор',
            inspector: 'Инспектор',
            analyst: 'Аналитик',
            guest: 'Гость'
        };
        return roles[role] || role;
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar userRole={userRole} />

            {/* Main Content */}
            <div className="flex-1 ml-64">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Система мониторинга трубопроводов
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Управление и контроль состояния магистральных трубопроводов
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* User Profile - Clickable */}
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                                    title="Открыть профиль"
                                >
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {user?.full_name || user?.username}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {getRoleName(userRole)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold">
                                            {(user?.username || 'U')[0].toUpperCase()}
                                        </span>
                                    </div>
                                </button>
                                <button
                                    onClick={logout}
                                    className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Выйти"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/map" element={<MapView />} />
                        <Route path="/objects" element={<ObjectsList />} />
                        <Route path="/defects" element={<DefectManagement />} />
                        <Route path="/import" element={<ImportData />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/about" element={<About />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
