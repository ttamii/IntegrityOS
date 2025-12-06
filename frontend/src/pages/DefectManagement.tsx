import { useState, useEffect } from 'react';
import {
    AlertTriangle, Camera, Wrench, CheckCircle, Clock,
    Plus, X, Upload, Calendar, User, ChevronDown, ChevronUp,
    Image as ImageIcon
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

export default function DefectManagement() {
    const { token, hasRole } = useAuth();
    const [defects, setDefects] = useState<Inspection[]>([]);
    const [selectedDefect, setSelectedDefect] = useState<Inspection | null>(null);
    const [works, setWorks] = useState<RepairWork[]>([]);
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWorkForm, setShowWorkForm] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [workForm, setWorkForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        planned_date: ''
    });

    const canEdit = hasRole(['admin', 'inspector']);

    useEffect(() => {
        fetchDefects();
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

            if (response.ok && selectedDefect) {
                fetchWorks(selectedDefect.id);
            }
        } catch (error) {
            console.error('Error updating work:', error);
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

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'bg-gray-100 text-gray-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            critical: 'bg-red-100 text-red-700'
        };
        return colors[priority] || colors.medium;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            planned: 'bg-blue-100 text-blue-700',
            in_progress: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-gray-100 text-gray-700'
        };
        return colors[status] || colors.planned;
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            planned: 'Запланировано',
            in_progress: 'В работе',
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Управление дефектами</h1>
                    <p className="text-gray-500">Планирование работ и фотофиксация</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span>Всего дефектов: {defects.length}</span>
                </div>
            </div>

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

                {/* Defect Details & Work Planning */}
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

                            {/* Photo Upload */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                    <Camera className="w-5 h-5 mr-2" />
                                    Фотофиксация
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

                                    {/* After photos */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">После ремонта</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {media.filter(m => !m.is_before).map((m) => (
                                                <div key={m.id} className="relative group">
                                                    <img
                                                        src={`${API_URL}/api/media/file/${m.id}`}
                                                        alt={m.description || 'Фото после ремонта'}
                                                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                    />
                                                </div>
                                            ))}
                                            {canEdit && (
                                                <label className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
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
                                        Запланированные работы
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
                                                <div className="flex items-center space-x-2">
                                                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(work.status)}`}>
                                                        {getStatusLabel(work.status)}
                                                    </span>
                                                    {canEdit && work.status !== 'completed' && (
                                                        <select
                                                            value={work.status}
                                                            onChange={(e) => handleUpdateWorkStatus(work.id, e.target.value)}
                                                            className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700"
                                                        >
                                                            <option value="planned">Запланировано</option>
                                                            <option value="in_progress">В работе</option>
                                                            <option value="completed">Выполнено</option>
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
                                Выберите дефект из списка слева для просмотра деталей, планирования работ и добавления фото
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
