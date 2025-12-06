import { useState, useEffect } from 'react';
import { Users as UsersIcon, Shield, UserPlus, Trash2, Edit2, Search, X, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
}

export default function UsersManagement() {
    const { token, hasRole } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [newUserForm, setNewUserForm] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'guest'
    });

    const roles = [
        { value: 'admin', label: 'Администратор', color: 'bg-red-100 text-red-700' },
        { value: 'inspector', label: 'Инспектор', color: 'bg-blue-100 text-blue-700' },
        { value: 'analyst', label: 'Аналитик', color: 'bg-purple-100 text-purple-700' },
        { value: 'guest', label: 'Гость', color: 'bg-gray-100 text-gray-700' }
    ];

    const getRoleInfo = (role: string) => {
        return roles.find(r => r.value === role) || { label: role, color: 'bg-gray-100 text-gray-700' };
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/api/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId: number, newRole: string) => {
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/api/auth/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Роль пользователя обновлена' });
                fetchUsers();
                setEditingUser(null);
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Ошибка обновления роли' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeleteUser = async (userId: number, username: string) => {
        if (!confirm(`Вы уверены, что хотите удалить пользователя "${username}"?`)) return;
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Пользователь удалён' });
                fetchUsers();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Ошибка удаления' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            // Register user
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUserForm)
            });

            if (response.ok) {
                const newUser = await response.json();

                // Update role if not guest
                if (newUserForm.role !== 'guest') {
                    await handleUpdateRole(newUser.id, newUserForm.role);
                }

                setMessage({ type: 'success', text: 'Пользователь создан' });
                setShowAddModal(false);
                setNewUserForm({ username: '', email: '', full_name: '', password: '', role: 'guest' });
                fetchUsers();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Ошибка создания пользователя' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    if (!hasRole(['admin'])) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <p className="text-lg">Доступ только для администраторов</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <UsersIcon className="w-7 h-7 mr-3 text-blue-600" />
                        Управление пользователями
                    </h1>
                    <p className="text-gray-500">Всего пользователей: {users.length}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Добавить пользователя
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Поиск по имени, логину или email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Все роли</option>
                        {roles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата регистрации</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Пользователи не найдены
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-semibold">
                                                        {(user.username)[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {user.full_name || user.username}
                                                    </p>
                                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            {editingUser?.id === user.id ? (
                                                <div className="flex items-center space-x-2">
                                                    <select
                                                        value={editingUser.role}
                                                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                                        className="text-sm border border-gray-300 rounded px-2 py-1"
                                                    >
                                                        {roles.map(role => (
                                                            <option key={role.value} value={role.value}>{role.label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleUpdateRole(user.id, editingUser.role)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingUser(null)}
                                                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleInfo(user.role).color}`}>
                                                    {getRoleInfo(user.role).label}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {user.is_active ? 'Активен' : 'Заблокирован'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(user.created_at).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Изменить роль"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Удалить"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                                Новый пользователь
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Имя пользователя (логин)
                                </label>
                                <input
                                    type="text"
                                    value={newUserForm.username}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="ivanov"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Полное имя
                                </label>
                                <input
                                    type="text"
                                    value={newUserForm.full_name}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Иванов Иван Иванович"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Пароль
                                </label>
                                <input
                                    type="password"
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Минимум 6 символов"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Shield className="w-4 h-4 inline mr-1" />
                                    Роль
                                </label>
                                <select
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {roles.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
