"""
Synthetic Data Generator for IntegrityOS
Generates realistic test data for Kazakhstan pipelines
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Kazakhstan coordinates (approximate)
KAZAKHSTAN_CENTER = (48.0196, 66.9237)

# Pipeline routes (synthetic coordinates along Kazakhstan)
PIPELINES = {
    "MT-01": {
        "name": "Магистральный трубопровод MT-01",
        "start": (51.1694, 71.4491),  # Astana area
        "end": (43.2220, 76.8512),     # Almaty area
        "length": 1200.0
    },
    "MT-02": {
        "name": "Магистральный трубопровод MT-02",
        "start": (52.2873, 76.9474),  # Pavlodar area
        "end": (49.8047, 73.1094),     # Karaganda area
        "length": 850.0
    },
    "MT-03": {
        "name": "Магистральный трубопровод MT-03",
        "start": (50.2839, 57.1670),  # Aktobe area
        "end": (47.1164, 51.9211),     # Atyrau area
        "length": 950.0
    }
}

OBJECT_TYPES = ["crane", "compressor", "pipeline_section"]
MATERIALS = ["Ст3", "09Г2С", "17Г1С", "20", "Ст20"]
METHODS = ["VIK", "PVK", "MPK", "UZK", "RGK", "TVK", "VIBRO", "MFL", "TFI", "GEO", "UTWM"]
QUALITY_GRADES = ["удовлетворительно", "допустимо", "требует_мер", "недопустимо"]


def generate_point_along_route(start, end, progress):
    """Generate a point along a route"""
    lat = start[0] + (end[0] - start[0]) * progress
    lon = start[1] + (end[1] - start[1]) * progress
    # Add some random variation
    lat += np.random.normal(0, 0.05)
    lon += np.random.normal(0, 0.05)
    return round(lat, 4), round(lon, 4)


def generate_objects(num_objects=100):
    """Generate objects dataset"""
    objects = []
    object_id = 1
    
    for pipeline_id, pipeline_data in PIPELINES.items():
        # Number of objects per pipeline
        num_per_pipeline = num_objects // len(PIPELINES)
        
        for i in range(num_per_pipeline):
            progress = i / num_per_pipeline
            lat, lon = generate_point_along_route(
                pipeline_data["start"],
                pipeline_data["end"],
                progress
            )
            
            obj_type = random.choice(OBJECT_TYPES)
            
            # Generate object name based on type
            if obj_type == "crane":
                name = f"Кран подвесной №{object_id}"
            elif obj_type == "compressor":
                name = f"Турбокомпрессор ТВ-{random.choice([60, 80, 100])}-{random.randint(1, 5)}"
            else:
                name = f"Участок трубы {pipeline_id}-{i+1}"
            
            objects.append({
                "object_id": object_id,
                "object_name": name,
                "object_type": obj_type,
                "pipeline_id": pipeline_id,
                "lat": lat,
                "lon": lon,
                "year": random.randint(1960, 2020),
                "material": random.choice(MATERIALS)
            })
            object_id += 1
    
    return pd.DataFrame(objects)


def generate_diagnostics(objects_df, num_inspections_per_object=5):
    """Generate diagnostics dataset"""
    diagnostics = []
    diag_id = 1
    
    for _, obj in objects_df.iterrows():
        num_inspections = random.randint(2, num_inspections_per_object)
        
        for i in range(num_inspections):
            # Generate inspection date (last 5 years)
            days_ago = random.randint(0, 1825)  # 5 years
            inspection_date = datetime.now() - timedelta(days=days_ago)
            
            # Random environmental conditions
            temperature = round(random.uniform(-30, 40), 1)
            humidity = round(random.uniform(20, 90), 1)
            illumination = round(random.uniform(100, 1000), 1)
            
            # Defect probability (30% chance)
            defect_found = random.random() < 0.3
            
            defect_description = None
            quality_grade = None
            param1 = None
            param2 = None
            param3 = None
            
            if defect_found:
                defect_types = [
                    "Коррозия поверхностная",
                    "Трещина продольная",
                    "Вмятина",
                    "Утонение стенки",
                    "Питтинговая коррозия",
                    "Расслоение металла",
                    "Механическое повреждение"
                ]
                defect_description = random.choice(defect_types)
                quality_grade = random.choice(QUALITY_GRADES)
                
                # Defect parameters
                param1 = round(random.uniform(0.5, 25.0), 2)  # depth in mm
                param2 = round(random.uniform(5.0, 100.0), 2)  # length in mm
                param3 = round(random.uniform(2.0, 50.0), 2)   # width in mm
            
            diagnostics.append({
                "diag_id": diag_id,
                "object_id": obj["object_id"],
                "method": random.choice(METHODS),
                "date": inspection_date.strftime("%Y-%m-%d"),
                "temperature": temperature,
                "humidity": humidity,
                "illumination": illumination,
                "defect_found": defect_found,
                "defect_description": defect_description,
                "quality_grade": quality_grade,
                "param1": param1,
                "param2": param2,
                "param3": param3
            })
            diag_id += 1
    
    return pd.DataFrame(diagnostics)


def main():
    """Generate and save synthetic data"""
    print("🔧 Generating synthetic data for IntegrityOS...")
    
    # Create data directory
    os.makedirs("data", exist_ok=True)
    
    # Generate objects
    print("📦 Generating objects...")
    objects_df = generate_objects(num_objects=100)
    objects_df.to_csv("data/Objects.csv", index=False)
    print(f"✅ Generated {len(objects_df)} objects")
    
    # Generate diagnostics
    print("🔍 Generating diagnostics...")
    diagnostics_df = generate_diagnostics(objects_df, num_inspections_per_object=5)
    diagnostics_df.to_csv("data/Diagnostics.csv", index=False)
    print(f"✅ Generated {len(diagnostics_df)} diagnostic records")
    
    # Generate pipelines CSV
    print("🛢️ Generating pipelines...")
    pipelines_data = []
    for pipeline_id, data in PIPELINES.items():
        pipelines_data.append({
            "pipeline_id": pipeline_id,
            "name": data["name"],
            "total_length": data["length"]
        })
    pipelines_df = pd.DataFrame(pipelines_data)
    pipelines_df.to_csv("data/Pipelines.csv", index=False)
    print(f"✅ Generated {len(pipelines_df)} pipelines")
    
    # Print statistics
    print("\n📊 Statistics:")
    print(f"  Total objects: {len(objects_df)}")
    print(f"  Total inspections: {len(diagnostics_df)}")
    print(f"  Defects found: {diagnostics_df['defect_found'].sum()}")
    print(f"  Objects by type:")
    for obj_type, count in objects_df['object_type'].value_counts().items():
        print(f"    {obj_type}: {count}")
    
    print("\n✨ Data generation complete!")
    print("📁 Files saved in ./data/ directory")


if __name__ == "__main__":
    main()
