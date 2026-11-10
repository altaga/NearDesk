import time, os
from playwright.sync_api import sync_playwright

os.makedirs("operator_screenshots", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    port = 3001 if os.environ.get("PORT") == "3001" else 3001
    page.goto(f"http://localhost:{port}")
    page.wait_for_selector("text=NearDesk")
    page.wait_for_timeout(2500)
    page.screenshot(path="operator_screenshots/01_operator_chat.png")

    # 2. Click Machine view on rail
    page.click("button[title='Machine']")
    page.wait_for_timeout(2000)
    page.screenshot(path="operator_screenshots/02_machine_files.png")

    # 3. Machine -> Terminal
    page.click("role=button[name='Terminal']")
    page.wait_for_timeout(1000)
    page.screenshot(path="operator_screenshots/03_machine_terminal.png")

    # 4. Machine -> Browser
    page.click("role=button[name='Browser']")
    page.wait_for_timeout(1500)
    page.screenshot(path="operator_screenshots/04_machine_browser.png")

    # 5. Machine -> Jobs
    page.click("role=button[name='Jobs']")
    page.wait_for_timeout(1000)
    page.screenshot(path="operator_screenshots/05_machine_jobs.png")

    # 6. Click Board view on rail
    page.click("button[title='Board']")
    page.wait_for_timeout(2500)
    page.screenshot(path="operator_screenshots/06_board_dashboard.png")

    # 7. Click NEAR Hub on rail
    page.click("button[title='NEAR Hub']")
    page.wait_for_timeout(2000)
    page.screenshot(path="operator_screenshots/07_near_hub.png")

    # 8. Click Fleet on rail
    page.click("button[title='Fleet']")
    page.wait_for_timeout(2000)
    page.screenshot(path="operator_screenshots/08_fleet_cluster.png")

    # 9. Click Library on rail
    page.click("button[title='Library']")
    page.wait_for_timeout(1500)
    page.screenshot(path="operator_screenshots/09_library_memory.png")

    browser.close()

print("All Operator Desk views captured successfully!")
