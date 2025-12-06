from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
import os
from app import crud
from app.database import get_db
from app.services.report_generator import generate_html_report, generate_pdf_report

router = APIRouter()


@router.get("/generate")
async def generate_report(
    format: str = Query("html", regex="^(html|pdf)$"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    pipeline_id: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Generate a report in HTML or PDF format"""
    
    try:
        # Get data for report
        inspections = crud.get_inspections(
            db,
            date_from=date_from,
            date_to=date_to,
            pipeline_id=pipeline_id,
            risk_level=risk_level,
            limit=10000
        )
        
        # Eagerly load object relationships for excavation recommendations
        from sqlalchemy.orm import joinedload
        from app import models
        inspections_with_objects = db.query(models.Inspection).options(
            joinedload(models.Inspection.object)
        ).filter(models.Inspection.id.in_([i.id for i in inspections])).all()
        
        stats = crud.get_dashboard_stats(db)
        
        if format == "html":
            html_content = generate_html_report(inspections_with_objects, stats, date_from, date_to)
            return HTMLResponse(content=html_content)
        else:
            pdf_path = generate_pdf_report(inspections_with_objects, stats, date_from, date_to)
            return FileResponse(
                pdf_path,
                media_type="application/pdf",
                filename="integrityos_report.pdf"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")
