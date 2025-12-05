import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { reportsAPI } from '../services/api';

export default function Reports() {
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
                // Open HTML in new window
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(data);
                    newWindow.document.close();
                }
            } else {
                // Download PDF
                const blob = new Blob([data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `integrityos_report_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Ошибка при генерации отчета');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Генерация отчетов</h1>
                <p className="text-slate-400">Создание отчетов по обследованиям в HTML или PDF формате</p>
            </div>

            {/* Report Configuration */}
            <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Настройки отчета</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Формат отчета
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setFormat('html')}
                                className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${format === 'html'
                                        ? 'border-primary-500 bg-primary-900/30 text-white'
                                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                    }`}
                            >
                                <FileText className="h-5 w-5 mr-2" />
                                HTML
                            </button>
                            <button
                                onClick={() => setFormat('pdf')}
                                className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${format === 'pdf'
                                        ? 'border-primary-500 bg-primary-900/30 text-white'
                                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                    }`}
                            >
                                <Download className="h-5 w-5 mr-2" />
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Период
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">От</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">До</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pipeline Filter */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Трубопровод
                        </label>
                        <select
                            value={pipelineId}
                            onChange={(e) => setPipelineId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Все трубопроводы</option>
                            <option value="MT-01">MT-01</option>
                            <option value="MT-02">MT-02</option>
                            <option value="MT-03">MT-03</option>
                        </select>
                    </div>

                    {/* Risk Level Filter */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Уровень риска
                        </label>
                        <select
                            value={riskLevel}
                            onChange={(e) => setRiskLevel(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Все уровни</option>
                            <option value="normal">Низкий</option>
                            <option value="medium">Средний</option>
                            <option value="high">Высокий</option>
                        </select>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="mt-8">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
                    >
                        {generating ? (
                            <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                Генерация отчета...
                            </>
                        ) : (
                            <>
                                <FileText className="h-6 w-6 mr-3" />
                                Сгенерировать отчет
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Report Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">📄 HTML Отчет</h3>
                    <ul className="space-y-2 text-slate-300 text-sm">
                        <li>• Открывается в новом окне браузера</li>
                        <li>• Интерактивные таблицы и графики</li>
                        <li>• Удобен для просмотра онлайн</li>
                        <li>• Можно сохранить через браузер</li>
                    </ul>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">📑 PDF Отчет</h3>
                    <ul className="space-y-2 text-slate-300 text-sm">
                        <li>• Автоматически скачивается</li>
                        <li>• Готов к печати</li>
                        <li>• Удобен для архивирования</li>
                        <li>• Можно отправить по email</li>
                    </ul>
                </div>
            </div>

            {/* Report Content Info */}
            <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📊 Содержание отчета</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                    <div>
                        <h4 className="font-medium text-white mb-2">Общая статистика:</h4>
                        <ul className="space-y-1 ml-4">
                            <li>• Количество объектов</li>
                            <li>• Количество обследований</li>
                            <li>• Количество дефектов</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-2">Аналитика:</h4>
                        <ul className="space-y-1 ml-4">
                            <li>• Распределение по методам контроля</li>
                            <li>• Распределение по уровням риска</li>
                            <li>• Топ-5 критичных объектов</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-2">Детальные данные:</h4>
                        <ul className="space-y-1 ml-4">
                            <li>• Список всех дефектов</li>
                            <li>• Параметры дефектов</li>
                            <li>• Рекомендации по устранению</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-2">Дополнительно:</h4>
                        <ul className="space-y-1 ml-4">
                            <li>• Дата создания отчета</li>
                            <li>• Примененные фильтры</li>
                            <li>• Карта участков (опционально)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
