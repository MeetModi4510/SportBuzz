import urllib.request
import json
import re
html = urllib.request.urlopen('https://html.duckduckgo.com/html/?q=bdfutbol+Camp+Nou+stadium').read().decode('utf-8')
print('\n'.join(re.findall(r'href=[\'\"]([^\'\"]+bdfutbol[^\'\"]+)[\'\"]', html)))
