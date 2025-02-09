from constants_helper import extract_from_csv
import os

COUNTY_ZIP_CODES_filename = 'zip_county.csv'
COUNTY_MAPPING = extract_from_csv(COUNTY_ZIP_CODES_filename)


# Get the base directory of your application
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Define paths relative to BASE_DIR
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
PROCESSED_FOLDER = os.path.join(BASE_DIR, 'static', 'processed_images')

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Other constants...
COUNTY_ZIP_CODES_filename = os.path.join(BASE_DIR, 'zip_county.csv')
GOOGLE_CREDS = os.path.join(BASE_DIR, '.chainlit', 'translations', 'hassan.json')
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GOOGLE_CREDS

YOLO_WEIGHTS = os.path.join(BASE_DIR, 'dependencies', 'best.pt')
YOLO_DETECTION_WEIGHTS = os.path.join(BASE_DIR, 'dependencies', 'epoch37.pt')
SS_DIR = os.path.join(BASE_DIR, 'output')

# Create other directories
os.makedirs(os.path.dirname(GOOGLE_CREDS), exist_ok=True)
os.makedirs(os.path.dirname(YOLO_WEIGHTS), exist_ok=True)
os.makedirs(SS_DIR, exist_ok=True)