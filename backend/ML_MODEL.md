# ML Risk Classification Model

## Overview

IntegrityOS uses a **RandomForest classifier** to predict defect risk levels (normal, medium, high) based on inspection data.

## Model Performance

- **Accuracy**: 94.74%
- **Training Data**: 91 defect records  
- **Algorithm**: RandomForest (100 trees, max_depth=10)
- **Features**: 11 engineered features

## Features Used

1. **quality_score** (1-4) - Most important feature (46.7% importance)
2. **defect_depth** (param1) - Defect depth in mm
3. **defect_length** (param2) - Defect length in mm
4. **defect_width** (param3) - Defect width in mm
5. **defect_area** - Calculated area (length × width)
6. **is_critical_method** - Binary flag for critical inspection methods
7. **temperature** - Environmental temperature
8. **temperature_norm** - Normalized temperature
9. **humidity** - Environmental humidity
10. **humidity_norm** - Normalized humidity
11. **depth_to_area_ratio** - Derived feature

## Classification Report

```
              precision    recall  f1-score   support

        high       1.00      1.00      1.00         3
      medium       1.00      0.83      0.91         6
      normal       0.91      1.00      0.95        10

    accuracy                           0.95        19
```

## Training

```bash
cd backend
python scripts/train_ml_model.py
```

This will:
1. Load defect data from `data/Diagnostics.csv`
2. Engineer features
3. Train RandomForest model
4. Save model to `models/risk_classifier.pkl`

## Usage

The model is automatically loaded when the backend starts and used during data import to classify defect risk levels.

## Fallback Behavior

If the ML model is not found, the system automatically falls back to a rule-based classifier.
