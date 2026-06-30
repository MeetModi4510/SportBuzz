import undetected_chromedriver as uc
import time

options = uc.ChromeOptions()
options.add_argument('--window-position=-2000,0')

try:
    driver = uc.Chrome(options=options, version_main=149)
    driver.get('https://www.bdfutbol.com/en/s/2002.html')
    time.sleep(10)
    html = driver.page_source
    if html and "Etihad" in html:
        print("Success! Found Etihad with off-screen window.")
    else:
        print("Failed. HTML is none or Etihad not found.")
except Exception as e:
    print(f"Error: {e}")
finally:
    try:
        driver.quit()
    except:
        pass
