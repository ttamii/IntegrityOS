"""
Repair work routes for defect management and work planning.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app import models, schemas
from app.routes.auth import get_current_user, require_role

router = APIRouter()


@router.post("/", response_model=schemas.RepairWorkResponse)
async def create_repair_work(
    work: schemas.RepairWorkCreate,
    current_user: models.User = Depends(require_role(["admin", "inspector"])),
    db: Session = Depends(get_db)
):
    """Create a new repair work order (admin/inspector only)"""
    
    # Check if inspection exists
    inspection = db.query(models.Inspection).filter(
        models.Inspection.id == work.inspection_id
    ).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    db_work = models.RepairWork(
        inspection_id=work.inspection_id,
        title=work.title,
        description=work.description,
        priority=work.priority,
        planned_date=work.planned_date,
        assigned_to=work.assigned_to,
        notes=work.notes,
        created_by=current_user.id,
        status=models.WorkStatus.PLANNED
    )
    
    db.add(db_work)
    db.commit()
    db.refresh(db_work)
    
    return db_work


@router.get("/", response_model=List[schemas.RepairWorkResponse])
async def get_repair_works(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all repair works with optional filtering"""
    query = db.query(models.RepairWork)
    
    if status:
        query = query.filter(models.RepairWork.status == status)
    if priority:
        query = query.filter(models.RepairWork.priority == priority)
    if assigned_to:
        query = query.filter(models.RepairWork.assigned_to == assigned_to)
    
    works = query.order_by(models.RepairWork.created_at.desc()).offset(skip).limit(limit).all()
    return works


@router.get("/inspection/{inspection_id}", response_model=List[schemas.RepairWorkResponse])
async def get_works_by_inspection(
    inspection_id: int,
    db: Session = Depends(get_db)
):
    """Get all repair works for a specific inspection"""
    works = db.query(models.RepairWork).filter(
        models.RepairWork.inspection_id == inspection_id
    ).order_by(models.RepairWork.created_at.desc()).all()
    return works


@router.get("/{work_id}", response_model=schemas.RepairWorkResponse)
async def get_repair_work(
    work_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific repair work"""
    work = db.query(models.RepairWork).filter(models.RepairWork.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Repair work not found")
    return work


@router.put("/{work_id}", response_model=schemas.RepairWorkResponse)
async def update_repair_work(
    work_id: int,
    work_update: schemas.RepairWorkUpdate,
    current_user: models.User = Depends(require_role(["admin", "inspector"])),
    db: Session = Depends(get_db)
):
    """Update a repair work (admin/inspector only)"""
    work = db.query(models.RepairWork).filter(models.RepairWork.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Repair work not found")
    
    update_data = work_update.model_dump(exclude_unset=True)
    
    # If status is being set to completed, set completed_date
    if update_data.get("status") == "completed" and not work.completed_date:
        update_data["completed_date"] = date.today()
    
    for field, value in update_data.items():
        setattr(work, field, value)
    
    db.commit()
    db.refresh(work)
    
    return work


@router.delete("/{work_id}")
async def delete_repair_work(
    work_id: int,
    current_user: models.User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete a repair work (admin only)"""
    work = db.query(models.RepairWork).filter(models.RepairWork.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Repair work not found")
    
    db.delete(work)
    db.commit()
    
    return {"message": "Repair work deleted successfully"}


@router.post("/{work_id}/complete", response_model=schemas.RepairWorkResponse)
async def submit_for_approval(
    work_id: int,
    notes: Optional[str] = None,
    current_user: models.User = Depends(require_role(["admin", "inspector"])),
    db: Session = Depends(get_db)
):
    """
    Submit work for approval (inspector marks as done).
    Inspector: sets status to pending_approval.
    Admin: can directly complete.
    """
    work = db.query(models.RepairWork).filter(models.RepairWork.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Repair work not found")
    
    # Admin can directly complete, Inspector submits for approval
    if current_user.role == models.UserRole.ADMIN:
        work.status = models.WorkStatus.COMPLETED
        work.completed_date = date.today()
        if notes:
            work.notes = (work.notes or "") + f"\n\nЗавершено (Admin): {notes}"
    else:
        work.status = models.WorkStatus.PENDING_APPROVAL
        if notes:
            work.notes = (work.notes or "") + f"\n\nОтправлено на проверку: {notes}"
    
    db.commit()
    db.refresh(work)
    
    return work


@router.post("/{work_id}/approve", response_model=schemas.RepairWorkResponse)
async def approve_work(
    work_id: int,
    approved: bool = True,
    notes: Optional[str] = None,
    current_user: models.User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Approve or reject a work (admin only)"""
    work = db.query(models.RepairWork).filter(models.RepairWork.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Repair work not found")
    
    if work.status != models.WorkStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail="Work is not pending approval")
    
    if approved:
        work.status = models.WorkStatus.COMPLETED
        work.completed_date = date.today()
        if notes:
            work.notes = (work.notes or "") + f"\n\nПодтверждено администратором: {notes}"
    else:
        work.status = models.WorkStatus.IN_PROGRESS
        if notes:
            work.notes = (work.notes or "") + f"\n\nОтклонено, требуется доработка: {notes}"
    
    db.commit()
    db.refresh(work)
    
    return work

