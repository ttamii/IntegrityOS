import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Environment } from '@react-three/drei';
import { useAuth } from '../context/AuthContext';
import { Box3D, RotateCcw, ZoomIn, AlertTriangle } from 'lucide-react';
import * as THREE from 'three';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface PipelineSegment {
    id: number;
    position: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    defectsCount: number;
    pipelineId: string;
    objectName?: string;
}

// Single pipe segment component
function PipeSegment({
    segment,
    position,
    onClick,
    isSelected
}: {
    segment: PipelineSegment;
    position: [number, number, number];
    onClick: () => void;
    isSelected: boolean;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'critical': return '#ef4444'; // red
            case 'high': return '#f97316'; // orange
            case 'medium': return '#eab308'; // yellow
            default: return '#22c55e'; // green
        }
    };

    useFrame(() => {
        if (meshRef.current && (hovered || isSelected)) {
            meshRef.current.rotation.z += 0.01;
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                scale={isSelected ? 1.1 : hovered ? 1.05 : 1}
            >
                <cylinderGeometry args={[0.3, 0.3, 1.8, 32]} />
                <meshStandardMaterial
                    color={getRiskColor(segment.riskLevel)}
                    metalness={0.6}
                    roughness={0.3}
                    emissive={getRiskColor(segment.riskLevel)}
                    emissiveIntensity={hovered || isSelected ? 0.3 : 0.1}
                />
            </mesh>

            {/* Connector ring */}
            <mesh position={[0, 0.95, 0]}>
                <torusGeometry args={[0.35, 0.05, 16, 32]} />
                <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Defect indicator */}
            {segment.defectsCount > 0 && (
                <Html position={[0, 0.6, 0.5]} center>
                    <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-lg">
                        {segment.defectsCount}
                    </div>
                </Html>
            )}
        </group>
    );
}

// Full pipeline component
function Pipeline({
    segments,
    onSegmentClick,
    selectedId
}: {
    segments: PipelineSegment[];
    onSegmentClick: (segment: PipelineSegment) => void;
    selectedId: number | null;
}) {
    const groupRef = useRef<THREE.Group>(null);

    // Rotate pipeline horizontally
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.z = Math.PI / 2;
        }
    });

    return (
        <group ref={groupRef}>
            {segments.map((segment, i) => (
                <PipeSegment
                    key={segment.id}
                    segment={segment}
                    position={[0, i * 2 - (segments.length - 1), 0]}
                    onClick={() => onSegmentClick(segment)}
                    isSelected={selectedId === segment.id}
                />
            ))}
        </group>
    );
}

// Legend component
function Legend() {
    return (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Уровень риска</h4>
            <div className="space-y-1 text-xs">
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-700">Низкий</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-gray-700">Средний</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                    <span className="text-gray-700">Высокий</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-gray-700">Критический</span>
                </div>
            </div>
        </div>
    );
}

export default function Pipeline3D() {
    const { token } = useAuth();
    const [segments, setSegments] = useState<PipelineSegment[]>([]);
    const [selectedSegment, setSelectedSegment] = useState<PipelineSegment | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPipeline, setSelectedPipeline] = useState<string>('all');
    const [pipelines, setPipelines] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        if (!token) return;

        try {
            // Fetch inspections with risk data
            const response = await fetch(`${API_URL}/api/inspections?limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const inspections = await response.json();

                // Group by object and calculate risk
                const objectMap = new Map<number, {
                    defects: number;
                    risk: string;
                    pipeline: string;
                    name: string;
                }>();

                const pipelineSet = new Set<string>();

                inspections.forEach((insp: any) => {
                    pipelineSet.add(insp.pipeline_id || 'Unknown');

                    const existing = objectMap.get(insp.object_id);
                    const defectCount = insp.defect_found ? 1 : 0;

                    if (existing) {
                        existing.defects += defectCount;
                        // Upgrade risk level if higher found
                        if (insp.ml_label === 'high' || insp.ml_label === 'critical') {
                            existing.risk = insp.ml_label;
                        }
                    } else {
                        objectMap.set(insp.object_id, {
                            defects: defectCount,
                            risk: insp.ml_label || 'low',
                            pipeline: insp.pipeline_id || 'Unknown',
                            name: insp.object_name || `Объект ${insp.object_id}`
                        });
                    }
                });

                setPipelines(Array.from(pipelineSet));

                // Convert to segments
                const segs: PipelineSegment[] = [];
                let pos = 0;
                objectMap.forEach((value, key) => {
                    segs.push({
                        id: key,
                        position: pos++,
                        riskLevel: value.risk as any,
                        defectsCount: value.defects,
                        pipelineId: value.pipeline,
                        objectName: value.name
                    });
                });

                setSegments(segs);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSegments = selectedPipeline === 'all'
        ? segments.slice(0, 20) // Limit for performance
        : segments.filter(s => s.pipelineId === selectedPipeline).slice(0, 20);

    return (
        <div className="h-[calc(100vh-120px)] relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Box3D className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900">3D Визуализация трубопровода</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <select
                            value={selectedPipeline}
                            onChange={(e) => setSelectedPipeline(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="all">Все трубопроводы</option>
                            {pipelines.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                        <div className="text-sm text-gray-500">
                            <RotateCcw className="w-4 h-4 inline mr-1" />
                            Вращение: мышь |
                            <ZoomIn className="w-4 h-4 inline mx-1" />
                            Зум: колёсико
                        </div>
                    </div>
                </div>
            </div>

            {/* 3D Canvas */}
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <Canvas
                    camera={{ position: [15, 5, 15], fov: 50 }}
                    style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)' }}
                >
                    <Suspense fallback={null}>
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 5]} intensity={1} />
                        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#60a5fa" />

                        <Pipeline
                            segments={filteredSegments}
                            onSegmentClick={setSelectedSegment}
                            selectedId={selectedSegment?.id || null}
                        />

                        {/* Floor grid */}
                        <gridHelper args={[50, 50, '#374151', '#1f2937']} rotation={[0, 0, 0]} />

                        <OrbitControls
                            enableDamping
                            dampingFactor={0.05}
                            minDistance={5}
                            maxDistance={50}
                        />

                        <Environment preset="city" />
                    </Suspense>
                </Canvas>
            )}

            {/* Legend */}
            <Legend />

            {/* Selected segment info */}
            {selectedSegment && (
                <div className="absolute top-20 right-4 bg-white rounded-lg shadow-xl p-4 z-10 w-72">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Детали сегмента</h3>
                        <button
                            onClick={() => setSelectedSegment(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">ID объекта:</span>
                            <span className="font-medium text-gray-900">{selectedSegment.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Название:</span>
                            <span className="font-medium text-gray-900">{selectedSegment.objectName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Трубопровод:</span>
                            <span className="font-medium text-gray-900">{selectedSegment.pipelineId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Уровень риска:</span>
                            <span className={`font-medium px-2 py-0.5 rounded ${selectedSegment.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                                    selectedSegment.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                                        selectedSegment.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                }`}>
                                {selectedSegment.riskLevel === 'critical' ? 'Критический' :
                                    selectedSegment.riskLevel === 'high' ? 'Высокий' :
                                        selectedSegment.riskLevel === 'medium' ? 'Средний' : 'Низкий'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Дефектов:</span>
                            <span className="font-medium text-gray-900">{selectedSegment.defectsCount}</span>
                        </div>
                    </div>
                    {selectedSegment.defectsCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center text-amber-600 text-sm">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Требуется внимание
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
