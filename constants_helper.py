import csv

def extract_from_csv(file):
    # Initialize an empty dictionary
    zip_code_dict = {}

    with open(file, mode='r') as file:
        # Create a CSV reader object
        csv_reader = csv.reader(file)

        # Skip the header row
        next(csv_reader)
        
        for row in csv_reader:
            zip_code, county = row
            zip_code_dict[zip_code] = county

    return zip_code_dict