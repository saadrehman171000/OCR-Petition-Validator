from selenium.webdriver.common.by import By
from constants import COUNTY_MAPPING

def send_details_by_xpath(browser, xpath, details):
    element = browser.find_element(By.XPATH, xpath)
    element.send_keys(details)


def get_county_by_zip(zip):
    return COUNTY_MAPPING[zip]