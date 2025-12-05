from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.ObjectResponse])
def get_objects(
    skip: int = 0,
    limit: int = 100,
    pipeline_id: Optional[str] = None,
    object_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all objects with optional filtering"""
    objects = crud.get_objects(
        db,
        skip=skip,
        limit=limit,
        pipeline_id=pipeline_id,
        object_type=object_type
    )
    return objects


@router.get("/{object_id}", response_model=schemas.ObjectWithInspections)
def get_object(object_id: int, db: Session = Depends(get_db)):
    """Get a specific object with all its inspections"""
    obj = crud.get_object(db, object_id=object_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Object not found")
    return obj


@router.post("/", response_model=schemas.ObjectResponse)
def create_object(obj: schemas.ObjectCreate, db: Session = Depends(get_db)):
    """Create a new object"""
    # Check if object_id already exists
    existing = crud.get_object(db, object_id=obj.object_id)
    if existing:
        raise HTTPException(status_code=400, detail="Object ID already exists")
    return crud.create_object(db, obj)


@router.get("/map/markers", response_model=List[schemas.ObjectWithInspections])
def get_map_markers(
    method: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    risk_level: Optional[str] = None,
    defect_found: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get objects for map visualization with filters"""
    filters = {}
    if method:
        filters['method'] = method
    if date_from:
        filters['date_from'] = date_from
    if date_to:
        filters['date_to'] = date_to
    if risk_level:
        filters['risk_level'] = risk_level
    if defect_found is not None:
        filters['defect_found'] = defect_found
    
    objects = crud.get_objects_with_inspections(db, filters=filters if filters else None)
    return objects
