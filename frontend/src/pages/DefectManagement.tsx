import { useState, useEffect } from 'react';
import {
    AlertTriangle, Camera, Wrench, CheckCircle,
    Plus, X, Upload, Calendar, XCircle, SortAsc, SortDesc, Clock, List, FileDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Inspection {
    id: number;
    diag_id: number;
    object_id: number;
    method: string;
    date: string;
    defect_found: boolean;
    defect_description: string;
    ml_label: string;
    quality_grade: string;
}

interface RepairWork {
    id: number;
    inspection_id: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    planned_date: string | null;
    completed_date: string | null;
    assigned_to: number | null;
    notes: string | null;
    created_at: string;
}

interface Media {
    id: number;
    inspection_id: number;
    filename: string;
    original_name: string;
    is_before: boolean;
    description: string | null;
    uploaded_at: string;
}

type TabType = 'defects' | 'works';
type SortType = 'date' | 'priority';

export default function DefectManagement() {
    const { token, hasRole, user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('defects');
    const [defects, setDefects] = useState<Inspection[]>([]);
    const [allWorks, setAllWorks] = useState<RepairWork[]>([]);
    const [selectedDefect, setSelectedDefect] = useState<Inspection | null>(null);
    const [works, setWorks] = useState<RepairWork[]>([]);
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWorkForm, setShowWorkForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sortBy, setSortBy] = useState<SortType>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedWork, setSelectedWork] = useState<RepairWork | null>(null);
    const [workMedia, setWorkMedia] = useState<Media[]>([]);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const [workForm, setWorkForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        planned_date: ''
    });

    const canEdit = hasRole(['admin', 'inspector']);
    const isAdmin = hasRole(['admin']);

    useEffect(() => {
        fetchDefects();
        fetchAllWorks();
    }, []);

    useEffect(() => {
        if (selectedDefect) {
            fetchWorks(selectedDefect.id);
            fetchMedia(selectedDefect.id);
        }
    }, [selectedDefect]);

    const fetchDefects = async () => {
        try {
            const response = await fetch(`${API_URL}/api/inspections/?defect_found=true&limit=100`);
            const data = await response.json();
            setDefects(data);
        } catch (error) {
            console.error('Error fetching defects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllWorks = async () => {
        try {
            const response = await fetch(`${API_URL}/api/works/`);
            const data = await response.json();
            setAllWorks(data);
        } catch (error) {
            console.error('Error fetching all works:', error);
        }
    };

    const fetchWorks = async (inspectionId: number) => {
        try {
            const response = await fetch(`${API_URL}/api/works/inspection/${inspectionId}`);
            const data = await response.json();
            setWorks(data);
        } catch (error) {
            console.error('Error fetching works:', error);
        }
    };

    const fetchMedia = async (inspectionId: number) => {
        try {
            const response = await fetch(`${API_URL}/api/media/inspection/${inspectionId}`);
            const data = await response.json();
            setMedia(data);
        } catch (error) {
            console.error('Error fetching media:', error);
        }
    };

    const fetchWorkMedia = async (inspectionId: number) => {
        try {
            const response = await fetch(`${API_URL}/api/media/inspection/${inspectionId}`);
            const data = await response.json();
            setWorkMedia(data);
        } catch (error) {
            console.error('Error fetching work media:', error);
        }
    };

    const openWorkDetails = (work: RepairWork) => {
        setSelectedWork(work);
        fetchWorkMedia(work.inspection_id);
    };

    const handleCreateWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDefect || !token) return;

        try {
            const response = await fetch(`${API_URL}/api/works/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    inspection_id: selectedDefect.id,
                    ...workForm,
                    planned_date: workForm.planned_date || null
                })
            });

            if (response.ok) {
                fetchWorks(selectedDefect.id);
                fetchAllWorks();
                setShowWorkForm(false);
                setWorkForm({ title: '', description: '', priority: 'medium', planned_date: '' });
            } else {
                const error = await response.json();
                alert(error.detail || 'Ошибка при создании работы');
            }
        } catch (error) {
            console.error('Error creating work:', error);
        }
    };

    const handleUpdateWorkStatus = async (workId: number, newStatus: string) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/works/${workId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                if (selectedDefect) fetchWorks(selectedDefect.id);
                fetchAllWorks();
            }
        } catch (error) {
            console.error('Error updating work:', error);
        }
    };

    const handleSubmitForApproval = async (workId: number, hasAfterPhoto: boolean) => {
        if (!token) return;

        // Check for mandatory after photo
        if (!hasAfterPhoto) {
            alert('Необходимо загрузить фото после выполнения работ!');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/works/${workId}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                if (selectedDefect) fetchWorks(selectedDefect.id);
                fetchAllWorks();
            }
        } catch (error) {
            console.error('Error submitting for approval:', error);
        }
    };

    const handleApprove = async (workId: number, approved: boolean) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/works/${workId}/approve?approved=${approved}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                if (selectedDefect) fetchWorks(selectedDefect.id);
                fetchAllWorks();
            }
        } catch (error) {
            console.error('Error approving work:', error);
        }
    };

    const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, isBefore: boolean) => {
        if (!e.target.files?.[0] || !selectedDefect || !token) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('inspection_id', selectedDefect.id.toString());
        formData.append('is_before', isBefore.toString());

        try {
            setUploading(true);
            const response = await fetch(`${API_URL}/api/media/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                fetchMedia(selectedDefect.id);
            } else {
                const error = await response.json();
                alert(error.detail || 'Ошибка при загрузке фото');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (mediaId: number) => {
        if (!token || !selectedDefect) return;

        if (!confirm('Вы уверены, что хотите удалить это фото?')) return;

        try {
            const response = await fetch(`${API_URL}/api/media/${mediaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchMedia(selectedDefect.id);
            } else {
                const error = await response.json();
                alert(error.detail || 'Ошибка при удалении фото');
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'bg-gray-100 text-gray-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            critical: 'bg-red-100 text-red-700'
        };
        return colors[priority] || colors.medium;
    };

    const getPriorityValue = (priority: string) => {
        const values: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return values[priority] || 0;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            planned: 'bg-blue-100 text-blue-700',
            in_progress: 'bg-yellow-100 text-yellow-700',
            pending_approval: 'bg-purple-100 text-purple-700',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-gray-100 text-gray-700'
        };
        return colors[status] || colors.planned;
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            planned: 'Запланировано',
            in_progress: 'В работе',
            pending_approval: 'На проверке',
            completed: 'Выполнено',
            cancelled: 'Отменено'
        };
        return labels[status] || status;
    };

    const getRiskColor = (risk: string) => {
        const colors: Record<string, string> = {
            high: 'text-red-600 bg-red-50',
            medium: 'text-yellow-600 bg-yellow-50',
            normal: 'text-green-600 bg-green-50'
        };
        return colors[risk] || 'text-gray-600 bg-gray-50';
    };

    // Sort works
    const sortedAllWorks = [...allWorks].sort((a, b) => {
        if (sortBy === 'date') {
            const dateA = a.planned_date || a.created_at;
            const dateB = b.planned_date || b.created_at;
            return sortOrder === 'asc'
                ? dateA.localeCompare(dateB)
                : dateB.localeCompare(dateA);
        } else {
            const prioA = getPriorityValue(a.priority);
            const prioB = getPriorityValue(b.priority);
            return sortOrder === 'asc' ? prioA - prioB : prioB - prioA;
        }
    });

    const hasAfterPhoto = media.some(m => !m.is_before);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with role badge */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Управление дефектами</h1>
                    <p className="text-gray-500">Планирование работ и фотофиксация</p>
                </div>
                <div className="flex items-center space-x-4">
                    {user && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                            <span className="text-sm text-gray-600">{user.full_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                user.role === 'inspector' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {user.role === 'admin' ? 'Админ' :
                                    user.role === 'inspector' ? 'Инспектор' : user.role}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <span>Дефектов: {defects.length}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('defects')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'defects'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        Дефекты
                    </button>
                    <button
                        onClick={() => setActiveTab('works')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'works'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <List className="w-4 h-4 inline mr-2" />
                        Запланированные работы
                        {allWorks.filter(w => w.status !== 'completed').length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                                {allWorks.filter(w => w.status !== 'completed').length}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'defects' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Defects List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="font-semibold text-gray-900">Обнаруженные дефекты</h2>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {defects.map((defect) => (
                                <button
                                    key={defect.id}
                                    onClick={() => setSelectedDefect(defect)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedDefect?.id === defect.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                Объект #{defect.object_id}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                {defect.defect_description || 'Без описания'}
                                            </p>
                                            <div className="flex items-center mt-2 space-x-2">
                                                <span className="text-xs text-gray-500">{defect.date}</span>
                                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                                    {defect.method}
                                                </span>
                                            </div>
                                        </div>
                                        {defect.ml_label && (
                                            <span className={`text-xs px-2 py-1 rounded font-medium ${getRiskColor(defect.ml_label)}`}>
                                                {defect.ml_label === 'high' ? 'Высокий' :
                                                    defect.ml_label === 'medium' ? 'Средний' : 'Низкий'}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                            {defects.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    Дефекты не обнаружены
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Defect Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {selectedDefect ? (
                            <>
                                {/* Defect Info */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Дефект #{selectedDefect.diag_id}
                                            </h2>
                                            <p className="text-gray-500">Объект #{selectedDefect.object_id}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedDefect(null)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="text-gray-700 mb-4">
                                        {selectedDefect.defect_description || 'Описание отсутствует'}
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Метод:</span>
                                            <p className="font-medium">{selectedDefect.method}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Дата:</span>
                                            <p className="font-medium">{selectedDefect.date}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Оценка:</span>
                                            <p className="font-medium">{selectedDefect.quality_grade || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Риск:</span>
                                            <p className="font-medium">{selectedDefect.ml_label || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Photo Upload - MANDATORY */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                        <Camera className="w-5 h-5 mr-2" />
                                        Фотофиксация
                                        <span className="ml-2 text-xs text-red-600 font-normal">* обязательно</span>
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Before photos */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">До ремонта</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {media.filter(m => m.is_before).map((m) => (
                                                    <div key={m.id} className="relative group">
                                                        <img
                                                            src={`${API_URL}/api/media/file/${m.id}`}
                                                            alt={m.description || 'Фото дефекта'}
                                                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                        />
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => handleDeletePhoto(m.id)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                                title="Удалить фото"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {canEdit && (
                                                    <label className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleUploadPhoto(e, true)}
                                                            disabled={uploading}
                                                        />
                                                        {uploading ? (
                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                                                                <span className="text-xs text-gray-500">Загрузить</span>
                                                            </div>
                                                        )}
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* After photos - REQUIRED */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                После ремонта
                                                {!hasAfterPhoto && works.some(w => w.status === 'in_progress') && (
                                                    <span className="ml-2 text-xs text-red-600 animate-pulse">
                                                        ← Обязательно для завершения!
                                                    </span>
                                                )}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {media.filter(m => !m.is_before).map((m) => (
                                                    <div key={m.id} className="relative group">
                                                        <img
                                                            src={`${API_URL}/api/media/file/${m.id}`}
                                                            alt={m.description || 'Фото после ремонта'}
                                                            className="w-full h-24 object-cover rounded-lg border-2 border-green-500"
                                                        />
                                                        <CheckCircle className="absolute top-1 left-1 w-4 h-4 text-green-600" />
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => handleDeletePhoto(m.id)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                                title="Удалить фото"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {canEdit && (
                                                    <label className={`flex items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${!hasAfterPhoto && works.some(w => w.status === 'in_progress')
                                                        ? 'border-red-400 bg-red-50 hover:border-red-500'
                                                        : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                                                        }`}>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleUploadPhoto(e, false)}
                                                            disabled={uploading}
                                                        />
                                                        {uploading ? (
                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                                                                <span className="text-xs text-gray-500">Загрузить</span>
                                                            </div>
                                                        )}
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Repair Works */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center">
                                            <Wrench className="w-5 h-5 mr-2" />
                                            Работы по дефекту
                                        </h3>
                                        {canEdit && (
                                            <button
                                                onClick={() => setShowWorkForm(!showWorkForm)}
                                                className="flex items-center text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Добавить
                                            </button>
                                        )}
                                    </div>

                                    {/* Work Form */}
                                    {showWorkForm && (
                                        <form onSubmit={handleCreateWork} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Название работы *"
                                                required
                                                value={workForm.title}
                                                onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                                            />
                                            <textarea
                                                placeholder="Описание"
                                                value={workForm.description}
                                                onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <select
                                                    value={workForm.priority}
                                                    onChange={(e) => setWorkForm({ ...workForm, priority: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                                                >
                                                    <option value="low">Низкий приоритет</option>
                                                    <option value="medium">Средний приоритет</option>
                                                    <option value="high">Высокий приоритет</option>
                                                    <option value="critical">Критический</option>
                                                </select>
                                                <input
                                                    type="date"
                                                    value={workForm.planned_date}
                                                    onChange={(e) => setWorkForm({ ...workForm, planned_date: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                                                />
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowWorkForm(false)}
                                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                >
                                                    Отмена
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Сохранить
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Works List */}
                                    <div className="space-y-3">
                                        {works.map((work) => (
                                            <div key={work.id} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900">{work.title}</h4>
                                                        {work.description && (
                                                            <p className="text-sm text-gray-500 mt-1">{work.description}</p>
                                                        )}
                                                        <div className="flex items-center mt-2 space-x-2">
                                                            <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(work.priority)}`}>
                                                                {work.priority === 'critical' ? 'Критический' :
                                                                    work.priority === 'high' ? 'Высокий' :
                                                                        work.priority === 'medium' ? 'Средний' : 'Низкий'}
                                                            </span>
                                                            {work.planned_date && (
                                                                <span className="text-xs text-gray-500 flex items-center">
                                                                    <Calendar className="w-3 h-3 mr-1" />
                                                                    {work.planned_date}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end space-y-2">
                                                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(work.status)}`}>
                                                            {getStatusLabel(work.status)}
                                                        </span>

                                                        {/* Workflow buttons */}
                                                        {canEdit && work.status === 'in_progress' && (
                                                            <button
                                                                onClick={() => handleSubmitForApproval(work.id, hasAfterPhoto)}
                                                                className={`flex items-center text-xs px-2 py-1 rounded ${hasAfterPhoto
                                                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                                title={hasAfterPhoto ? 'Отправить на проверку' : 'Сначала загрузите фото после ремонта'}
                                                            >
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Завершить
                                                            </button>
                                                        )}

                                                        {isAdmin && work.status === 'pending_approval' && (
                                                            <div className="flex space-x-1">
                                                                <button
                                                                    onClick={() => handleApprove(work.id, true)}
                                                                    className="flex items-center text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                                >
                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                    Принять
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApprove(work.id, false)}
                                                                    className="flex items-center text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                                >
                                                                    <XCircle className="w-3 h-3 mr-1" />
                                                                    Вернуть
                                                                </button>
                                                            </div>
                                                        )}

                                                        {canEdit && (work.status === 'planned' || work.status === 'cancelled') && (
                                                            <select
                                                                value={work.status}
                                                                onChange={(e) => handleUpdateWorkStatus(work.id, e.target.value)}
                                                                className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700"
                                                            >
                                                                <option value="planned">Запланировано</option>
                                                                <option value="in_progress">В работе</option>
                                                                <option value="cancelled">Отменено</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {works.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                <Wrench className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                <p>Работы не запланированы</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите дефект</h3>
                                <p className="text-gray-500">
                                    Выберите дефект из списка слева для просмотра деталей
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Works Tab */
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Sorting controls */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Все запланированные работы</h2>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Сортировка:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortType)}
                                className="text-sm border border-gray-200 rounded px-2 py-1 text-gray-700"
                            >
                                <option value="date">По дате</option>
                                <option value="priority">По приоритету</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="p-1.5 hover:bg-gray-100 rounded"
                            >
                                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Works table */}
                    <div className="divide-y divide-gray-100">
                        {sortedAllWorks.map((work) => (
                            <div
                                key={work.id}
                                className="p-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => openWorkDetails(work)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <h4 className="font-medium text-gray-900">{work.title}</h4>
                                            <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(work.priority)}`}>
                                                {work.priority === 'critical' ? 'Критический' :
                                                    work.priority === 'high' ? 'Высокий' :
                                                        work.priority === 'medium' ? 'Средний' : 'Низкий'}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(work.status)}`}>
                                                {getStatusLabel(work.status)}
                                            </span>
                                        </div>
                                        {work.description && (
                                            <p className="text-sm text-gray-500 mt-1">{work.description}</p>
                                        )}
                                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                            {work.planned_date && (
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    План: {work.planned_date}
                                                </span>
                                            )}
                                            <span className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Создано: {work.created_at.split('T')[0]}
                                            </span>
                                            <span className="text-blue-600">
                                                Нажмите для просмотра деталей →
                                            </span>
                                        </div>
                                    </div>
                                    {work.status === 'pending_approval' && (
                                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded animate-pulse">
                                            Ожидает проверки
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {sortedAllWorks.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p>Нет запланированных работ</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Work Details Modal */}
            {selectedWork && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedWork.title}</h2>
                                <div className="flex items-center space-x-2 mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(selectedWork.priority)}`}>
                                        {selectedWork.priority === 'critical' ? 'Критический' :
                                            selectedWork.priority === 'high' ? 'Высокий' :
                                                selectedWork.priority === 'medium' ? 'Средний' : 'Низкий'}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(selectedWork.status)}`}>
                                        {getStatusLabel(selectedWork.status)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedWork(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Work Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Плановая дата:</span>
                                    <p className="font-medium">{selectedWork.planned_date || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Создано:</span>
                                    <p className="font-medium">{selectedWork.created_at.split('T')[0]}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Завершено:</span>
                                    <p className="font-medium">{selectedWork.completed_date || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Инспекция ID:</span>
                                    <p className="font-medium">#{selectedWork.inspection_id}</p>
                                </div>
                            </div>

                            {selectedWork.description && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Описание работы:</h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedWork.description}</p>
                                </div>
                            )}

                            {selectedWork.notes && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Заметки:</h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-line">{selectedWork.notes}</p>
                                </div>
                            )}

                            {/* Photos Section */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                                    <Camera className="w-5 h-5 mr-2" />
                                    Фотофиксация
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Before Photos */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h5 className="font-medium text-red-800 mb-3">📷 До ремонта (нажмите для увеличения)</h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            {workMedia.filter(m => m.is_before).map((m) => (
                                                <img
                                                    key={m.id}
                                                    src={`${API_URL}/api/media/file/${m.id}`}
                                                    alt="До ремонта"
                                                    className="w-full h-32 object-cover rounded-lg border-2 border-red-300 cursor-zoom-in hover:opacity-80 transition-opacity"
                                                    onClick={() => setZoomedImage(`${API_URL}/api/media/file/${m.id}`)}
                                                />
                                            ))}
                                            {workMedia.filter(m => m.is_before).length === 0 && (
                                                <p className="col-span-2 text-sm text-red-600 italic">Фото не загружены</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* After Photos */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h5 className="font-medium text-green-800 mb-3">📷 После ремонта (нажмите для увеличения)</h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            {workMedia.filter(m => !m.is_before).map((m) => (
                                                <img
                                                    key={m.id}
                                                    src={`${API_URL}/api/media/file/${m.id}`}
                                                    alt="После ремонта"
                                                    className="w-full h-32 object-cover rounded-lg border-2 border-green-300 cursor-zoom-in hover:opacity-80 transition-opacity"
                                                    onClick={() => setZoomedImage(`${API_URL}/api/media/file/${m.id}`)}
                                                />
                                            ))}
                                            {workMedia.filter(m => !m.is_before).length === 0 && (
                                                <p className="col-span-2 text-sm text-green-600 italic">Фото не загружены</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                {/* Download PDF Button */}
                                <button
                                    onClick={() => {
                                        window.open(`${API_URL}/api/reports/defect/${selectedWork.id}/pdf`, '_blank');
                                    }}
                                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Скачать PDF отчёт
                                </button>

                                {/* Approval Buttons (Admin Only) */}
                                {isAdmin && selectedWork.status === 'pending_approval' ? (
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                handleApprove(selectedWork.id, false);
                                                setSelectedWork(null);
                                            }}
                                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Вернуть на доработку
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleApprove(selectedWork.id, true);
                                                setSelectedWork(null);
                                            }}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Принять работу
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedWork(null)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Закрыть
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Image Lightbox */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] cursor-zoom-out"
                    onClick={() => setZoomedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                        onClick={() => setZoomedImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={zoomedImage}
                        alt="Увеличенное фото"
                        className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <p className="absolute bottom-4 text-white text-sm">Нажмите в любом месте для закрытия</p>
                </div>
            )}
        </div>
    );
}

