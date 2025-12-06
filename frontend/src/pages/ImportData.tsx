import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { importAPI } from '../services/api';
import type { ImportResult } from '../types';

export default function ImportData() {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [dragActive, setDragActive] = useState(false);

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

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Импорт данных</h1>
                <p className="text-gray-600">Загрузка CSV/XLSX файлов с данными обследований</p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-300 mb-3">📋 Инструкции</h2>
                <div className="space-y-2 text-gray-700 text-sm">
                    <p>• Поддерживаемые форматы: <strong>CSV</strong> и <strong>XLSX</strong></p>
                    <p>• Для объектов: файл должен содержать колонки <code className="bg-slate-700 px-2 py-1 rounded">object_id, object_name, object_type, pipeline_id, lat, lon</code></p>
                    <p>• Для диагностик: файл должен содержать колонки <code className="bg-slate-700 px-2 py-1 rounded">diag_id, object_id, method, date, defect_found</code></p>
                    <p>• Максимальный размер файла: <strong>50 MB</strong></p>
                    <p className="text-yellow-300 mt-3">
                        💡 <strong>Примечание:</strong> Организаторы пришлют реальный датасет позже. Пока можно использовать сгенерированные тестовые данные.
                    </p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-lg p-8">
                {!file ? (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                                ? 'border-primary-500 bg-primary-900/20'
                                : 'border-gray-300 hover:border-slate-500'
                            }`}
                    >
                        <Upload className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-white text-lg mb-2">Перетащите файл сюда</p>
                        <p className="text-gray-600 mb-4">или</p>
                        <label className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
                            Выбрать файл
                            <input
                                type="file"
                                accept=".csv,.xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                        <p className="text-slate-500 text-sm mt-4">CSV или XLSX, до 50 MB</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* File Info */}
                        <div className="flex items-center justify-between bg-slate-700 rounded-lg p-4">
                            <div className="flex items-center">
                                <FileText className="h-8 w-8 text-primary-400 mr-3" />
                                <div>
                                    <p className="text-white font-medium">{file.name}</p>
                                    <p className="text-gray-600 text-sm">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={resetImport}
                                className="text-gray-600 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Import Button */}
                        {!result && (
                            <button
                                onClick={handleImport}
                                disabled={importing}
                                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {importing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Импорт...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5 mr-2" />
                                        Импортировать
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Import Result */}
            {result && (
                <div className={`rounded-lg p-6 ${result.success ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'
                    }`}>
                    <div className="flex items-start">
                        {result.success ? (
                            <CheckCircle className="h-6 w-6 text-green-400 mr-3 flex-shrink-0 mt-1" />
                        ) : (
                            <AlertCircle className="h-6 w-6 text-red-400 mr-3 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                            <h3 className={`text-lg font-semibold mb-3 ${result.success ? 'text-green-300' : 'text-red-300'
                                }`}>
                                {result.success ? 'Импорт выполнен успешно!' : 'Импорт завершен с ошибками'}
                            </h3>

                            {/* Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p className="text-gray-600 text-sm">Всего строк</p>
                                    <p className="text-white text-xl font-bold">{result.total_rows}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Импортировано</p>
                                    <p className="text-green-400 text-xl font-bold">{result.imported_rows}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Ошибок</p>
                                    <p className="text-red-400 text-xl font-bold">{result.errors.length}</p>
                                </div>
                            </div>

                            {/* Warnings */}
                            {result.warnings.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-yellow-300 font-medium mb-2">⚠️ Предупреждения:</h4>
                                    <div className="bg-white/50 rounded p-3 max-h-40 overflow-y-auto">
                                        {result.warnings.map((warning, index) => (
                                            <p key={index} className="text-yellow-200 text-sm mb-1">• {warning}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Errors */}
                            {result.errors.length > 0 && (
                                <div>
                                    <h4 className="text-red-300 font-medium mb-2">❌ Ошибки:</h4>
                                    <div className="bg-white/50 rounded p-3 max-h-40 overflow-y-auto">
                                        {result.errors.map((error, index) => (
                                            <p key={index} className="text-red-200 text-sm mb-1">• {error}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Import Button */}
                            <button
                                onClick={resetImport}
                                className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Импортировать другой файл
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sample Data Info */}
            <div className="bg-white rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-3">📁 Тестовые данные</h2>
                <p className="text-gray-700 mb-4">
                    Для тестирования системы используйте сгенерированные файлы из директории <code className="bg-slate-700 px-2 py-1 rounded">backend/data/</code>
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                    <p>• <strong>Objects.csv</strong> - объекты контроля (краны, компрессоры, участки труб)</p>
                    <p>• <strong>Diagnostics.csv</strong> - результаты обследований с дефектами</p>
                    <p>• <strong>Pipelines.csv</strong> - информация о трубопроводах</p>
                </div>
            </div>
        </div>
    );
}
