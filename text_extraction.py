# text_extraction.py
import re


def extract_info_updated(input_string):
    print(f"Processing text:\n{input_string}\n")

    lines = input_string.split('\n')
    full_name = None
    address = None
    zip_code = None

    name_patterns = [
        r'(?i)(?:Print Name|Name)[:\s]*([A-Za-z\s]+)',
        r'(?i)Signature[:\s]*([A-Za-z\s]+)',
        r'([A-Za-z]+\s+[A-Za-z]+)(?=\s*(?:cor|residence|address))',
    ]

    address_patterns = [
        r'(?i)Address[:\s]*(?:ONLY)?[:\s]*([0-9]+[^,\n]+)',
        r'(?i)Residence[:\s]*([0-9]+[^,\n]+)',
        r'([0-9]+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Boulevard|Blvd))',
    ]

    zip_patterns = [
        r'(?i)Zip[:\s]*([0-9]{5})',
        r'\b9[0-9]{4}\b',
    ]

    # Process name
    for line in lines:
        line = line.strip()
        if not full_name:
            for pattern in name_patterns:
                match = re.search(pattern, line)
                if match:
                    potential_name = match.group(1).strip()
                    if len(potential_name.split()) >= 2 and not potential_name.lower().startswith('print'):
                        full_name = potential_name
                        break

    # Process address
    for line in lines:
        line = line.strip()
        if not address:
            for pattern in address_patterns:
                match = re.search(pattern, line)
                if match:
                    potential_address = match.group(1).strip()
                    if any(char.isdigit() for char in potential_address):
                        address = potential_address
                        break

    # Process ZIP code
    for line in lines:
        line = line.strip()
        if not zip_code:
            for pattern in zip_patterns:
                match = re.search(pattern, line)
                if match:
                    if match.group(1) if '(' in pattern else match.group(0):
                        zip_code = match.group(1) if '(' in pattern else match.group(0)
                        break

    # Fallback for name
    if not full_name:
        for line in lines:
            # Look for lines with exactly two capitalized words
            words = line.strip().split()
            if len(words) == 2 and all(word[0].isupper() for word in words):
                potential_name = ' '.join(words)
                if not any(word.lower() in potential_name.lower() for word in
                           ['print', 'name', 'address', 'only', 'city', 'zip']):
                    full_name = potential_name
                    break

    # Clean up results
    if full_name:
        full_name = ' '.join(word.capitalize() for word in full_name.split())
    if address:
        address = re.sub(r'\s+', ' ', address).strip()
        address = address.replace('ONLY:', '').strip()
    if zip_code:
        zip_code = zip_code.strip()

    print(f"Extracted data:\nName: {full_name}\nAddress: {address}\nZip: {zip_code}\n")

    return full_name, address, zip_code