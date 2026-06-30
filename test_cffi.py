from curl_cffi import requests

url = "https://www.bdfutbol.com/en/s/2002.html"
response = requests.get(url, impersonate="chrome110")
print("Status:", response.status_code)
if "Etihad" in response.text:
    print("Found Etihad!")
else:
    print("Did not find Etihad. Cloudflare blocked?")
