"""
ML Model Training Script for Risk Classification
Trains a RandomForest classifier on inspection data to predict defect risk levels
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os

# Quality grade mapping
QUALITY_GRADE_SCORES = {
    'удовлетворительно': 1,
    'допустимо': 2,
    'требует_мер': 3,
    'недопустимо': 4
}

# Critical inspection methods
CRITICAL_METHODS = ['UZK', 'RGK', 'MFL', 'UTWM']

def load_data():
    """Load inspection data from CSV files"""
    print("📂 Loading data...")
    
    # Load diagnostics
    diagnostics = pd.read_csv('data/Diagnostics.csv')
    
    # Filter only defects
    defects = diagnostics[diagnostics['defect_found'] == True].copy()
    
    print(f"✅ Loaded {len(defects)} defect records")
    return defects

def engineer_features(df):
    """Create features for ML model"""
    print("🔧 Engineering features...")
    
    features = pd.DataFrame()
    
    # Quality grade score (1-4)
    features['quality_score'] = df['quality_grade'].map(QUALITY_GRADE_SCORES).fillna(2)
    
    # Defect depth (param1)
    features['defect_depth'] = df['param1'].fillna(df['param1'].median())
    
    # Defect length (param2)
    features['defect_length'] = df['param2'].fillna(df['param2'].median())
    
    # Defect width (param3)
    features['defect_width'] = df['param3'].fillna(df['param3'].median())
    
    # Defect area
    features['defect_area'] = features['defect_length'] * features['defect_width']
    
    # Critical method flag
    features['is_critical_method'] = df['method'].isin(CRITICAL_METHODS).astype(int)
    
    # Temperature (normalized)
    features['temperature'] = df['temperature'].fillna(df['temperature'].median())
    features['temperature_norm'] = (features['temperature'] - features['temperature'].mean()) / features['temperature'].std()
    
    # Humidity (normalized)
    features['humidity'] = df['humidity'].fillna(df['humidity'].median())
    features['humidity_norm'] = (features['humidity'] - features['humidity'].mean()) / features['humidity'].std()
    
    # Feature engineering: depth to area ratio
    features['depth_to_area_ratio'] = features['defect_depth'] / (features['defect_area'] + 1)
    
    print(f"✅ Created {len(features.columns)} features")
    return features

def prepare_target(df):
    """Prepare target variable (risk level)"""
    # Use existing ml_label if available, otherwise create based on rules
    if 'ml_label' in df.columns:
        target = df['ml_label'].copy()
    else:
        # Fallback: create target based on quality grade
        target = df['quality_grade'].map({
            'удовлетворительно': 'normal',
            'допустимо': 'normal',
            'требует_мер': 'medium',
            'недопустимо': 'high'
        }).fillna('medium')
    
    return target

def train_model(X, y):
    """Train RandomForest classifier"""
    print("\n🎓 Training ML model...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train RandomForest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n✅ Model trained successfully!")
    print(f"Accuracy: {accuracy:.2%}")
    
    print("\n📊 Classification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\n📈 Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n🔍 Top 5 Most Important Features:")
    print(feature_importance.head().to_string(index=False))
    
    return model, accuracy, feature_importance

def save_model(model, feature_names, accuracy):
    """Save trained model and metadata"""
    print("\n💾 Saving model...")
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Save model
    model_path = 'models/risk_classifier.pkl'
    joblib.dump(model, model_path)
    
    # Save feature names
    metadata = {
        'feature_names': feature_names,
        'accuracy': accuracy,
        'model_type': 'RandomForestClassifier',
        'n_estimators': 100
    }
    metadata_path = 'models/model_metadata.pkl'
    joblib.dump(metadata, metadata_path)
    
    print(f"✅ Model saved to {model_path}")
    print(f"✅ Metadata saved to {metadata_path}")

def main():
    print("=" * 70)
    print("🤖 ML RISK CLASSIFICATION MODEL TRAINING")
    print("=" * 70)
    
    # Load data
    df = load_data()
    
    # Engineer features
    X = engineer_features(df)
    
    # Prepare target
    y = prepare_target(df)
    
    print(f"\n📊 Target distribution:")
    print(y.value_counts())
    
    # Train model
    model, accuracy, feature_importance = train_model(X, y)
    
    # Save model
    save_model(model, X.columns.tolist(), accuracy)
    
    print("\n" + "=" * 70)
    print("🎉 ML MODEL TRAINING COMPLETE!")
    print("=" * 70)
    print(f"✅ Accuracy: {accuracy:.2%}")
    print(f"✅ Model ready for production use")
    print("=" * 70)

if __name__ == "__main__":
    main()
