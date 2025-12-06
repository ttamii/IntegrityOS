export interface Pipeline {
    id: number;
    pipeline_id: string;
    name: string;
    description?: string;
    total_length?: number;
    created_at: string;
}

export interface PipelineObject {
    id: number;
    object_id: number;
    object_name: string;
    object_type: 'crane' | 'compressor' | 'pipeline_section';
    pipeline_id: string;
    lat: number;
    lon: number;
    year?: number;
    material?: string;
    created_at: string;
    inspections?: Inspection[];
}

export interface Inspection {
    id: number;
    diag_id: number;
    object_id: number;
    method: InspectionMethod;
    date: string;
    temperature?: number;
    humidity?: number;
    illumination?: number;
    defect_found: boolean;
    defect_description?: string;
    quality_grade?: QualityGrade;
    param1?: number;
    param2?: number;
    param3?: number;
    ml_label?: RiskLevel;
    ml_confidence?: number;
    created_at: string;
    object?: PipelineObject;
}

export type InspectionMethod =
    | 'VIK' | 'PVK' | 'MPK' | 'UZK' | 'RGK'
    | 'TVK' | 'VIBRO' | 'MFL' | 'TFI' | 'GEO' | 'UTWM';

export type QualityGrade =
    | 'удовлетворительно'
    | 'допустимо'
    | 'требует_мер'
    | 'недопустимо';

export type RiskLevel = 'normal' | 'medium' | 'high';

export interface DashboardStats {
    total_objects: number;
    total_inspections: number;
    total_defects: number;
    defects_by_method: Record<string, number>;
    defects_by_risk: Record<string, number>;
    inspections_by_year: Record<string, number>;
    defects_by_year: Record<string, number>;
    top_risks: Array<{
        object_name: string;
        object_id: number;
        description: string;
        risk_level: RiskLevel;
        confidence: number;
    }>;
}

export interface ImportResult {
    success: boolean;
    total_rows: number;
    imported_rows: number;
    errors: string[];
    warnings: string[];
}

export interface InspectionFilter {
    method?: InspectionMethod;
    date_from?: string;
    date_to?: string;
    defect_found?: boolean;
    risk_level?: RiskLevel;
    pipeline_id?: string;
    object_type?: string;
    object_id?: number;
}
