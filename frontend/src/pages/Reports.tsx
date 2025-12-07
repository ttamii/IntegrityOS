import { useState } from 'react';
import { FileText, Download, Calendar, ClipboardList, Zap, FileCheck, Database, Shield, Award } from 'lucide-react';
import { reportsAPI } from '../services/api';

const REPORT_TYPES = [
    { id: 'questionnaire', name: 'Опросный лист', icon: ClipboardList, color: 'bg-purple-500', description: 'Характеристики трубопровода и ТЗ на диагностику' },
    { id: 'express', name: 'Экспресс-отчёт', icon: Zap, color: 'bg-orange-500', description: 'Оперативный отчёт с предварительными данными' },
    { id: 'final', name: 'Заключительный отчёт', icon: FileCheck, color: 'bg-blue-500', description: 'Полная документация по результатам диагностики' },
    { id: 'csv', name: 'CSV/FFP отчёт', icon: Database, color: 'bg-green-500', description: 'Выгрузка данных для интеграции' },
    { id: 'ndt', name: 'ДДК-отчёт', icon: Shield, color: 'bg-red-500', description: 'Верификация дефектов методами НК' },
    { id: 'epb', name: 'Заключение ЭПБ', icon: Award, color: 'bg-indigo-500', description: 'Экспертиза промышленной безопасности' },
];

export default function Reports() {
    const [reportType, setReportType] = useState('final');
    const [format, setFormat] = useState<'html' | 'pdf'>('html');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [pipelineId, setPipelineId] = useState('');
    const [riskLevel, setRiskLevel] = useState('');
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        try {
            setGenerating(true);

            const params = {
                format,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                pipeline_id: pipelineId || undefined,
                risk_level: riskLevel || undefined,
            };

            const data = await reportsAPI.generate(params);

            if (format === 'html') {
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(data);
                    newWindow.document.close();
                }
            } else {
                // Use direct link to get proper filename from server
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const queryParams = new URLSearchParams();
                queryParams.set('format', 'pdf');
                if (dateFrom) queryParams.set('date_from', dateFrom);
                if (dateTo) queryParams.set('date_to', dateTo);
                if (pipelineId) queryParams.set('pipeline_id', pipelineId);
                if (riskLevel) queryParams.set('risk_level', riskLevel);

                window.open(`${API_URL}/api/reports/generate?${queryParams.toString()}`, '_blank');
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Ошибка при генерации отчета');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-6xl">
            {/* Report Type Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Тип отчёта</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {REPORT_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.id}
                                onClick={() => setReportType(type.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${reportType === type.id
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                            >
                                <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center mb-3`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-900 text-sm">{type.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Настройки отчета</h2>

                <div className="space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Формат отчета
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setFormat('html')}
                                className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all font-medium ${format === 'html'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                <FileText className="h-5 w-5 mr-2" />
                                HTML
                            </button>
                            <button
                                onClick={() => setFormat('pdf')}
                                className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all font-medium ${format === 'pdf'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                <Download className="h-5 w-5 mr-2" />
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Filters Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                От
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                До
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Pipeline Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Трубопровод
                            </label>
                            <select
                                value={pipelineId}
                                onChange={(e) => setPipelineId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Все трубопроводы</option>
                                <option value="MT-01">MT-01</option>
                                <option value="MT-02">MT-02</option>
                                <option value="MT-03">MT-03</option>
                            </select>
                        </div>

                        {/* Risk Level Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Уровень риска
                            </label>
                            <select
                                value={riskLevel}
                                onChange={(e) => setRiskLevel(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Все уровни</option>
                                <option value="normal">Низкий</option>
                                <option value="medium">Средний</option>
                                <option value="high">Высокий</option>
                            </select>
                        </div>
                    </div>

                    {/* Template Download & Generate Buttons */}
                    <div className="pt-4 flex gap-4">
                        <a
                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/reports/template/${reportType}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-base"
                        >
                            <Download className="h-5 w-5 mr-2" />
                            Скачать шаблон
                        </a>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-base"
                        >
                            {generating ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Генерация отчета...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-5 w-5 mr-2" />
                                    Сгенерировать отчет
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Reports Archive */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Архив отчётов</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Дата</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Формат</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Период</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Трубопровод</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Действие</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-900">2024-12-07 03:45</td>
                                <td className="py-3 px-4">
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">PDF</span>
                                </td>
                                <td className="py-3 px-4 text-gray-600">Все даты</td>
                                <td className="py-3 px-4 text-gray-600">Все</td>
                                <td className="py-3 px-4 text-right">
                                    <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-end">
                                        <Download className="w-4 h-4 mr-1" />
                                        Скачать
                                    </button>
                                </td>
                            </tr>
                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-900">2024-12-06 14:21</td>
                                <td className="py-3 px-4">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">HTML</span>
                                </td>
                                <td className="py-3 px-4 text-gray-600">01.11 - 30.11.2024</td>
                                <td className="py-3 px-4 text-gray-600">MT-01</td>
                                <td className="py-3 px-4 text-right">
                                    <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-end">
                                        <Download className="w-4 h-4 mr-1" />
                                        Скачать
                                    </button>
                                </td>
                            </tr>
                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-900">2024-12-05 09:12</td>
                                <td className="py-3 px-4">
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">PDF</span>
                                </td>
                                <td className="py-3 px-4 text-gray-600">Все даты</td>
                                <td className="py-3 px-4 text-gray-600">MT-02</td>
                                <td className="py-3 px-4 text-right">
                                    <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-end">
                                        <Download className="w-4 h-4 mr-1" />
                                        Скачать
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">Отчёты хранятся 30 дней</p>
            </div>
        </div>
    );
}
