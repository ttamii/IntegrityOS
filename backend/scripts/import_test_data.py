"""
Script to import test data via API
"""
import requests

API_URL = "http://localhost:8000"

# Import Objects
print("📦 Importing Objects...")
with open('data/Objects.csv', 'rb') as f:
    files = {'file': ('Objects.csv', f, 'text/csv')}
    response = requests.post(f"{API_URL}/api/import/csv", files=files)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Objects imported: {result['imported_rows']}/{result['total_rows']}")
        if result['errors']:
            print(f"⚠️ Errors: {len(result['errors'])}")
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)

# Import Diagnostics
print("\n🔍 Importing Diagnostics...")
with open('data/Diagnostics.csv', 'rb') as f:
    files = {'file': ('Diagnostics.csv', f, 'text/csv')}
    response = requests.post(f"{API_URL}/api/import/csv", files=files)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Diagnostics imported: {result['imported_rows']}/{result['total_rows']}")
        print(f"🤖 ML classification applied to {result['imported_rows']} inspections")
        if result['errors']:
            print(f"⚠️ Errors: {len(result['errors'])}")
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)

print("\n🎉 Data import complete!")
