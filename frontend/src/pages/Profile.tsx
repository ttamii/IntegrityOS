import { useState } from 'react';
import { User, Mail, Shield, Calendar, Lock, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Profile() {
    const { user, token, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [profileForm, setProfileForm] = useState({
        full_name: user?.full_name || '',
        email: user?.email || ''
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Администратор',
            inspector: 'Инспектор',
            analyst: 'Аналитик',
            guest: 'Гость'
        };
        return labels[role] || role;
    };

    const getRoleColor = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-red-100 text-red-700',
            inspector: 'bg-blue-100 text-blue-700',
            analyst: 'bg-purple-100 text-purple-700',
            guest: 'bg-gray-100 text-gray-700'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileForm)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Профиль успешно обновлён' });
                // Refresh page to update user context
                setTimeout(() => window.location.reload(), 1500);
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Ошибка обновления профиля' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setMessage({ type: 'error', text: 'Новые пароли не совпадают' });
            return;
        }

        if (passwordForm.new_password.length < 6) {
            setMessage({ type: 'error', text: 'Пароль должен быть не менее 6 символов' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${API_URL}/api/auth/me/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: passwordForm.current_password,
                    new_password: passwordForm.new_password
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Пароль успешно изменён! Войдите заново.' });
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                // Logout after password change
                setTimeout(() => logout(), 2000);
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Ошибка смены пароля' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Загрузка...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Профиль пользователя</h1>
                <p className="text-gray-500">Управление личными данными и настройками</p>
            </div>

            {/* User Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{user.full_name || user.username}</h2>
                        <p className="text-gray-500">@{user.username}</p>
                        <div className="flex items-center mt-2 space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                                {getRoleLabel(user.role)}
                            </span>
                            {user.is_active && (
                                <span className="flex items-center text-xs text-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Активен
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex">
                        <button
                            onClick={() => { setActiveTab('info'); setMessage(null); }}
                            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'info'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <User className="w-4 h-4 inline mr-2" />
                            Личные данные
                        </button>
                        <button
                            onClick={() => { setActiveTab('password'); setMessage(null); }}
                            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'password'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Lock className="w-4 h-4 inline mr-2" />
                            Смена пароля
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Message */}
                    {message && (
                        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <User className="w-4 h-4 inline mr-1" />
                                        Имя пользователя
                                    </label>
                                    <input
                                        type="text"
                                        value={user.username}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Логин изменить нельзя</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Shield className="w-4 h-4 inline mr-1" />
                                        Роль
                                    </label>
                                    <input
                                        type="text"
                                        value={getRoleLabel(user.role)}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Роль назначает администратор</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Полное имя
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.full_name}
                                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                                    placeholder="Иванов Иван Иванович"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                                <p className="text-sm text-gray-500 flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Зарегистрирован: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                                </p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {loading ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Текущий пароль
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Новый пароль
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-400 mt-1">Минимум 6 символов</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Подтвердите новый пароль
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.confirm_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    {loading ? 'Сохранение...' : 'Изменить пароль'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
