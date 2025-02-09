# Standard library imports
import base64
import os
import io
from time import sleep
from datetime import datetime
import json
from bson.binary import Binary
from flask_cors import CORS
import pandas as pd
from datetime import datetime

from bson import ObjectId

# Third-party imports
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from bcrypt import hashpw, gensalt, checkpw
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from PIL import Image as PILImage
from google.cloud import vision
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from openpyxl import load_workbook


#
# from google.cloud.vision import types as vision_types

# Your custom imports
from automation import process_petition_text, authenticate
from automation_helper import send_details_by_xpath

# Local imports
from helpers import (
    google_cred_setup,
    rotate_image_based_on_metadata,
    concatenate_pil_images_vertically_with_marginssss,  # Corrected function name
    extract_info_updated,
    get_details_by_text,
    display_results_of_searching
)
from detection import ReceiptDetection
from fields import ReceiptFields
from constants import UPLOAD_FOLDER, PROCESSED_FOLDER

# Add at the top of app.py with other imports

from flask.json.provider import JSONProvider
from bson import ObjectId, binary


class CustomJSONProvider(JSONProvider):
    def dumps(self, obj, **kwargs):
        def custom_default(obj):
            if isinstance(obj, ObjectId):
                return str(obj)
            raise TypeError(f'Object of type {type(obj)} is not JSON serializable')

        return json.dumps(obj, default=custom_default, **kwargs)

    def loads(self, s, **kwargs):
        return json.loads(s, **kwargs)


# Update Flask app initialization
app = Flask(__name__)
app.json = CustomJSONProvider(app)

# Update Flask app initialization
app = Flask(__name__)
app.json = CustomJSONProvider(app)

from flask.json.provider import JSONProvider
import json


class MongoJSONEncoder(JSONProvider):
    def dumps(self, obj, **kwargs):
        def custom_default(obj):
            if isinstance(obj, ObjectId):
                return str(obj)
            raise TypeError(f'Object of type {type(obj)} is not JSON serializable')

        return json.dumps(obj, default=custom_default, **kwargs)

    def loads(self, s, **kwargs):
        return json.loads(s, **kwargs)

# Update Flask app initialization

# Initialize Flask app
app = Flask(__name__)
app.json_provider_class = CustomJSONProvider
app.json = MongoJSONEncoder(app)
app.secret_key = os.urandom(24)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:3000", "http://localhost:3000"],  # Allow both
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Add the after_request handler here
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ['http://127.0.0.1:3000', 'http://localhost:3000']:
        response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Configure folders (keep your existing folder configuration)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# Configure folders
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

# Initialize Google Vision and custom classes
# vision_client = google_cred_setup()
vision_client = vision.ImageAnnotatorClient()
rd_obj = ReceiptDetection()
rf_obj = ReceiptFields()

# Database setup (replace with your connection details)
# MongoDB setup section
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client["Petition_Ledger"]
    user_collection = db["users"]
    collection = db['petition_data']
    petition_collection = db["petitions"]
    audit_trail_collection = db["audit_trail"]
    scraped_data_collection = db["scraped_data"]  # Add this line
    client.admin.command('ping')
    print("DB connected successfully")
except Exception as e:
    print(f"MongoDB connection failed: {e}")


@app.route('/api/latest-petition', methods=['GET'])
def get_latest_petition():
    try:
        template_path = 'Copy of MASTER TEMPLATE.xlsx'
        if os.path.exists(template_path):
            wb = load_workbook(template_path)
            ws = wb.active
            
            # Find the highest petition number that has been used
            highest_petition = 0
            for r in range(7, 76):
                # Check if row has any data in columns B through G
                has_data = False
                for col in range(2, 8):  # B through G
                    if ws.cell(row=r, column=col).value is not None:
                        has_data = True
                        break
                
                if ws.cell(row=r, column=1).value is not None and has_data:
                    highest_petition = r - 6  # Convert row to petition number
            
            wb.close()
            
            # Next petition should be one more than the highest used
            next_petition = highest_petition + 1
            
            return jsonify({
                'latest_petition': f'petition{next_petition}',
                'status': 'new'
            })

        # Fallback to database check
        latest_petition = db.collection.find_one(
            {'processed': True},  # Only consider fully processed petitions
            sort=[('petition_number', -1)]
        )

        if latest_petition:
            next_num = int(latest_petition['petition_number']) + 1
            return jsonify({
                'latest_petition': f'petition{next_num}',
                'status': 'from_db'
            })
        else:
            return jsonify({
                'latest_petition': 'petition1',
                'status': 'new'
            })

    except Exception as e:
        print(f"Error in get_latest_petition: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Username and password are required.'}), 400

        # Find the user in the database
        user = db['users'].find_one({'username': username})

        if user and checkpw(password.encode('utf-8'), user['password'].encode('utf-8') if isinstance(user['password'], str) else user['password']):
            # Remove the ObjectId from the user or serialize it to a string
            user['_id'] = str(user['_id'])
            # Remove the password from the user object before returning it
            del user['password']
            return jsonify({'message': 'Login successful', 'user': user}), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401

    except Exception as e:
        print(f"Error in login: {str(e)}")
        return jsonify({'message': 'Server error', 'error': str(e)}), 500


from flask import request, jsonify


@app.route('/api/admin-view', methods=['GET'])
def admin_view():
    try:
        # Simulate the username validation (this would be done with a real session or token in production)
        user = request.args.get('username')
        collection = request.args.get('collection')  # Get the collection parameter

        # Debugging: Print the parameters
        print(f"Received request with username={user} and collection={collection}")

        if not user:
            return jsonify({'message': 'Username not provided'}), 400

        # Fetch the user info from the users collection
        user_info = db['users'].find_one({'username': user})

        if not user_info:
            return jsonify({'message': 'User not found'}), 404

        # Check if the user is an admin
        if user_info.get('usertype') != 'admin':
            return jsonify({'message': 'Access denied. Admins only.'}), 403

        # Handle fetching data based on the collection
        if collection == 'users':
            # Fetch all users, excluding the password and _id fields
            users = list(user_collection.find({}, {'password': 0, '_id': 0}))  # Excluding password and _id
            return jsonify({'users': users}), 200

        elif collection == 'petitions':
            # Fetch all petitions, excluding the timestamp and screenshot fields
            petitions = list(petition_collection.find({}, {'timestamp': 0, 'screenshot': 0, '_id': 0}))  # Excluding timestamp and screenshot
            return jsonify({'petitions': petitions}), 200

        elif collection == 'audit_trail':
            # Fetch all audit trail data
            audit_trail = list(audit_trail_collection.find({}, {'_id': 0}))  # Excluding _id
            return jsonify({'audit_trail': audit_trail}), 200

        else:
            return jsonify({'message': 'Invalid collection specified.'}), 400

    except Exception as e:
        print(f"Error in admin_view: {str(e)}")
        return jsonify({'error': str(e)}), 500




@app.route('/api/process-petition', methods=['POST'])
def process_petition():
    try:
        print("Received petition request")
        data = request.get_json()
        print("Request data:", data)

        if not data:
            return jsonify({"error": "No data received"}), 400

        required_fields = ['first_name', 'last_name', 'address', 'zip_code', 'petition']
        for field in required_fields:
            if field not in data:
                print(f"Missing field: {field}")
                return jsonify({"error": f"Missing required field: {field}"}), 400

        print("Processing petition with data:", data)
        result = process_petition_text(
            first_name=data['first_name'],
            last_name=data['last_name'],
            address=data['address'],
            zip_code=data['zip_code'],
            petition=data['petition'],
            data={}
        )
        print("Processed result:", result)

        if result is None:
            return jsonify({
                "success": False,
                "error": "No results received from processing"
            }), 500

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        print(f"Detailed error in process_petition: {str(e)}")
        import traceback
        print("Traceback:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500
@app.route('/api/process-image', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Save uploaded file
        server_url = request.url_root.rstrip('/')
        uploaded_image_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(uploaded_image_path)

        # Rotate and process the uploaded image
        rotated_image = rotate_image_based_on_metadata(PILImage.open(uploaded_image_path))
        c_image = rd_obj.predict(rotated_image)

        if not c_image:
            return jsonify({'error': 'No receipt detected in the image'}), 400

        chunks_data = []
        processed_images = []

        # Process detected chunks with retry mechanism
        for idx, pil_img in enumerate(c_image.values(), start=1):
            max_retries = 3
            retry_count = 0
            
            while retry_count < max_retries:
                try:
                    chunk_filename = f"img_data_chunk_{idx}.png"
                    chunk_path = os.path.join(app.config['PROCESSED_FOLDER'], chunk_filename)
                    pil_img.save(chunk_path)

                    # Extract fields and perform OCR
                    fields = rf_obj.predict_with_pad(chunk_path, padding=5)
                    if not fields:
                        raise Exception("No fields detected")
                        
                    fields = dict(sorted(fields.items(), key=lambda item: item[0]))

                    imgg_for_ocr = concatenate_pil_images_vertically_with_marginssss(
                        list(fields.values()), margin_percentage=60
                    )

                    chunk_text = "Not detected"
                    
                    # Create new Vision client for each request to avoid timeout
                    vision_client = vision.ImageAnnotatorClient()
                    
                    with io.BytesIO() as output:
                        imgg_for_ocr.save(output, format="PNG")
                        content = output.getvalue()

                    # Create an Image object
                    image = vision.Image(content=content)

                    # Define the image context
                    image_context = vision.ImageContext(language_hints=["en"])

                    # Perform document text detection
                    response = vision_client.document_text_detection(
                        image=image,
                        image_context=image_context
                    )
                    chunk_text = response.full_text_annotation.text.strip() if response.full_text_annotation else "Not detected"
                    
                    # Extract structured data
                    full_name, address, zip_code = extract_info_updated(chunk_text)
                    first_name = full_name.split()[0] if full_name and full_name.split() else None
                    last_name = full_name.split()[-1] if full_name and full_name.split() else None

                    chunk_data = {
                        'chunk_number': idx,
                        'image_url': f'{server_url}/processed_images/{chunk_filename}',
                        'ocr_data': {
                            'first_name': first_name or "Not detected",
                            'last_name': last_name or "Not detected",
                            'full_name': full_name or "Not detected",
                            'address': address or "Not detected",
                            'zip_code': zip_code or "Not detected",
                            'raw_ocr_text': chunk_text
                        }
                    }
                    chunks_data.append(chunk_data)
                    processed_images.append(pil_img)
                    break  # Success, exit retry loop
                    
                except Exception as e:
                    print(f"Attempt {retry_count + 1} failed for chunk {idx}: {str(e)}")
                    retry_count += 1
                    if retry_count == max_retries:
                        print(f"All retries failed for chunk {idx}")
                        # Add empty chunk data to maintain order
                        chunks_data.append({
                            'chunk_number': idx,
                            'image_url': f'{server_url}/processed_images/error.png',
                            'ocr_data': {
                                'first_name': "Error processing",
                                'last_name': "Error processing",
                                'full_name': "Error processing",
                                'address': "Error processing",
                                'zip_code': "Error processing",
                                'raw_ocr_text': f"Error: {str(e)}"
                            }
                        })
                    time.sleep(1)  # Wait before retry

        if not chunks_data:
            return jsonify({'error': 'Failed to process any chunks'}), 500

        # Save concatenated image
        if processed_images:
            concatenated_image = concatenate_pil_images_vertically_with_marginssss(
                processed_images, margin_percentage=60
            )
            concatenated_filename = "img_data_combined.png"
            concatenated_path = os.path.join(app.config['PROCESSED_FOLDER'], concatenated_filename)
            concatenated_image.save(concatenated_path)

        response_data = {
            'message': 'Processing completed',
            'uploaded_image_url': f'{server_url}/uploads/{file.filename}',
            'chunks': chunks_data,
            'concatenated_image_url': f'{server_url}/processed_images/{concatenated_filename}' if processed_images else None
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Error in process_image: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/processed_images/<path:filename>')
def processed_file(filename):
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)


import traceback

@app.route('/api/insert-all-automation-data', methods=['POST'])
def insert_all_automation_data():
    try:
        data = request.get_json()
        chunks = data.get('chunks', [])
        petition = data.get('petition')

        inserted_ids = []
        inserted_count = 0

        options = Options()
        options.binary_location = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        # options.add_argument('--headless')  # Comment this line out to see the browser
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-extensions')
        options.add_argument('--ignore-certificate-errors')

        try:
            print("Setting up Chrome WebDriver...")
            service = Service(ChromeDriverManager().install())
            browser = webdriver.Chrome(service=service, options=options)
            print("Chrome WebDriver initialized successfully")
            authenticate(browser)
            sleep(2)

            for chunk in chunks:
                print(f"Processing chunk {chunk['chunk_number']} with data: {chunk}")
                try:
                    # Access OCR data correctly
                    ocr_data = chunk['ocr_data']
                    send_details_by_xpath(browser, '//*[@id="id_first_name"]', ocr_data['first_name'])
                    send_details_by_xpath(browser, '//*[@id="id_last_name"]', ocr_data['last_name'])
                    send_details_by_xpath(browser, '//*[@id="id_address"]', ocr_data['address'])
                    send_details_by_xpath(browser, '//*[@id="id_zip"]', ocr_data['zip_code'])

                    screenshot_path = f"screenshots/petition_{petition}_chunk_{chunk['chunk_number']}.png"
                    os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
                    browser.save_screenshot(screenshot_path)

                    with open(screenshot_path, 'rb') as f:
                        screenshot_binary = f.read()

                    result_data = {
                        "first_name": ocr_data.get('first_name', ''),
                        "last_name": ocr_data.get('last_name', ''),
                        "address": ocr_data.get('address', ''),
                        "zip_code": ocr_data.get('zip_code', ''),
                        "petition_number": petition,
                        "chunk_number": chunk['chunk_number'],
                        "timestamp": datetime.now(),
                        "image_url": chunk.get('image_url', ''),
                        "screenshot_url": screenshot_path,
                        "screenshot_binary": screenshot_binary
                    }

                    result = collection.insert_one(result_data)
                    if result:
                        inserted_ids.append(str(result.inserted_id))
                        inserted_count += 1

                    submit_btn = browser.find_element(By.XPATH, '//*[@id="id_registry_btn_submit"]')
                    submit_btn.click()
                    sleep(4)

                    try:
                        alert = browser.switch_to.alert
                        alert.accept()
                    except:
                        pass

                except Exception as chunk_error:
                    print(f"Error processing chunk {chunk['chunk_number']}: {chunk_error}")
                    print(f"Full error traceback: {traceback.format_exc()}")

        finally:
            browser.quit()
            for filename in os.listdir('screenshots'):
                if filename.startswith(f'petition_{petition}'):
                    os.remove(os.path.join('screenshots', filename))

        if inserted_count > 0:
            return jsonify({
                "success": True,
                "message": f"Inserted {inserted_count} records",
                "inserted_ids": inserted_ids
            })
        else:
            return jsonify({
                "success": False,
                "message": "No data was inserted"
            })

    except Exception as e:
        print(f"Error in batch insert: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        usertype = data.get('usertype')  # Accept usertype from frontend

        if not username or not password or not usertype:
            return jsonify({'message': 'Username, password, and usertype are required.'}), 400

        # Check if the user already exists
        if db['users'].find_one({'username': username}):
            return jsonify({'message': 'User already exists'}), 409

        # Hash the password
        hashed_password = hashpw(password.encode('utf-8'), gensalt())

        # Store the user with usertype
        db['users'].insert_one({
            'username': username,
            'password': hashed_password.decode('utf-8'),  # Store as string
            'usertype': usertype  # Add usertype to the document
        })

        return jsonify({'message': 'Signup successful'}), 201

    except Exception as e:
        print(f"Error in signup: {str(e)}")
        return jsonify({'message': 'Server error', 'error': str(e)}), 500

# Custom JSON Encoder to handle datetime, ObjectId, and binary data
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.strftime('%Y-%m-%d %H:%M:%S')  # Format datetime as string
        elif isinstance(obj, ObjectId):
            return str(obj)  # Convert ObjectId to string
        elif isinstance(obj, Binary) or isinstance(obj, bytes):  # Handle binary data (e.g., screenshot)
            # Convert the binary data to base64 string for JSON compatibility
            return base64.b64encode(obj).decode('utf-8')
        return super().default(obj)

# Set custom encoder for Flask
@app.route("/api/search", methods=["GET"])
def search():
    try:
        # Get search parameters and method
        params = {k: v.strip() for k, v in request.args.to_dict().items() if v.strip()}
        search_method = params.pop('method', None)
        
        print("Search params:", params)  # Add logging
        print("Search method:", search_method)  # Add logging

        if not search_method:
            return jsonify({"error": "Search method is required"}), 400

        # Build query based on search method
        query = {}
        
        if search_method == "method1":
            # First Initial + Last Initial Search
            if 'first_name' in params:
                query['first_name'] = {"$regex": f"^{params['first_name'][0]}", "$options": "i"}
            if 'last_initial' in params:
                query['last_name'] = {"$regex": f"^{params['last_initial']}", "$options": "i"}
            if 'street_number' in params:
                query['address'] = {"$regex": f"^{params['street_number']}", "$options": "i"}
            if 'street_initial' in params:
                query['address'] = {"$regex": f"{params['street_number']}.*{params['street_initial']}", "$options": "i"}
            if 'zip_code' in params:
                query['zip_code'] = params['zip_code']

        elif search_method == "method2":
            # First Initial + Full Last Name Search
            if 'first_name' in params:
                query['first_name'] = {"$regex": f"^{params['first_name'][0]}", "$options": "i"}
            if 'last_name' in params:
                query['last_name'] = {"$regex": f"^{params['last_name']}", "$options": "i"}
            if 'street_initial' in params:
                query['address'] = {"$regex": f".*{params['street_initial']}", "$options": "i"}
            if 'zip_code' in params:
                query['zip_code'] = params['zip_code']

        elif search_method == "method3":
            # Full Name + Street Search
            if 'first_name' in params:
                query['first_name'] = {"$regex": f"^{params['first_name']}", "$options": "i"}
            if 'last_name' in params:
                query['last_name'] = {"$regex": f"^{params['last_name']}", "$options": "i"}
            if 'street_number' in params:
                query['address'] = {"$regex": f"^{params['street_number']}", "$options": "i"}
            if 'street_initial' in params:
                query['address'] = {"$regex": f"{params['street_number']}.*{params['street_initial']}", "$options": "i"}
            if 'zip_code' in params:
                query['zip_code'] = params['zip_code']

        elif search_method == "method4":
            # Complete Address Search
            if 'first_name' in params:
                query['first_name'] = {"$regex": f"^{params['first_name']}", "$options": "i"}
            if 'last_name' in params:
                query['last_name'] = {"$regex": f"^{params['last_name']}", "$options": "i"}
            if 'address' in params:
                query['address'] = {"$regex": f"^{params['address']}", "$options": "i"}
            if 'zip_code' in params:
                query['zip_code'] = params['zip_code']

        elif search_method == "method5":
            # Street Only Search
            if 'street_number' in params:
                query['address'] = {"$regex": f"^{params['street_number']}", "$options": "i"}
            if 'street_name' in params:
                query['address'] = {"$regex": f"{params['street_number']}.*{params['street_name']}", "$options": "i"}
            if 'zip_code' in params:
                query['zip_code'] = params['zip_code']

        # Log the query being used
        print("MongoDB query:", query)  # Add logging
        
        # Perform search with the constructed query
        if query:
            results = list(collection.find(query, {
                "_id": 0,
                "first_name": 1,
                "last_name": 1,
                "address": 1,
                "zip_code": 1
            }))
            
            print("Search results:", results)  # Add logging
            
            # Remove duplicates
            unique_results = []
            seen = set()
            for result in results:
                key = f"{result['first_name']}-{result['last_name']}-{result['address']}-{result['zip_code']}"
                if key not in seen:
                    seen.add(key)
                    unique_results.append(result)
            
            return jsonify({"results": unique_results})
        else:
            return jsonify({"results": []})

    except Exception as e:
        print(f"Search error: {str(e)}")
        return jsonify({"error": str(e)}), 500

def validate_formula_result(ws, row, col, expected_type="numeric"):
    """Validate formula results"""
    try:
        # Get the formula from the cell
        formula = ws.cell(row=row, column=col).value
        
        # Check if it's a valid formula
        if not isinstance(formula, str) or not formula.startswith('='):
            print(f"Warning: Invalid formula in cell {chr(64+col)}{row}: {formula}")
            return False
            
        # For SUMPRODUCT formula (Total Number of 1 & 0.1)
        if col == 10:  # Column J
            return formula.startswith('=SUMPRODUCT') and 'B' in formula and 'J' in formula
            
        # For other formulas, verify basic structure
        if col == 11:  # Column K: Dup [D]
            return formula.startswith('=COUNTIF(') and '"x"' in formula
        elif col == 12:  # Column L: Purge [P]
            return formula.startswith('=COUNTIF(') and '"v"' in formula
        elif col == 13:  # Column M: Total purge
            return formula.startswith('=K') and '+L' in formula
        elif col == 14:  # Column N: Count [C]
            return formula.startswith('=COUNTA(')
        elif col == 15:  # Column O: Checked [Ch]
            return formula.startswith('=COUNTIF(') and 'COUNTIF(' in formula
        elif col == 16:  # Column P: Good [G]
            return formula.startswith('=COUNTIF(') and ',1)' in formula
        elif col == 17:  # Column Q: Bad [B]
            return formula.startswith('=COUNTIF(') and ',0.1)' in formula
            
        return True
    except Exception as e:
        print(f"Validation error for cell {chr(64+col)}{row}: {str(e)}")
        return False

def log_cell_update(row, col, value, formula=None):
    """Log cell updates with timestamp"""
    col_letter = chr(64 + col)
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if formula:
        print(f"[{timestamp}] Cell {col_letter}{row}: Setting formula '{formula}'")
    else:
        print(f"[{timestamp}] Cell {col_letter}{row}: Setting value '{value}'")

def get_next_petition_number(ws):
    """Find the next available petition number"""
    last_petition = 0
    for row in range(7, 76):  # Check rows 7-75
        petition_num = ws.cell(row=row, column=1).value
        if isinstance(petition_num, (int, float)) and petition_num > last_petition:
            last_petition = int(petition_num)
    return last_petition + 1

@app.route('/api/save-value', methods=['POST'])
def save_value():
    try:
        data = request.json
        value = data.get('value')
        chunk_number = int(data.get('chunkNumber', 1))
        active_petition = data.get('petition')
        
        if not active_petition:
            return jsonify({'success': False, 'error': 'No active petition specified'}), 400
            
        template_path = 'Copy of MASTER TEMPLATE.xlsx'
        petition_number = int(active_petition.replace('petition', ''))
        
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                wb = load_workbook(template_path)
                ws = wb.active
                
                # Calculate the correct row based on petition number
                row = petition_number + 6  # Convert petition number to row (petition1 -> row 7)
                
                # Initialize row if needed
                if not ws.cell(row=row, column=1).value:
                    ws.cell(row=row, column=1, value=petition_number)
                    # Clear the row
                    for col in range(2, 18):  # B through Q
                        ws.cell(row=row, column=col).value = None
                
                # Map chunk_number to correct column (1->B, 2->C, etc.)
                col = chunk_number + 1
                
                # Validate column range
                if col < 2 or col > 7:
                    return jsonify({
                        'success': False, 
                        'error': f'Invalid chunk number. Only chunks 1-6 allowed (columns B-G)'
                    }), 400
                
                # Update the signature cell
                cell = ws.cell(row=row, column=col)
                if value == "GOOD":
                    cell.value = 1.0
                elif value == "BAD":
                    cell.value = 0.1
                elif value == "DUP":
                    cell.value = 'x'
                elif value == "PURGE":
                    cell.value = 'v'
                
                # Update formulas
                formulas = {
                    10: f'=SUM(IF(B{row}:G{row}=1,1,IF(B{row}:G{row}=0.1,0.1,0)))',
                    11: f'=COUNTIF(B{row}:G{row},"x")',
                    12: f'=COUNTIF(B{row}:G{row},"v")',
                    13: f'=K{row}+L{row}',
                    14: f'=COUNTA(B{row}:G{row})',
                    15: f'=COUNTIF(B{row}:G{row},1)+COUNTIF(B{row}:G{row},0.1)',
                    16: f'=COUNTIF(B{row}:G{row},1)',
                    17: f'=COUNTIF(B{row}:G{row},0.1)'
                }
                
                # Apply formulas and calculate values
                for col_num, formula in formulas.items():
                    cell = ws.cell(row=row, column=col_num)
                    cell.value = formula
                    cell.data_type = 'f'
                    
                    # Calculate and store values
                    cell_values = [ws.cell(row=row, column=c).value for c in range(2, 8)]
                    if col_num == 10:  # Total
                        value = sum(1 for x in cell_values if x == 1) + sum(0.1 for x in cell_values if x == 0.1)
                    elif col_num == 11:  # Duplicates
                        value = sum(1 for x in cell_values if x == 'x')
                    elif col_num == 12:  # Purges
                        value = sum(1 for x in cell_values if x == 'v')
                    elif col_num == 13:  # Total purge
                        value = sum(1 for x in cell_values if x in ['x', 'v'])
                    elif col_num == 14:  # Count
                        value = sum(1 for x in cell_values if x is not None)
                    elif col_num == 15:  # Checked
                        value = sum(1 for x in cell_values if x in [1, 0.1])
                    elif col_num == 16:  # Good
                        value = sum(1 for x in cell_values if x == 1)
                    elif col_num == 17:  # Bad
                        value = sum(1 for x in cell_values if x == 0.1)
                        
                    ws.cell(row=row, column=col_num).value = value

                wb.save(template_path)
                wb.close()
                
                # Update database with processed status
                db.collection.update_one(
                    {'petition': active_petition},
                    {
                        '$set': {
                            'last_updated': datetime.now(),
                            f'chunk_{chunk_number}': value,
                            'petition_number': petition_number,
                            'processed': True  # Mark as processed
                        }
                    },
                    upsert=True
                )
                
                return jsonify({
                    'success': True,
                    'message': 'Saved successfully',
                    'petition': active_petition,
                    'chunk': chunk_number
                })
                
            except PermissionError:
                retry_count += 1
                if retry_count == max_retries:
                    return jsonify({
                        'success': False,
                        'error': 'Excel file is locked. Please close it and try again.'
                    }), 423
                time.sleep(1)
                
            finally:
                if 'wb' in locals():
                    try:
                        wb.close()
                    except:
                        pass
                    
    except Exception as e:
        print(f"Error in save_value: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    

    

@app.route('/api/get-next-petition', methods=['GET'])
def get_next_petition():
    try:
        template_path = 'Copy of MASTER TEMPLATE.xlsx'
        if not os.path.exists(template_path):
            return jsonify({'success': False, 'error': 'Template file not found'}), 404
            
        wb = load_workbook(template_path)
        ws = wb.active
        
        # Find next available row and petition number
        next_petition = None
        for r in range(7, 76):
            if ws.cell(row=r, column=1).value is None:
                next_petition = (r - 6)  # Row 7 = Petition 1, Row 8 = Petition 2, etc.
                break
        
        wb.close()
        
        if next_petition is None:
            return jsonify({'success': False, 'error': 'No available petition slots'}), 400
            
        return jsonify({
            'success': True,
            'nextPetition': next_petition
        })
        
    except Exception as e:
        print(f"Error getting next petition: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Access the API at: http://127.0.0.1:5000")
    app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)  # Disable auto-reloader