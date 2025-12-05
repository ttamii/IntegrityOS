import pandas as pd

# Read CSV with correct encoding and delimiter
df = pd.read_csv('data/Обработанные данные.csv', encoding='windows-1251', delimiter=';')

print("=" * 80)
print("REAL DATASET FROM ORGANIZERS - SUCCESSFULLY READ!")
print("=" * 80)
print(f"\nShape: {df.shape[0]} rows × {df.shape[1]} columns")
print(f"\nColumns ({len(df.columns)}):")
for i, col in enumerate(df.columns):
    print(f"  {i+1}. {col}")

print("\n" + "=" * 80)
print("FIRST 10 ROWS:")
print("=" * 80)
print(df.head(10).to_string())

print("\n" + "=" * 80)
print("DATA TYPES:")
print("=" * 80)
print(df.dtypes)

print("\n" + "=" * 80)
print("MISSING VALUES:")
print("=" * 80)
print(df.isnull().sum())

print("\n" + "=" * 80)
print("UNIQUE VALUES IN KEY COLUMNS:")
print("=" * 80)
for col in df.columns[:15]:  # First 15 columns
    unique_count = df[col].nunique()
    print(f"{col}: {unique_count} unique values")
