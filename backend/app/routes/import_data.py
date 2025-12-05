from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import io
from typing import List
from app import crud, schemas, models
from app.database import get_db
from app.services.ml_classifier import classify_risk

router = APIRouter()


@router.post("/csv", response_model=schemas.ImportResult)
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import objects and inspections from CSV file"""
    
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV and XLSX files are supported")
    
    try:
        # Read file
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        total_rows = len(df)
        imported_rows = 0
        errors = []
        warnings = []
        
        # Determine file type based on columns
        if 'object_id' in df.columns and 'object_name' in df.columns:
            # Objects file
            for idx, row in df.iterrows():
                try:
                    # Check if pipeline exists, create if not
                    pipeline_id = str(row.get('pipeline_id', 'UNKNOWN'))
                    pipeline = crud.get_pipeline(db, pipeline_id)
                    if not pipeline:
                        pipeline_data = schemas.PipelineCreate(
                            pipeline_id=pipeline_id,
                            name=f"Pipeline {pipeline_id}"
                        )
                        crud.create_pipeline(db, pipeline_data)
                    
                    # Create object
                    obj_data = schemas.ObjectCreate(
                        object_id=int(row['object_id']),
                        object_name=str(row['object_name']),
                        object_type=str(row.get('object_type', 'pipeline_section')),
                        pipeline_id=pipeline_id,
                        lat=float(row['lat']),
                        lon=float(row['lon']),
                        year=int(row['year']) if pd.notna(row.get('year')) else None,
                        material=str(row.get('material', '')) if pd.notna(row.get('material')) else None
                    )
                    
                    # Check if exists
                    existing = crud.get_object(db, obj_data.object_id)
                    if not existing:
                        crud.create_object(db, obj_data)
                        imported_rows += 1
                    else:
                        warnings.append(f"Row {idx+1}: Object {obj_data.object_id} already exists")
                        
                except Exception as e:
                    errors.append(f"Row {idx+1}: {str(e)}")
        
        elif 'diag_id' in df.columns and 'method' in df.columns:
            # Diagnostics file
            for idx, row in df.iterrows():
                try:
                    inspection_data = schemas.InspectionCreate(
                        diag_id=int(row['diag_id']),
                        object_id=int(row['object_id']),
                        method=str(row['method']),
                        date=pd.to_datetime(row['date']).date(),
                        temperature=float(row['temperature']) if pd.notna(row.get('temperature')) else None,
                        humidity=float(row['humidity']) if pd.notna(row.get('humidity')) else None,
                        illumination=float(row['illumination']) if pd.notna(row.get('illumination')) else None,
                        defect_found=bool(row.get('defect_found', False)),
                        defect_description=str(row.get('defect_description', '')) if pd.notna(row.get('defect_description')) else None,
                        quality_grade=str(row.get('quality_grade')) if pd.notna(row.get('quality_grade')) else None,
                        param1=float(row['param1']) if pd.notna(row.get('param1')) else None,
                        param2=float(row['param2']) if pd.notna(row.get('param2')) else None,
                        param3=float(row['param3']) if pd.notna(row.get('param3')) else None,
                        ml_label=None,
                        ml_confidence=None
                    )
                    
                    # Check if object exists
                    obj = crud.get_object(db, inspection_data.object_id)
                    if not obj:
                        errors.append(f"Row {idx+1}: Object {inspection_data.object_id} not found")
                        continue
                    
                    # Check if inspection exists
                    existing = crud.get_inspection(db, inspection_data.diag_id)
                    if not existing:
                        # Classify risk with ML
                        if inspection_data.defect_found:
                            risk_label, confidence = classify_risk(inspection_data)
                            inspection_data.ml_label = risk_label
                            inspection_data.ml_confidence = confidence
                        
                        crud.create_inspection(db, inspection_data)
                        imported_rows += 1
                    else:
                        warnings.append(f"Row {idx+1}: Inspection {inspection_data.diag_id} already exists")
                        
                except Exception as e:
                    errors.append(f"Row {idx+1}: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="Unknown file format. Expected Objects.csv or Diagnostics.csv")
        
        return schemas.ImportResult(
            success=len(errors) == 0,
            total_rows=total_rows,
            imported_rows=imported_rows,
            errors=errors,
            warnings=warnings
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
