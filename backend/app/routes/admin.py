from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter()


@router.delete("/reset")
def reset_database(db: Session = Depends(get_db)):
    """Reset database - delete all data for demo purposes"""
    try:
        # Delete in correct order to avoid foreign key constraints
        db.query(models.Inspection).delete()
        db.query(models.Object).delete()
        db.query(models.Pipeline).delete()
        db.commit()
        
        return {
            "success": True,
            "message": "Database reset successfully. All objects, inspections, and pipelines deleted."
        }
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"Failed to reset database: {str(e)}"
        }
