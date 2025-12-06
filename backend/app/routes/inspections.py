from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app import crud, schemas, models
from app.database import get_db
from app.routes.auth import require_role

router = APIRouter()


@router.get("/", response_model=List[schemas.InspectionResponse])
def get_inspections(
    skip: int = 0,
    limit: int = 1000,
    object_id: Optional[int] = None,
    method: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    defect_found: Optional[bool] = None,
    risk_level: Optional[str] = None,
    pipeline_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all inspections with optional filtering"""
    inspections = crud.get_inspections(
        db,
        skip=skip,
        limit=limit,
        object_id=object_id,
        method=method,
        date_from=date_from,
        date_to=date_to,
        defect_found=defect_found,
        risk_level=risk_level,
        pipeline_id=pipeline_id
    )
    return inspections


@router.get("/{diag_id}", response_model=schemas.InspectionWithObject)
def get_inspection(diag_id: int, db: Session = Depends(get_db)):
    """Get a specific inspection with object details"""
    inspection = crud.get_inspection(db, diag_id=diag_id)
    if inspection is None:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection


@router.post("/", response_model=schemas.InspectionResponse)
async def create_inspection(
    inspection: schemas.InspectionCreate,
    current_user: models.User = Depends(require_role(["admin", "inspector"])),
    db: Session = Depends(get_db)
):
    """Create a new inspection (admin/inspector only)"""
    # Check if diag_id already exists
    existing = crud.get_inspection(db, diag_id=inspection.diag_id)
    if existing:
        raise HTTPException(status_code=400, detail="Diagnostic ID already exists")
    
    # Check if object exists
    obj = crud.get_object(db, object_id=inspection.object_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")
    
    return crud.create_inspection(db, inspection)
