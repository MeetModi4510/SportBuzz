from curl_cffi import requests
from bs4 import BeautifulSoup
import sys

def test_cricmetric():
    print("Fetching Cricmetric using curl_cffi...")
    try:
        response = requests.get(
            "https://www.cricmetric.com/sage/?q=narendra+modi+stadium", 
            impersonate="chrome120",
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        html = response.text
        soup = BeautifulSoup(html, 'html.parser')
        
        print("Page Title:", soup.title.string if soup.title else "No Title")
        
        # Check if it's the cloudflare challenge page
        if 'Just a moment...' in (soup.title.string if soup.title else ""):
            print("Failed: Still stuck on Cloudflare challenge!")
            return
            
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

if __name__ == '__main__':
    test_cricmetric()
