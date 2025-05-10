import time
import os
from time import sleep
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import json
import csv
from datetime import datetime

from automation_helper import (
    get_county_by_zip,
    send_details_by_xpath,
)

from config import JSON_DIR, CSV_DIR, EXCEL_DIR, SS_DIR, ensure_data_directories

DATA_DIR = "data"

def authenticate(browser):
    try:
        print("Starting authentication process...")
        wait = WebDriverWait(browser, 20)  # Increase wait time
        
        url = "http://online.sigvalid.com"
        browser.get(url)
        sleep(2)  # Wait for page load

        # Login with explicit waits
        user_name = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="username"]')))
        user_name.clear()
        user_name.send_keys("officebayarea")
        print("Entered username")

        password = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="password"]')))
        password.clear()
        password.send_keys("ginp88U%Of&S")
        print("Entered password")

        submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, '//*[@id="button_login"]')))
        submit_btn.click()
        print("Login successful")
        sleep(3)  # Increase wait time after login

        # Click on Search Voters button with wait
        search_voters_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[@href='/searches/']"))
        )
        search_voters_btn.click()
        print("Clicking Search Voters button...")
        sleep(2)

        # Click on NEW REG RENT link with wait
        new_reg_rent_link = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[@href='/searches/WTHD/']"))
        )
        new_reg_rent_link.click()
        print("Clicking NEW REG RENT link...")
        sleep(2)

        # Select county with wait
        county_select = wait.until(EC.presence_of_element_located((By.ID, "id_county")))
        county_select.click()
        print("County selected")
        sleep(1)

        return True

    except Exception as e:
        print(f"Authentication error: {e}")
        return False


def process_petition_text(browser, first_name, last_name, address, zip_code, petition, data):
    try:
        result = {
            "success": False,
            "message": "",
            "data": None,
            "chunk_number": data.get('chunk_number'),
            "batch_id": data.get('batch_id'),
            "search_criteria": {
                "first_name": first_name,
                "last_name": last_name,
                "address": address,
                "zip_code": zip_code
            }
        }

        search_method = data.get('method', '')
        wait = WebDriverWait(browser, 20)
        
        print(f"\nProcessing signature {data.get('chunk_number')}:")
        print(f"Method: {search_method}")
        print(f"Name: {first_name} {last_name}")
        print(f"Address: {address}")
        print(f"Zip: {zip_code}")

        # Clear all fields first
        fields = {
            "id_first_name": "",
            "id_last_name": "",
            "id_address": "",
            "id_zip": ""
        }
        
        for field_id in fields:
            try:
                element = wait.until(EC.presence_of_element_located((By.ID, field_id)))
                element.clear()
                sleep(0.5)
            except Exception as e:
                print(f"Error clearing {field_id}: {str(e)}")

        # Fill form based on search method
        try:
            if search_method == 'method1':  # Full First Name + Last Initial
                # Clear and fill first name (full)
                first_name_field = wait.until(EC.presence_of_element_located((By.ID, "id_first_name")))
                first_name_field.clear()
                if first_name:
                    print(f"Entering full first name: {first_name}")
                    first_name_field.send_keys(first_name)
                sleep(1)

                # Clear and fill last name (initial only)
                last_name_field = wait.until(EC.presence_of_element_located((By.ID, "id_last_name")))
                last_name_field.clear()
                if last_name:
                    last_initial = last_name[0]
                    print(f"Entering last initial: {last_initial}")
                    last_name_field.send_keys(last_initial)
                sleep(1)

            elif search_method == 'method2':  # First Initial + Full Last Name
                if first_name:
                    browser.find_element(By.ID, "id_first_name").send_keys(first_name[0])
                if last_name:
                    browser.find_element(By.ID, "id_last_name").send_keys(last_name)

            elif search_method == 'method3':  # Full Name + Street
                browser.find_element(By.ID, "id_first_name").send_keys(first_name)
                browser.find_element(By.ID, "id_last_name").send_keys(last_name)
                if data.get('street_number'):
                    browser.find_element(By.ID, "id_address").send_keys(data.get('street_number'))

            elif search_method == 'method4':  # Complete Address with Zip Code
                browser.find_element(By.ID, "id_address").send_keys(address)
                browser.find_element(By.ID, "id_zip").send_keys(zip_code)

            elif search_method == 'method5':  # Street Only
                street_address = f"{data.get('street_number', '')} {data.get('street_name', '')}".strip()
                browser.find_element(By.ID, "id_address").send_keys(street_address)

            else:  # Direct search
                browser.find_element(By.ID, "id_first_name").send_keys(first_name)
                browser.find_element(By.ID, "id_last_name").send_keys(last_name)
                browser.find_element(By.ID, "id_address").send_keys(address)
                browser.find_element(By.ID, "id_zip").send_keys(zip_code)

            sleep(1)  # Wait after filling form

            # Click submit
            submit_btn = wait.until(EC.element_to_be_clickable((By.ID, "id_registry_btn_submit")))
            submit_btn.click()
            sleep(2)

            # Check for limit reached message
            try:
                limit_message = browser.find_element(By.XPATH, "//*[contains(text(), '500 - Limit Reached')]")
                if limit_message:
                    result.update({
                        "success": False,
                        "message": "Search limit reached. Please refine your search criteria.",
                        "found": False
                    })
                    return result
            except:
                pass  # No limit message found, continue processing

            # Process results
            table = wait.until(EC.presence_of_element_located((By.ID, "table_results")))
            rows = table.find_elements(By.TAG_NAME, "tr")[1:]  # Skip header row
            
            results = []
            for row in rows:
                cols = row.find_elements(By.TAG_NAME, "td")
                if cols:
                    is_duplicate = "danger" in row.get_attribute("class")
                    row_data = [col.text.strip() for col in cols]
                    row_data.append(is_duplicate)
                    results.append(row_data)

            if results:
                result.update({
                    "success": True,
                    "message": "Data found",
                    "data": results,
                    "found": True
                })
            else:
                result.update({
                    "success": True,
                    "message": "No matches found",
                    "found": False
                })

        except Exception as e:
            print(f"Error in form processing: {str(e)}")
            result.update({
                "success": False,
                "message": str(e),
                "found": False
            })

        # Take screenshot
        try:
            sleep(1)
            screenshot_dir = os.path.join('static', 'search_screenshots')
            os.makedirs(screenshot_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            screenshot_filename = f"search_result_{timestamp}_chunk_{data.get('chunk_number', 0)}.png"
            screenshot_path = os.path.join(screenshot_dir, screenshot_filename)
            
            browser.save_screenshot(screenshot_path)
            print(f"Screenshot saved: {screenshot_path}")
            
            result['screenshot_url'] = f"/search_screenshots/{screenshot_filename}"
            
        except Exception as screenshot_error:
            print(f"Error taking screenshot: {screenshot_error}")
            result['screenshot_url'] = None

        return result

    except Exception as e:
        print(f"Error processing signature: {str(e)}")
        return {
            "success": False,
            "message": str(e),
            "chunk_number": data.get('chunk_number'),
            "found": False
        }