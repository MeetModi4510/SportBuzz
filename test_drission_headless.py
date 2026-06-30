from DrissionPage import ChromiumPage, ChromiumOptions
import time

co = ChromiumOptions()
co.headless(True)
# Add basic anti-detection args
co.set_argument('--disable-gpu')
co.set_argument('--no-sandbox')
co.set_user_agent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36')

page = ChromiumPage(co)
try:
    page.get('https://www.bdfutbol.com/en/s/2002.html')
    # wait for page to load, check for CF challenge
    time.sleep(5)
    html = page.html
    if "Etihad" in html:
        print("Success! Headless DrissionPage bypassed Cloudflare.")
    else:
        print("Failed to bypass in headless DrissionPage.")
except Exception as e:
    print(f"Error: {e}")
finally:
    page.quit()
