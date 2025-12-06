"""
Media routes for photo/video uploads.
"""

import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.routes.auth import get_current_user, require_role

router = APIRouter()

# Media storage directory
MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "media")
os.makedirs(MEDIA_DIR, exist_ok=True)


@router.post("/upload", response_model=schemas.MediaResponse)
async def upload_media(
    file: UploadFile = File(...),
    inspection_id: int = Form(...),
    is_before: bool = Form(True),
    description: Optional[str] = Form(None),
    current_user: models.User = Depends(require_role(["admin", "inspector"])),
    db: Session = Depends(get_db)
):
    """Upload a photo or video for an inspection (admin/inspector only)"""
    
    # Check if inspection exists
    inspection = db.query(models.Inspection).filter(
        models.Inspection.id == inspection_id
    ).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed: {', '.join(allowed_types)}"
        )
    
    # Determine media type
    media_type = models.MediaType.PHOTO if file.content_type.startswith("image") else models.MediaType.VIDEO
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(MEDIA_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create media record
    db_media = models.Media(
        inspection_id=inspection_id,
        media_type=media_type,
        filename=unique_filename,
        original_name=file.filename,
        file_path=file_path,
        description=description,
        is_before=is_before,
        uploaded_by=current_user.id
    )
    
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    
    return db_media


@router.get("/inspection/{inspection_id}", response_model=List[schemas.MediaResponse])
async def get_media_by_inspection(
    inspection_id: int,
    db: Session = Depends(get_db)
):
    """Get all media for a specific inspection"""
    media = db.query(models.Media).filter(
        models.Media.inspection_id == inspection_id
    ).order_by(models.Media.uploaded_at.desc()).all()
    return media


@router.get("/file/{media_id}")
async def get_media_file(
    media_id: int,
    db: Session = Depends(get_db)
):
    """Get the actual media file"""
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    if not os.path.exists(media.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        media.file_path,
        media_type="image/jpeg" if media.media_type == models.MediaType.PHOTO else "video/mp4",
        filename=media.original_name or media.filename
    )


@router.delete("/{media_id}")
async def delete_media(
    media_id: int,
    current_user: models.User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete a media file (admin only)"""
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Delete file from disk
    if os.path.exists(media.file_path):
        os.remove(media.file_path)
    
    # Delete from database
    db.delete(media)
    db.commit()
    
    return {"message": "Media deleted successfully"}
