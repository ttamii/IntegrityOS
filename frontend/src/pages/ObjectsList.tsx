import { useEffect, useState } from 'react';
import { Search, Filter, X, Download } from 'lucide-react';
import { objectsAPI, inspectionsAPI } from '../services/api';
import type { PipelineObject, Inspection } from '../types';

export default function ObjectsList() {
    const [objects, setObjects] = useState<PipelineObject[]>([]);
    const [selectedObject, setSelectedObject] = useState<PipelineObject | null>(null);
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [sortBy, setSortBy] = useState<'none' | 'depth_asc' | 'depth_desc'>('none');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadObjects();
    }, [filterType]);

    const loadObjects = async () => {
        try {
            setLoading(true);
            const data = await objectsAPI.getAll({
                object_type: filterType || undefined
            });
            setObjects(data);
        } catch (error) {
            console.error('Failed to load objects:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadObjectDetails = async (objectId: number) => {
        try {
            const [objData, inspData] = await Promise.all([
                objectsAPI.getById(objectId),
                inspectionsAPI.getAll({ object_id: objectId })
            ]);
            setSelectedObject(objData);
            setInspections(inspData);
        } catch (error) {
            console.error('Failed to load object details:', error);
        }
    };

    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const params = new URLSearchParams();
            if (filterType) params.append('object_type', filterType);

            const response = await fetch(`http://localhost:8000/api/objects/export/excel?${params}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `integrityos_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to export:', error);
            alert('Ошибка при экспорте данных');
        } finally {
            setExporting(false);
        }
    };

    const filteredObjects = objects.filter(obj =>
        obj.object_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.object_id.toString().includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Список объектов</h1>
                    <p className="text-gray-600">Просмотр и поиск объектов контроля</p>
                </div>
                <button
                    onClick={handleExportExcel}
                    disabled={exporting || objects.length === 0}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="h-5 w-5 mr-2" />
                    {exporting ? 'Экспорт...' : 'Экспорт в Excel'}
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                        <input
                            type="text"
                            placeholder="Поиск по названию или ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Все типы</option>
                            <option value="crane">Краны</option>
                            <option value="compressor">Компрессоры</option>
                            <option value="pipeline_section">Участки трубопровода</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Objects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Objects List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Объекты ({filteredObjects.length})
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {filteredObjects.map((obj) => (
                                <div
                                    key={obj.object_id}
                                    onClick={() => loadObjectDetails(obj.object_id)}
                                    className={`bg-white rounded-lg p-4 cursor-pointer transition-all border border-gray-200 ${selectedObject?.object_id === obj.object_id
                                        ? 'ring-2 ring-blue-500 bg-blue-50'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-gray-900 font-semibold">{obj.object_name}</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                ID: {obj.object_id} • {obj.pipeline_id}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="px-2 py-1 bg-slate-600 text-gray-700 rounded text-xs">
                                                    {obj.object_type}
                                                </span>
                                                {obj.year && (
                                                    <span className="px-2 py-1 bg-slate-600 text-gray-700 rounded text-xs">
                                                        {obj.year}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Object Details */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Детали объекта</h2>
                        {selectedObject && (
                            <button
                                onClick={() => setSelectedObject(null)}
                                className="text-gray-600 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {selectedObject ? (
                        <div className="space-y-4">
                            {/* Object Info Card */}
                            <div className="bg-white rounded-lg p-6">
                                <h3 className="text-xl font-bold text-white mb-4">{selectedObject.object_name}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">ID объекта</p>
                                        <p className="text-white font-medium">{selectedObject.object_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Тип</p>
                                        <p className="text-white font-medium">{selectedObject.object_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Трубопровод</p>
                                        <p className="text-white font-medium">{selectedObject.pipeline_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Год</p>
                                        <p className="text-white font-medium">{selectedObject.year || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Материал</p>
                                        <p className="text-white font-medium">{selectedObject.material || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Координаты</p>
                                        <p className="text-white font-medium">
                                            {selectedObject.lat.toFixed(4)}, {selectedObject.lon.toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Inspections History */}
                            <div className="bg-white rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        История обследований ({inspections.length})
                                    </h3>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="px-3 py-1 bg-slate-700 border border-gray-300 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="none">По дате</option>
                                        <option value="depth_asc">По глубине ↑</option>
                                        <option value="depth_desc">По глубине ↓</option>
                                    </select>
                                </div>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {inspections.length > 0 ? (
                                        (() => {
                                            let sorted = [...inspections];
                                            if (sortBy === 'depth_asc') {
                                                sorted.sort((a, b) => (a.param1 || 0) - (b.param1 || 0));
                                            } else if (sortBy === 'depth_desc') {
                                                sorted.sort((a, b) => (b.param1 || 0) - (a.param1 || 0));
                                            }
                                            return sorted;
                                        })().map((insp) => (
                                            <div key={insp.diag_id} className="bg-slate-700 rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <span className="text-white font-medium">{insp.method}</span>
                                                        <p className="text-gray-600 text-sm">{insp.date}</p>
                                                    </div>
                                                    {insp.ml_label && (
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs font-medium text-white ${insp.ml_label === 'high'
                                                                ? 'bg-red-500'
                                                                : insp.ml_label === 'medium'
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-green-500'
                                                                }`}
                                                        >
                                                            {insp.ml_label.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                {insp.defect_found && (
                                                    <div className="mt-2">
                                                        <p className="text-gray-700 text-sm">
                                                            <strong>Дефект:</strong> {insp.defect_description || 'Не указан'}
                                                        </p>
                                                        {insp.quality_grade && (
                                                            <p className="text-gray-700 text-sm mt-1">
                                                                <strong>Оценка:</strong> {insp.quality_grade}
                                                            </p>
                                                        )}
                                                        {insp.param1 && (
                                                            <p className="text-gray-700 text-sm mt-1">
                                                                <strong>Параметры:</strong> {insp.param1}mm × {insp.param2}mm × {insp.param3}mm
                                                            </p>
                                                        )}
                                                        {insp.ml_confidence && (
                                                            <p className="text-gray-700 text-sm mt-1">
                                                                <strong>Уверенность ML:</strong> {(insp.ml_confidence * 100).toFixed(0)}%
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-600 text-center py-8">Нет данных об обследованиях</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg p-12 text-center">
                            <p className="text-gray-600">Выберите объект для просмотра деталей</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
