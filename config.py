import os

# Base directories
DATA_DIR = "data"
JSON_DIR = os.path.join(DATA_DIR, "json")
CSV_DIR = os.path.join(DATA_DIR, "csv")
EXCEL_DIR = os.path.join(DATA_DIR, "excel")
SS_DIR = os.path.join(DATA_DIR, "screenshots")

def ensure_data_directories():
    """Create data directories if they don't exist"""
    for directory in [DATA_DIR, JSON_DIR, CSV_DIR, EXCEL_DIR, SS_DIR]:
        os.makedirs(directory, exist_ok=True) 