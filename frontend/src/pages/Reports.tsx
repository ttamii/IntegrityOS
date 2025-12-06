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
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(data);
                    newWindow.document.close();
                }
            } else {
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
        <div className="max-w-4xl">
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

                    {/* Generate Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-base"
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
        </div>
    );
}
