import bs4
import json
import sys
sys.path.append('server')
from bdfutbol_uc_scraper import parse_html

try:
    html = open('server/bdfutbol_uc.html', encoding='utf-8').read()
    print(json.dumps(parse_html(html), indent=2))
except Exception as e:
    print(e)
