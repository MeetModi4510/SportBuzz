import tls_client

session = tls_client.Session(
    client_identifier="chrome_112",
    random_tls_extension_order=True
)
try:
    res = session.get("https://www.bdfutbol.com/en/s/2002.html", headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
    })
    print("Status:", res.status_code)
    if "Etihad" in res.text:
        print("Success! tls_client bypassed Cloudflare.")
    else:
        print("Failed to bypass Cloudflare. Response text:", res.text[:200])
except Exception as e:
    print("Error:", str(e))
