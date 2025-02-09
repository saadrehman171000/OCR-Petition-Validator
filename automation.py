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

from automation_helper import (
    get_county_by_zip,
    send_details_by_xpath,
)

from constants import SS_DIR


def authenticate(browser):
    try:
        print("Starting authentication process...")
        url = "http://online.sigvalid.com"
        browser.get(url)

        # Login
        user_name = browser.find_element(By.XPATH, '//*[@id="username"]')
        user_name.send_keys("officebayarea")
        print("Entered username")

        password = browser.find_element(By.XPATH, '//*[@id="password"]')
        password.send_keys("ginp88U%Of&S")
        print("Entered password")

        submit_btn = browser.find_element(By.XPATH, '//*[@id="button_login"]')
        print("Clicking login button...")
        submit_btn.click()
        print("Login successful")
        sleep(2)

        # Click on Search Voters button
        search_voters_btn = browser.find_element(By.XPATH, "//a[@href='/searches/']")
        print("Clicking Search Voters button...")
        search_voters_btn.click()
        sleep(2)

        # Click on NEW REG RENT link
        new_reg_rent_link = browser.find_element(By.XPATH, "//a[@href='/searches/WTHD/']")
        print("Clicking NEW REG RENT link...")
        new_reg_rent_link.click()
        sleep(2)

        # You'll now be on the county selection page
        # Select county (default is ALAMEDA)
        county_select = browser.find_element(By.ID, "id_county")
        county_select.click()
        # You can set different county if needed
        # select = Select(county_select)
        # select.select_by_value("ALAMEDA")
        print("County selected")

        return True

    except Exception as e:
        print(f"Authentication error: {e}")
        return False


def process_petition_text(first_name, last_name, address, zip_code, petition, data):
    options = Options()
    options.binary_location = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    # options.add_argument('--headless')  # Comment this line out
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-extensions')
    options.add_argument('--ignore-certificate-errors')
    
    try:
        print("Setting up Chrome WebDriver...")
        service = Service(ChromeDriverManager().install())
        print("ChromeDriver path:", service.path)
        browser = webdriver.Chrome(service=service, options=options)
        print("Chrome WebDriver initialized successfully")
        
        browser.maximize_window()
        print("Browser window maximized")

        if not authenticate(browser):
            print("Authentication failed")
            raise Exception("Authentication failed")
        print("Authentication successful")
        sleep(2)

        print(f"Filling in search form for petition {petition}...")

        send_details_by_xpath(browser, '//*[@id="id_first_name"]', first_name)
        print(f"Entered first name: {first_name}")

        send_details_by_xpath(browser, '//*[@id="id_last_name"]', last_name)
        print(f"Entered last name: {last_name}")

        send_details_by_xpath(browser, '//*[@id="id_address"]', address)
        print(f"Entered address: {address}")

        send_details_by_xpath(browser, '//*[@id="id_zip"]', zip_code)
        print(f"Entered zip code: {zip_code}")

        submit_btn = browser.find_element(By.XPATH, '//*[@id="id_registry_btn_submit"]')
        print("Clicking submit button...")
        submit_btn.click()
        sleep(4)

        try:
            print("Checking for alert...")
            alert = browser.switch_to.alert
            alert.accept()
            print("Alert accepted")
        except:
            print("No alert present")

        # Process the table data
        try:
            print("Looking for results table...")
            table_id = "table_results"
            WebDriverWait(browser, 10).until(
                EC.presence_of_element_located((By.ID, table_id))
            )
            table_element = browser.find_element(By.ID, table_id)
            table_html = table_element.get_attribute("outerHTML")

            soup = BeautifulSoup(table_html, "html.parser")
            table_rows = soup.find_all("tr")
            results = []

            for row in table_rows[1:]:  # Skip header row
                is_duplicate = False
                row_class = row.get("class", None)
                if row_class == ["danger"]:
                    is_duplicate = True

                columns = row.find_all("td")
                row_data = [col.text.strip() for col in columns]
                if row_data:
                    row_data.append(is_duplicate)
                    results.append(row_data)

            print(f"Found {len(results)} results")
            return {
                "success": True,
                "data": results,
                "petition": petition
            }

        except Exception as err:
            print(f"Error processing table: {err}")
            try:
                message_element = browser.find_element(By.XPATH, '//*[@id="page"]/div/h3/font')
                return {
                    "success": False,
                    "message": message_element.text,
                    "petition": petition
                }
            except:
                return {
                    "success": False,
                    "message": "No results found",
                    "petition": petition
                }

    except Exception as e:
        print(f"Error in process_petition_text: {e}")
        return {
            "success": False,
            "message": str(e),
            "petition": petition
        }
    finally:
        browser.quit()