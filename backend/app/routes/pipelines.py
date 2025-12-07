from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app import crud, schemas, models
from app.database import get_db
from app.routes.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[schemas.Pipeline])
def get_pipelines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all pipelines"""
    pipelines = crud.get_pipelines(db, skip=skip, limit=limit)
    return pipelines


@router.get("/{pipeline_id}/stats")
def get_pipeline_stats(
    pipeline_id: str,
    db: Session = Depends(get_db)
):
    """Get statistics for a specific pipeline including objects and defects"""
    # Get pipeline
    pipeline = crud.get_pipeline(db, pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    # Get objects for this pipeline
    objects = db.query(models.Object).filter(
        models.Object.pipeline_id == pipeline_id
    ).all()
    
    # Get inspections with defects for each object
    object_stats = []
    for obj in objects:
        inspections = db.query(models.Inspection).filter(
            models.Inspection.object_id == obj.object_id
        ).all()
        
        defect_count = sum(1 for insp in inspections if insp.defect_found)
        
        # Determine highest risk level
        risk_levels = [str(insp.ml_label.value) if insp.ml_label else None for insp in inspections]
        risk_levels = [r for r in risk_levels if r]
        if 'high' in risk_levels:
            max_risk = 'high'
        elif 'medium' in risk_levels:
            max_risk = 'medium'
        else:
            max_risk = 'normal'
        
        object_stats.append({
            "object_id": obj.object_id,
            "object_name": obj.object_name,
            "object_type": obj.object_type.value if obj.object_type else "pipeline_section",
            "lat": obj.lat,
            "lon": obj.lon,
            "year": obj.year,
            "material": obj.material,
            "defect_count": defect_count,
            "risk_level": max_risk,
            "inspection_count": len(inspections)
        })
    
    return {
        "pipeline_id": pipeline.pipeline_id,
        "name": pipeline.name,
        "description": pipeline.description,
        "total_length": pipeline.total_length,
        "objects": object_stats,
        "total_objects": len(objects),
        "total_defects": sum(o["defect_count"] for o in object_stats)
    }


@router.get("/visualization/3d")
def get_3d_visualization_data(
    pipeline_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get data for 3D pipeline visualization - objects with risk levels and defects"""
    
    # Get all pipelines
    pipelines = crud.get_pipelines(db)
    
    # Build visualization data
    result = {
        "pipelines": [],
        "segments": []
    }
    
    # Add pipeline info
    for p in pipelines:
        result["pipelines"].append({
            "id": p.pipeline_id,
            "name": p.name or p.pipeline_id
        })
    
    # Get objects (filter by pipeline if specified)
    query = db.query(models.Object)
    if pipeline_id and pipeline_id != "all":
        query = query.filter(models.Object.pipeline_id == pipeline_id)
    
    objects = query.order_by(models.Object.object_id).limit(50).all()
    
    if not objects:
        return result
    
    # Get all object IDs
    object_ids = [obj.object_id for obj in objects]
    
    # Batch fetch all inspections for these objects
    all_inspections = db.query(models.Inspection).filter(
        models.Inspection.object_id.in_(object_ids)
    ).all()
    
    # Group inspections by object_id
    inspections_by_object = {}
    for insp in all_inspections:
        if insp.object_id not in inspections_by_object:
            inspections_by_object[insp.object_id] = []
        inspections_by_object[insp.object_id].append(insp)
    
    # Build segments
    for idx, obj in enumerate(objects):
        inspections = inspections_by_object.get(obj.object_id, [])
        
        defect_count = sum(1 for insp in inspections if insp.defect_found)
        
        # Determine risk level based on ml_label
        risk_levels = [str(insp.ml_label.value) if insp.ml_label else None for insp in inspections]
        risk_levels = [r for r in risk_levels if r]  # Filter out None
        if 'high' in risk_levels:
            risk = 'high'
        elif 'medium' in risk_levels:
            risk = 'medium'
        else:
            risk = 'low'
            
        result["segments"].append({
            "id": obj.object_id,
            "position": idx,
            "riskLevel": risk,
            "defectsCount": defect_count,
            "pipelineId": obj.pipeline_id or "Unknown",
            "objectName": obj.object_name,
            "objectType": obj.object_type.value if obj.object_type else "pipeline_section",
            "lat": obj.lat,
            "lon": obj.lon,
            "year": obj.year,
            "material": obj.material
        })
    
    return result
