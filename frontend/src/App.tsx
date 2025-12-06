import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import ObjectsList from './pages/ObjectsList';
import ImportData from './pages/ImportData';
import Reports from './pages/Reports';
import About from './pages/About';

function App() {
    // TODO: Get user role from auth context
    const userRole = 'admin'; // Temporary, will be replaced with actual auth

    return (
        <Router>
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
                                {/* User Profile */}
                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">Администратор</p>
                                        <p className="text-xs text-gray-500">admin@integrityos.kz</p>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold">A</span>
                                    </div>
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
                            <Route path="/import" element={<ImportData />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/about" element={<About />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    );
}

export default App;
