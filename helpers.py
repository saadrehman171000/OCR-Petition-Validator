import re
import os

from google.cloud import vision_v1
from google.oauth2 import service_account

from PIL import Image, ExifTags

from automation import process_petition_text
from constants import GOOGLE_CREDS


def google_cred_setup():
    try:
        # Load the credentials from the JSON key file
        credentials_path = GOOGLE_CREDS
        print(f"Loading credentials from: {credentials_path}")  # Debug print
        
        if not os.path.exists(credentials_path):
            raise FileNotFoundError(f"Credentials file not found at: {credentials_path}")
            
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=['https://www.googleapis.com/auth/cloud-vision']
        )
        print("Credentials loaded successfully")  # Debug print
        
        client = vision_v1.ImageAnnotatorClient(credentials=credentials)
        print("Vision client created successfully")  # Debug print
        
        return client
    except Exception as e:
        print(f"Error in google_cred_setup: {str(e)}")
        raise


def rotate_image_based_on_metadata(image):
    try:
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == "Orientation":
                break
        exif = dict(image._getexif().items())

        if exif[orientation] == 3:
            image = image.rotate(180, expand=True)
        elif exif[orientation] == 6:
            image = image.rotate(270, expand=True)
        elif exif[orientation] == 8:
            image = image.rotate(90, expand=True)
    except (AttributeError, KeyError, IndexError):
        # Cases: image don't have getexif
        pass
    return image


def concatenate_pil_images_vertically_with_marginssss(images, margin_percentage=10):
    # Get the dimensions of the first image
    width, height = images[0].size

    # Calculate the total height for the concatenated image
    total_height = height * len(images) + int(
        height * (len(images) - 1) * margin_percentage / 100
    )

    # Create a new image with the original width and calculated height
    concatenated_image = Image.new("RGB", (width, total_height), color="white")

    # Paste each image into the concatenated image with margin vertically
    current_height = 0
    for img in images:
        concatenated_image.paste(img, (0, current_height))
        current_height += height + int(height * margin_percentage / 100)

    # Save the result
    # concatenated_image.save(output_path)

    return concatenated_image


def extract_info_updated(input_string):
    # Split the input string by newline characters
    lines = input_string.split("\n")

    # Extract name (first line)
    name = lines[0]

    name = re.sub(
        r"[^a-zA-Z\s]", "", name
    )  # <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< new

    # Extract address (second line) and remove special characters
    address = re.sub(r"[^a-zA-Z0-9\s#]", "", lines[1])

    # Extract zip code (last line) and remove special characters, keeping only numeric
    zip_code = re.sub(r"[^0-9]", "", lines[-1])

    # Check if there are 5 or more continuous numeric characters at the end of the address
    match = re.search(r"\d{5,}$", address)
    if match:
        # If found, replace the old value of zip code with the matched numeric characters
        zip_code = match.group(0)
        address = re.sub(r"\d{5,}$", "", address)

    return name, address, zip_code


def get_details_by_text(first_name, last_name, address, zip_code):
    data = {}

    for petition in ["ACC"]:  # Add more petitions as needed
        process_petition_text(first_name, last_name, address, zip_code, petition, data)

    return data


def display_results_of_searching(any_true):
    if any_true:
        text_content = "Record found in DB"
        return text_content

    else:
        text_content = "Record not found in DB"
        return text_content