import json
import bdfutbol_uc_scraper as b
html = open('bdfutbol_uc.html', encoding='utf-8').read()
data = b.parse_html(html)
print(json.dumps(data, indent=2))
