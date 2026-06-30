from DrissionPage import ChromiumPage, ChromiumOptions
import time

co = ChromiumOptions()
co.headless(True)
co.set_argument('--disable-gpu')
co.set_argument('--no-sandbox')
co.set_user_agent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36')

page = ChromiumPage(co)
try:
    page.get('https://www.bdfutbol.com/en/v/v1.html')
    time.sleep(5)
    html = page.html
    with open('campnou_drission.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('Saved to campnou_drission.html')
except Exception as e:
    print(e)
finally:
    page.quit()
