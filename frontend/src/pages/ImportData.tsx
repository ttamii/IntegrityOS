import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Plus, ClipboardList } from 'lucide-react';
import { importAPI, objectsAPI, inspectionsAPI } from '../services/api';
import type { ImportResult } from '../types';

type TabType = 'file' | 'object' | 'inspection';

export default function ImportData() {
    const [activeTab, setActiveTab] = useState<TabType>('file');
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Object form state
    const [objectForm, setObjectForm] = useState({
        object_id: '',
        object_name: '',
        object_type: 'pipeline_section',
        pipeline_id: 'MT-01',
        lat: '',
        lon: '',
        year: '',
        material: ''
    });

    // Inspection form state
    const [inspectionForm, setInspectionForm] = useState({
        diag_id: '',
        object_id: '',
        method: 'VIK',
        date: new Date().toISOString().split('T')[0],
        temperature: '',
        humidity: '',
        defect_found: false,
        defect_description: '',
        quality_grade: 'допустимо',
        param1: '',
        param2: '',
        param3: ''
    });

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        try {
            setImporting(true);
            const data = await importAPI.uploadCSV(file);
            setResult(data);
        } catch (error) {
            console.error('Import failed:', error);
            setResult({
                success: false,
                total_rows: 0,
                imported_rows: 0,
                errors: ['Ошибка при импорте файла. Проверьте формат данных.'],
                warnings: []
            });
        } finally {
            setImporting(false);
        }
    };

    const resetImport = () => {
        setFile(null);
        setResult(null);
    };

    const handleObjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        try {
            setImporting(true);
            await objectsAPI.create({
                object_id: parseInt(objectForm.object_id),
                object_name: objectForm.object_name,
                object_type: objectForm.object_type as any,
                pipeline_id: objectForm.pipeline_id,
                lat: parseFloat(objectForm.lat),
                lon: parseFloat(objectForm.lon),
                year: objectForm.year ? parseInt(objectForm.year) : undefined,
                material: objectForm.material || undefined
            });
            setSuccessMessage('Объект успешно добавлен!');
            setObjectForm({
                object_id: '',
                object_name: '',
                object_type: 'pipeline_section',
                pipeline_id: 'MT-01',
                lat: '',
                lon: '',
                year: '',
                material: ''
            });
        } catch (error: any) {
            console.error('Error creating object:', error);
            alert(error.response?.data?.detail || 'Ошибка при создании объекта');
        } finally {
            setImporting(false);
        }
    };

    const handleInspectionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        try {
            setImporting(true);
            await inspectionsAPI.create({
                diag_id: parseInt(inspectionForm.diag_id),
                object_id: parseInt(inspectionForm.object_id),
                method: inspectionForm.method as any,
                date: inspectionForm.date,
                temperature: inspectionForm.temperature ? parseFloat(inspectionForm.temperature) : undefined,
                humidity: inspectionForm.humidity ? parseFloat(inspectionForm.humidity) : undefined,
                defect_found: inspectionForm.defect_found,
                defect_description: inspectionForm.defect_description || undefined,
                quality_grade: inspectionForm.quality_grade as any,
                param1: inspectionForm.param1 ? parseFloat(inspectionForm.param1) : undefined,
                param2: inspectionForm.param2 ? parseFloat(inspectionForm.param2) : undefined,
                param3: inspectionForm.param3 ? parseFloat(inspectionForm.param3) : undefined
            });
            setSuccessMessage('Обследование успешно добавлено!');
            setInspectionForm({
                diag_id: '',
                object_id: '',
                method: 'VIK',
                date: new Date().toISOString().split('T')[0],
                temperature: '',
                humidity: '',
                defect_found: false,
                defect_description: '',
                quality_grade: 'допустимо',
                param1: '',
                param2: '',
                param3: ''
            });
        } catch (error: any) {
            console.error('Error creating inspection:', error);
            alert(error.response?.data?.detail || 'Ошибка при создании обследования');
        } finally {
            setImporting(false);
        }
    };

    const tabs = [
        { id: 'file' as TabType, label: 'Загрузка файла', icon: Upload },
        { id: 'object' as TabType, label: 'Добавить объект', icon: Plus },
        { id: 'inspection' as TabType, label: 'Добавить обследование', icon: ClipboardList }
    ];

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSuccessMessage(''); }}
                            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon className="w-5 h-5 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {successMessage}
                        </div>
                    )}

                    {/* File Upload Tab */}
                    {activeTab === 'file' && (
                        <div className="space-y-6">
                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-blue-800 mb-2">Инструкции</h3>
                                <div className="space-y-1 text-gray-700 text-sm">
                                    <p>• Поддерживаемые форматы: <strong>CSV</strong> и <strong>XLSX</strong></p>
                                    <p>• Максимальный размер файла: <strong>50 MB</strong></p>
                                </div>
                            </div>

                            {/* Upload Area */}
                            {!file ? (
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-900 text-lg mb-2">Перетащите файл сюда</p>
                                    <p className="text-gray-500 mb-4">или</p>
                                    <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                                        Выбрать файл
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center">
                                            <FileText className="h-8 w-8 text-blue-500 mr-3" />
                                            <div>
                                                <p className="text-gray-900 font-medium">{file.name}</p>
                                                <p className="text-gray-500 text-sm">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={resetImport} className="text-gray-400 hover:text-gray-600">
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    {!result && (
                                        <button
                                            onClick={handleImport}
                                            disabled={importing}
                                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                                        >
                                            {importing ? 'Импорт...' : 'Импортировать'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Import Result */}
                            {result && (
                                <div className={`rounded-lg p-4 border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                    }`}>
                                    <div className="flex items-start">
                                        {result.success ? (
                                            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                                        )}
                                        <div>
                                            <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                                {result.success ? 'Импорт выполнен!' : 'Ошибка импорта'}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Импортировано: {result.imported_rows} из {result.total_rows}
                                            </p>
                                            {result.errors.length > 0 && (
                                                <div className="mt-2 text-sm text-red-600">
                                                    {result.errors.slice(0, 3).map((err, i) => (
                                                        <p key={i}>• {err}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Object Tab */}
                    {activeTab === 'object' && (
                        <form onSubmit={handleObjectSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ID объекта *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={objectForm.object_id}
                                        onChange={(e) => setObjectForm({ ...objectForm, object_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="1001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Название *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={objectForm.object_name}
                                        onChange={(e) => setObjectForm({ ...objectForm, object_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="Участок трубы №15"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Тип объекта *
                                    </label>
                                    <select
                                        required
                                        value={objectForm.object_type}
                                        onChange={(e) => setObjectForm({ ...objectForm, object_type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="pipeline_section">Участок трубы</option>
                                        <option value="crane">Кран</option>
                                        <option value="compressor">Компрессор</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ID трубопровода *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={objectForm.pipeline_id}
                                        onChange={(e) => setObjectForm({ ...objectForm, pipeline_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="MT-01"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Широта *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={objectForm.lat}
                                        onChange={(e) => setObjectForm({ ...objectForm, lat: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="43.2380"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Долгота *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={objectForm.lon}
                                        onChange={(e) => setObjectForm({ ...objectForm, lon: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="76.9450"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Год установки
                                    </label>
                                    <input
                                        type="number"
                                        value={objectForm.year}
                                        onChange={(e) => setObjectForm({ ...objectForm, year: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="2015"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Материал
                                    </label>
                                    <input
                                        type="text"
                                        value={objectForm.material}
                                        onChange={(e) => setObjectForm({ ...objectForm, material: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="Сталь 20"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={importing}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium"
                            >
                                {importing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Сохранение...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 mr-2" />
                                        Добавить объект
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Add Inspection Tab */}
                    {activeTab === 'inspection' && (
                        <form onSubmit={handleInspectionSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ID обследования *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={inspectionForm.diag_id}
                                        onChange={(e) => setInspectionForm({ ...inspectionForm, diag_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="5001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ID объекта *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={inspectionForm.object_id}
                                        onChange={(e) => setInspectionForm({ ...inspectionForm, object_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Метод контроля *
                                    </label>
                                    <select
                                        required
                                        value={inspectionForm.method}
                                        onChange={(e) => setInspectionForm({ ...inspectionForm, method: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="VIK">VIK - Визуальный</option>
                                        <option value="UZK">UZK - Ультразвуковой</option>
                                        <option value="RGK">RGK - Рентгенографический</option>
                                        <option value="MFL">MFL - Магнитный</option>
                                        <option value="PVK">PVK - Капиллярный</option>
                                        <option value="MPK">MPK - Магнитопорошковый</option>
                                        <option value="TVK">TVK - Телевизионный</option>
                                        <option value="TFI">TFI - Термография</option>
                                        <option value="GEO">GEO - Геодезический</option>
                                        <option value="VIBRO">VIBRO - Вибрация</option>
                                        <option value="UTWM">UTWM - УЗ толщинометрия</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Дата обследования *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={inspectionForm.date}
                                        onChange={(e) => setInspectionForm({ ...inspectionForm, date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Температура (°C)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={inspectionForm.temperature}
                                        onChange={(e) => setInspectionForm({ ...inspectionForm, temperature: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="22.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Влажность (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={inspectionForm.humidity}
                                        onChange={(e) => setInspectionForm({ ...inspectionForm, humidity: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="45"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Оценка качества
                                    </label>
                                    <select
                                        value={inspectionForm.quality_grade}
                                        onChange={(e) => setInspectionForm({ ...inspectionForm, quality_grade: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="удовлетворительно">Удовлетворительно</option>
                                        <option value="допустимо">Допустимо</option>
                                        <option value="требует_мер">Требует мер</option>
                                        <option value="недопустимо">Недопустимо</option>
                                    </select>
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={inspectionForm.defect_found}
                                            onChange={(e) => setInspectionForm({ ...inspectionForm, defect_found: e.target.checked })}
                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">Дефект обнаружен</span>
                                    </label>
                                </div>

                                {inspectionForm.defect_found && (
                                    <>
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Описание дефекта
                                            </label>
                                            <textarea
                                                value={inspectionForm.defect_description}
                                                onChange={(e) => setInspectionForm({ ...inspectionForm, defect_description: e.target.value })}
                                                rows={2}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                                placeholder="Коррозия поверхностная, глубина 2мм"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Глубина (мм)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={inspectionForm.param1}
                                                onChange={(e) => setInspectionForm({ ...inspectionForm, param1: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                                placeholder="2.5"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Длина (мм)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={inspectionForm.param2}
                                                onChange={(e) => setInspectionForm({ ...inspectionForm, param2: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                                placeholder="15.0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ширина (мм)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={inspectionForm.param3}
                                                onChange={(e) => setInspectionForm({ ...inspectionForm, param3: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                                placeholder="8.0"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={importing}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium"
                            >
                                {importing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Сохранение...
                                    </>
                                ) : (
                                    <>
                                        <ClipboardList className="w-5 h-5 mr-2" />
                                        Добавить обследование
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
