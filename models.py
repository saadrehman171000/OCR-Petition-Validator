from pymongo import MongoClient
import datetime

# Connect to MongoDB (assuming your MongoDB is running on localhost)
client = MongoClient("mongodb://localhost:27017/")
db = client["FYP"]  # Replace with your database name

ocr_collection = db["ocr_records"]  # MongoDB collection for OCR records
audit_collection = db["audit_trail"]  # MongoDB collection for audit trail
petitions_collection = db["petitions"]  # Assuming you have a collection for petitions


class OCRRecord:
    def __init__(self, image_data, ocr_text=None):
        self.image_data = image_data
        self.ocr_text = ocr_text
        self.date_created = datetime.datetime.utcnow()
        self.processed = False

    def save(self):
        # Insert the OCR record into the database
        ocr_record_data = {
            "image_data": self.image_data,
            "ocr_text": self.ocr_text,
            "date_created": self.date_created,
            "processed": self.processed
        }
        # Insert into MongoDB collection
        result = ocr_collection.insert_one(ocr_record_data)
        return result.inserted_id


class AuditTrail:
    def __init__(self, action, ocr_record_id):
        self.action = action
        self.timestamp = datetime.datetime.utcnow()
        self.ocr_record_id = ocr_record_id

    def save(self):
        # Insert audit trail into the MongoDB collection
        audit_trail_data = {
            "action": self.action,
            "timestamp": self.timestamp,
            "ocr_record_id": self.ocr_record_id
        }
        # Insert into MongoDB collection
        result = audit_collection.insert_one(audit_trail_data)
        return result.inserted_id


# Helper function to retrieve OCR records by OCR record id
def get_ocr_record_by_id(record_id):
    return ocr_collection.find_one({"_id": record_id})


# Helper function to get all OCR records
def get_all_ocr_records():
    return list(ocr_collection.find({}))


# Helper function to fetch the audit trail for a given OCR record id
def get_audit_trail_by_ocr_record(ocr_record_id):
    return list(audit_collection.find({"ocr_record_id": ocr_record_id}))


SEARCH_METHODS = {
    "method1": {
        "description": "First letter of First Name + First letter of Last Name + Street Number + First letter of Street Name + ZIP Code",
        "fields": ["first_name_initial", "last_name_initial", "street_number", "street_name_initial", "zip_code"]
    },
    "method2": {
        "description": "First letter of First Name + Full Last Name + Street Number + First letter of Street Name + ZIP Code",
        "fields": ["first_name_initial", "last_name", "street_number", "street_name_initial", "zip_code"]
    },
    "method3": {
        "description": "Full First Name + Full Last Name + Street Number + First letter of Street Name + ZIP Code",
        "fields": ["first_name", "last_name", "street_number", "street_name_initial", "zip_code"]
    },
    "method4": {
        "description": "Full First Name + Full Last Name + Full Address + ZIP Code",
        "fields": ["first_name", "last_name", "address", "zip_code"]
    },
    "method5": {
        "description": "Street Number + Full Street Name + ZIP Code",
        "fields": ["street_number", "street_name", "zip_code"]
    }
}

def perform_search(query_params, method):
    search_criteria = {}
    method_config = SEARCH_METHODS.get(method)
    
    if not method_config:
        return []
        
    for field in method_config["fields"]:
        if field.endswith("_initial"):
            base_field = field.replace("_initial", "")
            value = query_params.get(base_field, "")
            if value:
                search_criteria[base_field] = {"$regex": f"^{value[0]}", "$options": "i"}
        else:
            value = query_params.get(field)
            if value:
                search_criteria[field] = {"$regex": f"^{value}", "$options": "i"}
    
    return list(petitions_collection.find(search_criteria))
