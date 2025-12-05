import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Filter, X } from 'lucide-react';
import { objectsAPI } from '../services/api';
import type { PipelineObject, InspectionFilter, RiskLevel } from '../types';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Pipeline routes (matching backend data generator)
const PIPELINE_ROUTES = {
    'MT-01': [
        [51.1694, 71.4491],
        [43.2220, 76.8512],
    ],
    'MT-02': [
        [52.2873, 76.9474],
        [49.8047, 73.1094],
    ],
    'MT-03': [
        [50.2839, 57.1670],
        [47.1164, 51.9211],
    ],
};

const RISK_COLORS: Record<RiskLevel, string> = {
    normal: '#4ade80',
    medium: '#fbbf24',
    high: '#f87171',
};

function createColoredIcon(color: string) {
    return new Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path fill="${color}" stroke="white" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `)}`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
}

export default function MapView() {
    const [objects, setObjects] = useState<PipelineObject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<InspectionFilter>({});

    useEffect(() => {
        loadObjects();
    }, [filters]);

    const loadObjects = async () => {
        try {
            setLoading(true);
            const data = await objectsAPI.getMapMarkers(filters);
            setObjects(data);
        } catch (error) {
            console.error('Failed to load objects:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRiskLevel = (obj: PipelineObject): RiskLevel => {
        if (!obj.inspections || obj.inspections.length === 0) return 'normal';

        const hasHighRisk = obj.inspections.some(i => i.ml_label === 'high');
        if (hasHighRisk) return 'high';

        const hasMediumRisk = obj.inspections.some(i => i.ml_label === 'medium');
        if (hasMediumRisk) return 'medium';

        return 'normal';
    };

    const center: [number, number] = [48.0196, 66.9237]; // Kazakhstan center

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Карта объектов</h1>
                    <p className="text-slate-400">Визуализация трубопроводов и дефектов</p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    {showFilters ? <X className="h-5 w-5 mr-2" /> : <Filter className="h-5 w-5 mr-2" />}
                    Фильтры
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-slate-800 rounded-lg p-6 card-hover">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Уровень риска
                            </label>
                            <select
                                value={filters.risk_level || ''}
                                onChange={(e) => setFilters({ ...filters, risk_level: e.target.value as RiskLevel || undefined })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Все</option>
                                <option value="normal">Низкий</option>
                                <option value="medium">Средний</option>
                                <option value="high">Высокий</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Дата от
                            </label>
                            <input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Дата до
                            </label>
                            <input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => setFilters({})}
                            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Сбросить фильтры
                        </button>
                    </div>
                </div>
            )}

            {/* Map */}
            <div className="bg-slate-800 rounded-lg p-4 card-hover" style={{ height: '600px' }}>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : (
                    <MapContainer
                        center={center}
                        zoom={6}
                        style={{ height: '100%', width: '100%' }}
                        className="rounded-lg"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Pipeline routes */}
                        {Object.entries(PIPELINE_ROUTES).map(([pipelineId, coords]) => (
                            <Polyline
                                key={pipelineId}
                                positions={coords as [number, number][]}
                                color="#3b82f6"
                                weight={3}
                                opacity={0.7}
                            />
                        ))}

                        {/* Object markers */}
                        {objects.map((obj) => {
                            const riskLevel = getRiskLevel(obj);
                            const icon = createColoredIcon(RISK_COLORS[riskLevel]);

                            return (
                                <Marker
                                    key={obj.object_id}
                                    position={[obj.lat, obj.lon]}
                                    icon={icon}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <h3 className="font-bold text-lg mb-2">{obj.object_name}</h3>
                                            <div className="space-y-1 text-sm">
                                                <p><strong>ID:</strong> {obj.object_id}</p>
                                                <p><strong>Тип:</strong> {obj.object_type}</p>
                                                <p><strong>Трубопровод:</strong> {obj.pipeline_id}</p>
                                                <p><strong>Материал:</strong> {obj.material || 'N/A'}</p>
                                                <p><strong>Год:</strong> {obj.year || 'N/A'}</p>
                                                <p>
                                                    <strong>Уровень риска:</strong>{' '}
                                                    <span
                                                        className="px-2 py-1 rounded text-white text-xs font-medium"
                                                        style={{ backgroundColor: RISK_COLORS[riskLevel] }}
                                                    >
                                                        {riskLevel.toUpperCase()}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                )}
            </div>

            {/* Legend */}
            <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Легенда</h3>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: RISK_COLORS.normal }}></div>
                        <span className="text-slate-300 text-sm">Низкий риск</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: RISK_COLORS.medium }}></div>
                        <span className="text-slate-300 text-sm">Средний риск</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: RISK_COLORS.high }}></div>
                        <span className="text-slate-300 text-sm">Высокий риск</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-8 h-0.5 bg-primary-500 mr-2"></div>
                        <span className="text-slate-300 text-sm">Трубопровод</span>
                    </div>
                </div>
                <p className="text-slate-400 text-sm mt-3">
                    Всего объектов на карте: <strong className="text-white">{objects.length}</strong>
                </p>
            </div>
        </div>
    );
}
