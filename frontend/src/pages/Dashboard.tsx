import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import type { DashboardStats } from '../types';

const RISK_COLORS = {
    normal: '#4ade80',
    medium: '#fbbf24',
    high: '#f87171',
};

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await dashboardAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center text-gray-600 py-12">
                <p>Не удалось загрузить статистику</p>
            </div>
        );
    }

    // Prepare data for charts
    const methodsData = Object.entries(stats.defects_by_method).map(([method, count]) => ({
        method,
        count,
    }));

    const riskData = Object.entries(stats.defects_by_risk).map(([risk, count]) => {
        let name = 'Неизвестно';
        if (risk === 'normal') name = 'Низкий';
        else if (risk === 'medium') name = 'Средний';
        else if (risk === 'high') name = 'Высокий';

        return {
            name,
            value: count,
            color: RISK_COLORS[risk as keyof typeof RISK_COLORS] || '#9ca3af',
        };
    });

    const yearsData = Object.entries(stats.inspections_by_year).map(([year, count]) => ({
        year,
        count,
    })).sort((a, b) => parseInt(a.year) - parseInt(b.year));

    const defectsYearsData = stats.defects_by_year
        ? Object.entries(stats.defects_by_year).map(([year, count]) => ({
            year,
            count,
        })).sort((a, b) => parseInt(a.year) - parseInt(b.year))
        : [];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Activity className="h-8 w-8" />}
                    label="Всего объектов"
                    value={stats.total_objects}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={<TrendingUp className="h-8 w-8" />}
                    label="Обследований"
                    value={stats.total_inspections}
                    color="bg-green-500"
                />
                <StatCard
                    icon={<AlertTriangle className="h-8 w-8" />}
                    label="Дефектов"
                    value={stats.total_defects}
                    color="bg-yellow-500"
                />
                <StatCard
                    icon={<CheckCircle className="h-8 w-8" />}
                    label="Успешность"
                    value={`${Math.round((1 - stats.total_defects / stats.total_inspections) * 100)}%`}
                    color="bg-purple-500"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Defects by Method */}
                <div className="bg-white rounded-lg p-6 card-hover">
                    <h2 className="text-xl font-semibold text-white mb-4">Дефекты по методам контроля</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={methodsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="method" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                labelStyle={{ color: '#e2e8f0' }}
                            />
                            <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk Distribution */}
                <div className="bg-white rounded-lg p-6 card-hover">
                    <h2 className="text-xl font-semibold text-white mb-4">Распределение по уровням риска</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={riskData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {riskData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Inspections Timeline */}
                <div className="bg-white rounded-lg p-6 card-hover">
                    <h2 className="text-xl font-semibold text-white mb-4">Динамика обследований по годам</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={yearsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="year" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                labelStyle={{ color: '#e2e8f0' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Обследований" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Defects Timeline */}
                <div className="bg-white rounded-lg p-6 card-hover">
                    <h2 className="text-xl font-semibold text-white mb-4">Динамика дефектов по годам</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={defectsYearsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="year" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                labelStyle={{ color: '#e2e8f0' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#f87171" strokeWidth={2} name="Дефектов" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Risks Table */}
            {stats.top_risks.length > 0 && (
                <div className="bg-white rounded-lg p-6 card-hover">
                    <h2 className="text-xl font-semibold text-white mb-4">Топ-5 критичных объектов</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium">Объект</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium">Описание</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium">Уровень риска</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-medium">Уверенность</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.top_risks.map((risk, index) => (
                                    <tr key={index} className="border-b border-gray-200 hover:bg-slate-700/50 transition-colors">
                                        <td className="py-3 px-4 text-gray-900">{risk.object_name}</td>
                                        <td className="py-3 px-4 text-gray-700">{risk.description || 'N/A'}</td>
                                        <td className="py-3 px-4">
                                            <span
                                                className="px-3 py-1 rounded-full text-sm font-medium"
                                                style={{
                                                    backgroundColor: RISK_COLORS[risk.risk_level],
                                                    color: 'white'
                                                }}
                                            >
                                                {risk.risk_level.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-700">
                                            {(risk.confidence * 100).toFixed(0)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
    return (
        <div className="bg-white rounded-lg p-6 card-hover">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm mb-1">{label}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`${color} p-3 rounded-lg text-gray-900`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
