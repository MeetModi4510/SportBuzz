import undetected_chromedriver as uc
from bs4 import BeautifulSoup
import time
import sys

def test_cricmetric():
    print("Launching Undetected Chromedriver for Cricmetric...")
    options = uc.ChromeOptions()
    # Note: Running headless might still trigger Cloudflare.
    # Trying headless first. If it fails, we'd theoretically need xvfb or non-headless.
    options.add_argument('--headless')
    
    driver = None
    try:
        driver = uc.Chrome(options=options, use_subprocess=True, version_main=149)
        driver.get('https://www.cricmetric.com/sage/?q=narendra+modi+stadium')
        
        # Wait for page load or cloudflare
        time.sleep(5)
        
        print("Initial Title:", driver.title)
        retries = 0
        while 'Just a moment...' in driver.title and retries < 15:
            print("Waiting for Cloudflare challenge...")
            time.sleep(2)
            retries += 1
            
        print("Final Title:", driver.title)
        
        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')
        
        tables = soup.find_all('table')
        print(f"--- Extracting Data (Found {len(tables)} tables) ---")
        for i, table in enumerate(tables):
            print(f"\nTable {i+1}:")
            for row in table.find_all('tr'):
                print(' '.join(row.stripped_strings))
                
        # Try extracting text
        sage_res = soup.select_one('.sage-response, .sage-results, .card')
        if sage_res:
            print("\nResponse text:", sage_res.get_text(separator=' ', strip=True)[:500])
        else:
            print("\nBody text:", soup.body.get_text(separator=' ', strip=True)[:500] if soup.body else "")
            
    except Exception as e:
        print("Failed:", str(e))
    finally:
        if driver:
            driver.quit()

if __name__ == '__main__':
    test_cricmetric()
