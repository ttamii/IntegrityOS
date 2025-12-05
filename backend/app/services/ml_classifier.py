"""
ML Risk Classification Service
Classifies defects into risk levels: normal, medium, high
Uses trained RandomForest model with fallback to rule-based approach
"""

from typing import Tuple
from app.schemas import InspectionCreate, RiskLevel, QualityGrade
import numpy as np
import joblib
import os

# Quality grade mapping
QUALITY_GRADE_SCORES = {
    QualityGrade.SATISFACTORY: 1,
    QualityGrade.ACCEPTABLE: 2,
    QualityGrade.REQUIRES_ACTION: 3,
    QualityGrade.UNACCEPTABLE: 4
}

# Critical inspection methods
CRITICAL_METHODS = ['UZK', 'RGK', 'MFL', 'UTWM']

# Global model cache
_model = None
_model_metadata = None


def load_ml_model():
    """Load pre-trained ML model"""
    global _model, _model_metadata
    
    if _model is not None:
        return _model, _model_metadata
    
    model_path = 'models/risk_classifier.pkl'
    metadata_path = 'models/model_metadata.pkl'
    
    if os.path.exists(model_path) and os.path.exists(metadata_path):
        try:
            _model = joblib.load(model_path)
            _model_metadata = joblib.load(metadata_path)
            print(f"✅ ML model loaded successfully (accuracy: {_model_metadata['accuracy']:.2%})")
            return _model, _model_metadata
        except Exception as e:
            print(f"⚠️ Failed to load ML model: {e}")
            return None, None
    else:
        print("⚠️ ML model not found, using rule-based classifier")
        return None, None


def engineer_features(inspection: InspectionCreate, defaults: dict = None) -> np.ndarray:
    """Engineer features for ML model prediction"""
    if defaults is None:
        defaults = {
            'temperature': 20.0,
            'humidity': 50.0,
            'param1': 5.0,
            'param2': 10.0,
            'param3': 5.0
        }
    
    # Quality score
    quality_score = QUALITY_GRADE_SCORES.get(inspection.quality_grade, 2)
    
    # Defect parameters
    defect_depth = inspection.param1 if inspection.param1 is not None else defaults['param1']
    defect_length = inspection.param2 if inspection.param2 is not None else defaults['param2']
    defect_width = inspection.param3 if inspection.param3 is not None else defaults['param3']
    defect_area = defect_length * defect_width
    
    # Critical method flag
    is_critical_method = 1 if inspection.method in CRITICAL_METHODS else 0
    
    # Environmental factors
    temperature = inspection.temperature if inspection.temperature is not None else defaults['temperature']
    humidity = inspection.humidity if inspection.humidity is not None else defaults['humidity']
    
    # Normalized values (using approximate statistics)
    temperature_norm = (temperature - 20.0) / 10.0
    humidity_norm = (humidity - 50.0) / 20.0
    
    # Derived features
    depth_to_area_ratio = defect_depth / (defect_area + 1)
    
    # Feature vector (must match training order)
    features = np.array([
        quality_score,
        defect_depth,
        defect_length,
        defect_width,
        defect_area,
        is_critical_method,
        temperature,
        temperature_norm,
        humidity,
        humidity_norm,
        depth_to_area_ratio
    ]).reshape(1, -1)
    
    return features


def classify_risk_ml(inspection: InspectionCreate) -> Tuple[RiskLevel, float]:
    """Classify risk using ML model"""
    model, metadata = load_ml_model()
    
    if model is None:
        # Fallback to rule-based
        return classify_risk_rules(inspection)
    
    try:
        # Engineer features
        features = engineer_features(inspection)
        
        # Predict
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        confidence = float(np.max(probabilities))
        
        # Map prediction to RiskLevel
        risk_mapping = {
            'normal': RiskLevel.NORMAL,
            'medium': RiskLevel.MEDIUM,
            'high': RiskLevel.HIGH
        }
        
        risk_level = risk_mapping.get(prediction, RiskLevel.MEDIUM)
        
        return risk_level, confidence
        
    except Exception as e:
        print(f"⚠️ ML prediction failed: {e}, falling back to rules")
        return classify_risk_rules(inspection)


def classify_risk_rules(inspection: InspectionCreate) -> Tuple[RiskLevel, float]:
    """
    Classify defect risk level using rule-based approach (fallback)
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
        depth_score = min(inspection.param1 / 20.0, 1.0)
        risk_score += depth_score * 0.3  # 30% weight
        factors.append(depth_score)
    
    # Defect size (param2, param3) factor
    if inspection.param2 is not None and inspection.param3 is not None:
        area = inspection.param2 * inspection.param3
        size_score = min(area / 300.0, 1.0)
        risk_score += size_score * 0.2  # 20% weight
        factors.append(size_score)
    
    # Method criticality factor
    if inspection.method in CRITICAL_METHODS:
        risk_score += 0.1  # 10% weight
        factors.append(0.5)
    
    # Normalize risk score
    if not factors:
        risk_score = 0.5
    
    # Calculate confidence
    confidence = len(factors) / 4.0
    confidence = max(0.5, min(confidence, 1.0))
    
    # Classify based on risk score
    if risk_score < 0.35:
        return RiskLevel.NORMAL, confidence
    elif risk_score < 0.65:
        return RiskLevel.MEDIUM, confidence
    else:
        return RiskLevel.HIGH, confidence


def classify_risk(inspection: InspectionCreate) -> Tuple[RiskLevel, float]:
    """
    Main classification function - uses ML model if available, otherwise rules
    """
    return classify_risk_ml(inspection)

