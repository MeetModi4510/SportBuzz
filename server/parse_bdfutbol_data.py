import bs4
import json

html = open('bdfutbol_uc.html', encoding='utf-8').read()
soup = bs4.BeautifulSoup(html, 'lxml')

data = {}

# 1. Top banner details
data['stadium_name'] = soup.find('h1').text.strip() if soup.find('h1') else None

# The details like Complete name, Capacity, Opening etc. are likely in divs with classes or specific structures
top_details = soup.find_all('div', class_='mr-3') # Just guessing, let's find the text 'Capacity'
for div in soup.find_all('div'):
    text = div.text.strip()
    if text == 'Capacity':
        # The next element might be the value
        val_div = div.find_next_sibling('div')
        if val_div: data['capacity'] = val_div.text.strip()
    elif text == 'Opening':
        val_div = div.find_next_sibling('div')
        if val_div: data['opening'] = val_div.text.strip()
    elif text == 'Dimensions':
        val_div = div.find_next_sibling('div')
        if val_div: data['dimensions'] = val_div.text.strip()
    elif text == 'Architect':
        val_div = div.find_next_sibling('div')
        if val_div: data['architect'] = val_div.text.strip()
    elif text == 'Location':
        # Be careful, there's another Location section
        val_div = div.find_next_sibling('div')
        if val_div and not data.get('location'): data['location'] = val_div.text.strip()
    elif text == 'Complete name':
        val_div = div.find_next_sibling('div')
        if val_div: data['complete_name'] = val_div.text.strip()

# Let's also look for the stadium image URL
img_tag = soup.select_source('img') # Will figure out later

print(json.dumps(data, indent=2))
