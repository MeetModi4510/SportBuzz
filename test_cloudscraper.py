import cloudscraper
import json

scraper = cloudscraper.create_scraper()
try:
    response = scraper.get('https://www.bdfutbol.com/en/s/2002.html')
    print("Status:", response.status_code)
    if "Etihad" in response.text:
        print("Success! cloudscraper bypassed Cloudflare.")
    else:
        print("Failed to bypass Cloudflare. Response text:", response.text[:200])
except Exception as e:
    print("Error:", str(e))
