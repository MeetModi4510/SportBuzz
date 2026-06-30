import undetected_chromedriver as uc
import time

options = uc.ChromeOptions()
options.add_argument('--headless=new')
options.add_argument('--disable-gpu')
options.add_argument('--window-size=1920,1080')
options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36')

try:
    driver = uc.Chrome(options=options, version_main=149)
    driver.get('https://www.bdfutbol.com/en/s/2002.html')
    time.sleep(10)
    html = driver.page_source
    if html and "Etihad" in html:
        print("Success! Headless bypassed Cloudflare.")
    else:
        print("Failed to bypass in headless.")
except Exception as e:
    print(f"Error: {e}")
finally:
    try:
        driver.quit()
    except:
        pass
