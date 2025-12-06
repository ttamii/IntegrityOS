from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class ObjectType(str, Enum):
    CRANE = "crane"
    COMPRESSOR = "compressor"
    PIPELINE_SECTION = "pipeline_section"


class InspectionMethod(str, Enum):
    VIK = "VIK"
    PVK = "PVK"
    MPK = "MPK"
    UZK = "UZK"
    RGK = "RGK"
    TVK = "TVK"
    VIBRO = "VIBRO"
    MFL = "MFL"
    TFI = "TFI"
    GEO = "GEO"
    UTWM = "UTWM"


class QualityGrade(str, Enum):
    SATISFACTORY = "удовлетворительно"
    ACCEPTABLE = "допустимо"
    REQUIRES_ACTION = "требует_мер"
    UNACCEPTABLE = "недопустимо"


class RiskLevel(str, Enum):
    NORMAL = "normal"
    MEDIUM = "medium"
    HIGH = "high"


class UserRole(str, Enum):
    ADMIN = "admin"
    INSPECTOR = "inspector"
    ANALYST = "analyst"
    GUEST = "guest"


# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RoleUpdate(BaseModel):
    role: str


# Pipeline Schemas
class PipelineBase(BaseModel):
    pipeline_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    total_length: Optional[float] = None


class PipelineCreate(PipelineBase):
    pass


class Pipeline(PipelineBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Object Schemas
class ObjectBase(BaseModel):
    object_id: int
    object_name: str
    object_type: ObjectType
    pipeline_id: str
    lat: float
    lon: float
    year: Optional[int] = None
    material: Optional[str] = None


class ObjectCreate(ObjectBase):
    pass


class ObjectResponse(ObjectBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Inspection Schemas
class InspectionBase(BaseModel):
    diag_id: int
    object_id: int
    method: InspectionMethod
    date: date
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    illumination: Optional[float] = None
    defect_found: bool = False
    defect_description: Optional[str] = None
    quality_grade: Optional[QualityGrade] = None
    param1: Optional[float] = None
    param2: Optional[float] = None
    param3: Optional[float] = None
    ml_label: Optional[RiskLevel] = None
    ml_confidence: Optional[float] = None


class InspectionCreate(InspectionBase):
    pass


class InspectionResponse(InspectionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Extended response with relationships
class ObjectWithInspections(ObjectResponse):
    inspections: List[InspectionResponse] = []


class InspectionWithObject(InspectionResponse):
    object: Optional[ObjectResponse] = None


# Dashboard Schemas
class DashboardStats(BaseModel):
    total_objects: int
    total_inspections: int
    total_defects: int
    defects_by_method: dict
    defects_by_risk: dict
    inspections_by_year: dict
    defects_by_year: dict = {}
    top_risks: List[dict]


# Import Schemas
class ImportResult(BaseModel):
    success: bool
    total_rows: int
    imported_rows: int
    errors: List[str] = []
    warnings: List[str] = []


# Filter Schemas
class InspectionFilter(BaseModel):
    method: Optional[InspectionMethod] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    defect_found: Optional[bool] = None
    risk_level: Optional[RiskLevel] = None
    pipeline_id: Optional[str] = None
    object_type: Optional[ObjectType] = None


# Media Schemas
class MediaType(str, Enum):
    PHOTO = "photo"
    VIDEO = "video"


class MediaBase(BaseModel):
    description: Optional[str] = None
    is_before: bool = True


class MediaCreate(MediaBase):
    inspection_id: int


class MediaResponse(MediaBase):
    id: int
    inspection_id: int
    media_type: MediaType
    filename: str
    original_name: Optional[str]
    file_path: str
    uploaded_by: Optional[int]
    uploaded_at: datetime

    class Config:
        from_attributes = True


# Repair Work Schemas
class WorkStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RepairWorkBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    planned_date: Optional[date] = None
    assigned_to: Optional[int] = None
    notes: Optional[str] = None


class RepairWorkCreate(RepairWorkBase):
    inspection_id: int


class RepairWorkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[WorkStatus] = None
    planned_date: Optional[date] = None
    completed_date: Optional[date] = None
    assigned_to: Optional[int] = None
    notes: Optional[str] = None


class RepairWorkResponse(RepairWorkBase):
    id: int
    inspection_id: int
    status: WorkStatus
    completed_date: Optional[date]
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

