from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class ObjectType(str, enum.Enum):
    CRANE = "crane"
    COMPRESSOR = "compressor"
    PIPELINE_SECTION = "pipeline_section"


class InspectionMethod(str, enum.Enum):
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


class QualityGrade(str, enum.Enum):
    SATISFACTORY = "удовлетворительно"
    ACCEPTABLE = "допустимо"
    REQUIRES_ACTION = "требует_мер"
    UNACCEPTABLE = "недопустимо"


class RiskLevel(str, enum.Enum):
    NORMAL = "normal"
    MEDIUM = "medium"
    HIGH = "high"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    INSPECTOR = "inspector"
    ANALYST = "analyst"
    GUEST = "guest"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.GUEST, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255))
    description = Column(Text)
    total_length = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    objects = relationship("Object", back_populates="pipeline")


class Object(Base):
    __tablename__ = "objects"

    id = Column(Integer, primary_key=True, index=True)
    object_id = Column(Integer, unique=True, nullable=False, index=True)
    object_name = Column(String(255), nullable=False)
    object_type = Column(Enum(ObjectType), nullable=False)
    pipeline_id = Column(String(50), ForeignKey("pipelines.pipeline_id"))
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    year = Column(Integer)
    material = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    pipeline = relationship("Pipeline", back_populates="objects")
    inspections = relationship("Inspection", back_populates="object")


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    diag_id = Column(Integer, unique=True, nullable=False, index=True)
    object_id = Column(Integer, ForeignKey("objects.object_id"), nullable=False)
    method = Column(Enum(InspectionMethod), nullable=False)
    date = Column(Date, nullable=False)
    temperature = Column(Float)
    humidity = Column(Float)
    illumination = Column(Float)
    defect_found = Column(Boolean, default=False)
    defect_description = Column(Text)
    quality_grade = Column(Enum(QualityGrade))
    param1 = Column(Float)
    param2 = Column(Float)
    param3 = Column(Float)
    ml_label = Column(Enum(RiskLevel))
    ml_confidence = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    object = relationship("Object", back_populates="inspections")
    media = relationship("Media", back_populates="inspection")
    repair_works = relationship("RepairWork", back_populates="inspection")


class MediaType(str, enum.Enum):
    PHOTO = "photo"
    VIDEO = "video"


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    media_type = Column(Enum(MediaType), default=MediaType.PHOTO)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255))
    file_path = Column(String(500), nullable=False)
    description = Column(Text)
    is_before = Column(Boolean, default=True)  # True = до ремонта, False = после
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    inspection = relationship("Inspection", back_populates="media")
    uploader = relationship("User")


class WorkStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    PENDING_APPROVAL = "pending_approval"  # Inspector completed, awaiting admin verification
    COMPLETED = "completed"  # Admin verified
    CANCELLED = "cancelled"


class RepairWork(Base):
    __tablename__ = "repair_works"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    status = Column(Enum(WorkStatus), default=WorkStatus.PLANNED)
    planned_date = Column(Date)
    completed_date = Column(Date)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    inspection = relationship("Inspection", back_populates="repair_works")
    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])
