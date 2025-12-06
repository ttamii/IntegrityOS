import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Map,
    FileText,
    Upload,
    BarChart3,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
    userRole?: 'admin' | 'inspector' | 'analyst' | 'guest';
}

export default function Sidebar({ userRole = 'guest' }: SidebarProps) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Панель управления', roles: ['admin', 'inspector', 'analyst', 'guest'] },
        { path: '/map', icon: Map, label: 'Карта объектов', roles: ['admin', 'inspector', 'analyst', 'guest'] },
        { path: '/objects', icon: FileText, label: 'Объекты', roles: ['admin', 'inspector', 'analyst', 'guest'] },
        { path: '/import', icon: Upload, label: 'Импорт данных', roles: ['admin', 'inspector'] },
        { path: '/reports', icon: BarChart3, label: 'Отчёты', roles: ['admin', 'inspector', 'analyst'] },
        { path: '/users', icon: Users, label: 'Пользователи', roles: ['admin'] },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        item.roles.includes(userRole)
    );

    return (
        <div
            className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
            style={{ height: '100vh', position: 'fixed', left: 0, top: 0 }}
        >
            {/* Logo */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                {!collapsed && (
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">IO</span>
                        </div>
                        <span className="font-semibold text-gray-900">IntegrityOS</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                    ) : (
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors
                                ${isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }
                                ${collapsed ? 'justify-center' : ''}
                            `}
                            title={collapsed ? item.label : ''}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                            {!collapsed && (
                                <span className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-3 border-t border-gray-200 space-y-1">
                <Link
                    to="/settings"
                    className={`
                        flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-50
                        ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? 'Настройки' : ''}
                >
                    <Settings className="h-5 w-5 text-gray-500" />
                    {!collapsed && <span className="font-medium">Настройки</span>}
                </Link>

                <button
                    className={`
                        w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-50
                        ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? 'Выход' : ''}
                >
                    <LogOut className="h-5 w-5 text-gray-500" />
                    {!collapsed && <span className="font-medium">Выход</span>}
                </button>
            </div>
        </div>
    );
}
