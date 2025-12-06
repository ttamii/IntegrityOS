from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
from datetime import date
from app import models, schemas


# Pipeline CRUD
def get_pipeline(db: Session, pipeline_id: str):
    return db.query(models.Pipeline).filter(models.Pipeline.pipeline_id == pipeline_id).first()


def get_pipelines(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Pipeline).offset(skip).limit(limit).all()


def create_pipeline(db: Session, pipeline: schemas.PipelineCreate):
    db_pipeline = models.Pipeline(**pipeline.model_dump())
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    return db_pipeline


# Object CRUD
def get_object(db: Session, object_id: int):
    return db.query(models.Object).filter(models.Object.object_id == object_id).first()


def get_objects(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    pipeline_id: Optional[str] = None,
    object_type: Optional[str] = None
):
    query = db.query(models.Object)
    
    if pipeline_id:
        query = query.filter(models.Object.pipeline_id == pipeline_id)
    if object_type:
        query = query.filter(models.Object.object_type == object_type)
    
    return query.offset(skip).limit(limit).all()


def create_object(db: Session, obj: schemas.ObjectCreate):
    db_object = models.Object(**obj.model_dump())
    db.add(db_object)
    db.commit()
    db.refresh(db_object)
    return db_object


# Inspection CRUD
def get_inspection(db: Session, diag_id: int):
    return db.query(models.Inspection).filter(models.Inspection.diag_id == diag_id).first()


def get_inspections(
    db: Session,
    skip: int = 0,
    limit: int = 1000,
    object_id: Optional[int] = None,
    method: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    defect_found: Optional[bool] = None,
    risk_level: Optional[str] = None,
    pipeline_id: Optional[str] = None
):
    query = db.query(models.Inspection)
    
    if object_id:
        query = query.filter(models.Inspection.object_id == object_id)
    if method:
        query = query.filter(models.Inspection.method == method)
    if date_from:
        query = query.filter(models.Inspection.date >= date_from)
    if date_to:
        query = query.filter(models.Inspection.date <= date_to)
    if defect_found is not None:
        query = query.filter(models.Inspection.defect_found == defect_found)
    if risk_level:
        query = query.filter(models.Inspection.ml_label == risk_level)
    if pipeline_id:
        query = query.join(models.Object).filter(models.Object.pipeline_id == pipeline_id)
    
    return query.offset(skip).limit(limit).all()


def create_inspection(db: Session, inspection: schemas.InspectionCreate):
    db_inspection = models.Inspection(**inspection.model_dump())
    db.add(db_inspection)
    db.commit()
    db.refresh(db_inspection)
    return db_inspection


# Dashboard Statistics
def get_dashboard_stats(db: Session):
    total_objects = db.query(func.count(models.Object.id)).scalar()
    total_inspections = db.query(func.count(models.Inspection.id)).scalar()
    total_defects = db.query(func.count(models.Inspection.id)).filter(
        models.Inspection.defect_found == True
    ).scalar()
    
    # Defects by method
    defects_by_method = db.query(
        models.Inspection.method,
        func.count(models.Inspection.id).label('count')
    ).filter(
        models.Inspection.defect_found == True
    ).group_by(models.Inspection.method).all()
    
    # Defects by risk level
    defects_by_risk = db.query(
        models.Inspection.ml_label,
        func.count(models.Inspection.id).label('count')
    ).filter(
        models.Inspection.defect_found == True,
        models.Inspection.ml_label.isnot(None)
    ).group_by(models.Inspection.ml_label).all()
    
    # Inspections by year (using strftime for SQLite compatibility)
    inspections_by_year = db.query(
        func.strftime('%Y', models.Inspection.date).label('year'),
        func.count(models.Inspection.id).label('count')
    ).group_by(func.strftime('%Y', models.Inspection.date)).all()
    
    # Top 5 high-risk objects
    top_risks = db.query(
        models.Object.object_name,
        models.Object.object_id,
        models.Inspection.defect_description,
        models.Inspection.ml_label,
        models.Inspection.ml_confidence
    ).join(
        models.Inspection
    ).filter(
        models.Inspection.ml_label == 'high',
        models.Inspection.defect_found == True
    ).order_by(
        models.Inspection.ml_confidence.desc()
    ).limit(5).all()
    
    # Defects by year (using strftime for SQLite compatibility)
    defects_by_year = db.query(
        func.strftime('%Y', models.Inspection.date).label('year'),
        func.count(models.Inspection.id).label('count')
    ).filter(
        models.Inspection.defect_found == True
    ).group_by(func.strftime('%Y', models.Inspection.date)).all()
    
    return {
        "total_objects": total_objects,
        "total_inspections": total_inspections,
        "total_defects": total_defects,
        "defects_by_method": {method.value if hasattr(method, 'value') else str(method): count for method, count in defects_by_method},
        "defects_by_risk": {risk.value if hasattr(risk, 'value') else str(risk): count for risk, count in defects_by_risk},
        "inspections_by_year": {str(year): count for year, count in inspections_by_year if year},
        "defects_by_year": {str(year): count for year, count in defects_by_year if year},
        "top_risks": [
            {
                "object_name": name,
                "object_id": obj_id,
                "description": desc,
                "risk_level": risk.value if hasattr(risk, 'value') else str(risk),
                "confidence": conf
            }
            for name, obj_id, desc, risk, conf in top_risks
        ]
    }


# Get objects with inspections for map
def get_objects_with_inspections(db: Session, filters: Optional[dict] = None):
    query = db.query(models.Object).join(models.Inspection)
    
    if filters:
        if filters.get('method'):
            query = query.filter(models.Inspection.method == filters['method'])
        if filters.get('date_from'):
            query = query.filter(models.Inspection.date >= filters['date_from'])
        if filters.get('date_to'):
            query = query.filter(models.Inspection.date <= filters['date_to'])
        if filters.get('risk_level'):
            query = query.filter(models.Inspection.ml_label == filters['risk_level'])
        if filters.get('defect_found') is not None:
            query = query.filter(models.Inspection.defect_found == filters['defect_found'])
    
    return query.distinct().all()
