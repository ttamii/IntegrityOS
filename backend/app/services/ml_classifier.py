"""
ML Risk Classification Service
Classifies defects into risk levels: normal, medium, high
"""

from typing import Tuple
from app.schemas import InspectionCreate, RiskLevel, QualityGrade
import numpy as np


def classify_risk(inspection: InspectionCreate) -> Tuple[RiskLevel, float]:
    """
    Classify defect risk level using rule-based approach
    
    Returns:
        Tuple of (risk_level, confidence_score)
    """
    
    if not inspection.defect_found:
        return RiskLevel.NORMAL, 1.0
    
    # Initialize risk score
    risk_score = 0.0
    factors = []
    
    # Quality grade factor (highest weight)
    if inspection.quality_grade:
        grade_scores = {
            QualityGrade.SATISFACTORY: 0.1,
            QualityGrade.ACCEPTABLE: 0.3,
            QualityGrade.REQUIRES_ACTION: 0.7,
            QualityGrade.UNACCEPTABLE: 1.0
        }
        grade_score = grade_scores.get(inspection.quality_grade, 0.5)
        risk_score += grade_score * 0.4  # 40% weight
        factors.append(grade_score)
    
    # Defect depth/severity (param1) factor
    if inspection.param1 is not None:
        # Assume param1 is defect depth in mm
        # Normalize: 0-5mm = low, 5-15mm = medium, >15mm = high
        depth_score = min(inspection.param1 / 20.0, 1.0)
        risk_score += depth_score * 0.3  # 30% weight
        factors.append(depth_score)
    
    # Defect size (param2, param3) factor
    if inspection.param2 is not None and inspection.param3 is not None:
        # Assume param2 = length, param3 = width
        area = inspection.param2 * inspection.param3
        # Normalize: 0-50mm² = low, 50-200mm² = medium, >200mm² = high
        size_score = min(area / 300.0, 1.0)
        risk_score += size_score * 0.2  # 20% weight
        factors.append(size_score)
    
    # Method criticality factor
    critical_methods = ['UZK', 'RGK', 'MFL', 'UTWM']  # More critical inspection methods
    if inspection.method in critical_methods:
        risk_score += 0.1  # 10% weight
        factors.append(0.5)
    
    # Normalize risk score
    if not factors:
        risk_score = 0.5  # Default medium risk if no data
    
    # Calculate confidence based on available data
    confidence = len(factors) / 4.0  # Max 4 factors
    confidence = max(0.5, min(confidence, 1.0))  # Clamp between 0.5 and 1.0
    
    # Classify based on risk score
    if risk_score < 0.35:
        return RiskLevel.NORMAL, confidence
    elif risk_score < 0.65:
        return RiskLevel.MEDIUM, confidence
    else:
        return RiskLevel.HIGH, confidence


def train_ml_model(inspections_data):
    """
    Train a machine learning model on historical inspection data
    This is a placeholder for future ML model training
    
    For MVP, we use the rule-based classifier above
    Future: Implement RandomForest or other ML algorithms
    """
    # TODO: Implement ML model training
    # - Feature engineering
    # - Train/test split
    # - Model training (RandomForest, XGBoost, etc.)
    # - Model persistence (joblib)
    pass


def load_ml_model():
    """
    Load a pre-trained ML model
    Placeholder for future implementation
    """
    # TODO: Load model from file
    pass
