import os
import time
from playwright.sync_api import sync_playwright

os.makedirs("onboarding_screenshots", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    # 1. Open Fleet view
    page.goto("http://localhost:3001")
    page.wait_for_timeout(2000)
    page.click("button[title='Fleet']")
    page.wait_for_timeout(1500)
    page.screenshot(path="onboarding_screenshots/01_fleet_dashboard.png")
    print("1. Fleet view captured")

    # 2. Click 'Pair Jetson Board' button to open Onboarding Wizard
    page.click("role=button[name='Pair Jetson Board']")
    page.wait_for_timeout(1000)
    page.screenshot(path="onboarding_screenshots/02_wizard_step1_discovery.png")
    print("2. Wizard Step 1: Discovery captured")

    # 3. Step 1 -> Click Proceed to Step 2
    page.click("role=button[name='Proceed']")
    page.wait_for_timeout(1000)
    page.screenshot(path="onboarding_screenshots/03_wizard_step2_key_binding.png")
    print("3. Wizard Step 2: Key Provisioning captured")

    # 4. Step 2 -> Click Proceed to Step 3
    page.click("role=button[name='Proceed']")
    page.wait_for_timeout(1000)
    page.screenshot(path="onboarding_screenshots/04_wizard_step3_guardrails.png")
    print("4. Wizard Step 3: Guardrails Activation captured")

    # 5. Click 'Activate Station'
    page.click("role=button[name='Activate Station']")
    page.wait_for_timeout(2000)
    page.screenshot(path="onboarding_screenshots/05_fleet_after_activation.png")
    print("5. Fleet after pairing activation captured")

    browser.close()

print("Onboarding walkthrough successfully captured!")
