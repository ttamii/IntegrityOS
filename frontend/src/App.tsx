import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, List, Upload, FileText, Database } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import ObjectsList from './pages/ObjectsList';
import ImportData from './pages/ImportData';
import Reports from './pages/Reports';

function Navigation() {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Дашборд' },
        { path: '/map', icon: Map, label: 'Карта' },
        { path: '/objects', icon: List, label: 'Объекты' },
        { path: '/import', icon: Upload, label: 'Импорт' },
        { path: '/reports', icon: FileText, label: 'Отчеты' },
    ];

    return (
        <nav className="bg-slate-800 border-b border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Database className="h-8 w-8 text-primary-400" />
                        <span className="ml-2 text-xl font-bold text-white">IntegrityOS</span>
                    </div>
                    <div className="flex space-x-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'bg-primary-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    <Icon className="h-5 w-5 mr-2" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-slate-900">
                <Navigation />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/map" element={<MapView />} />
                        <Route path="/objects" element={<ObjectsList />} />
                        <Route path="/import" element={<ImportData />} />
                        <Route path="/reports" element={<Reports />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
