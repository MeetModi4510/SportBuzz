import bs4
import json

html = open('bdfutbol_uc.html', encoding='utf-8').read()
soup = bs4.BeautifulSoup(html, 'lxml')

data = {}

# 1. Top banner details
h1 = soup.find('h1')
data['stadium_name'] = h1.text.strip() if h1 else None

# Sometimes details are in sibling divs or parent divs
def get_val(label):
    el = soup.find(string=lambda t: t and t.strip() == label)
    if el:
        nxt = el.find_next('div')
        if nxt: return nxt.text.strip()
    return None

data['complete_name'] = get_val('Complete name')
data['capacity'] = get_val('Capacity')
data['opening'] = get_val('Opening')
data['architect'] = get_val('Architect')
data['dimensions'] = get_val('Dimensions')
data['location'] = get_val('Location')

# Big boxes like Matches, Clubs, Seasons, Competitions
for box in ['Matches', 'Clubs', 'Seasons', 'Competitions']:
    el = soup.find('div', string=lambda t: t and t.strip() == box)
    if el:
        parent = el.find_parent('div')
        if parent:
            val_div = parent.find_next_sibling('div')
            if val_div:
                data[box.lower()] = val_div.text.strip()

# Home Team
home_team_el = soup.find('h2', string=lambda t: t and 'Home Team' in t.text) or soup.find('div', string=lambda t: t and 'Home Team' in t.text)
if home_team_el:
    # Usually in a table or list
    ht_container = home_team_el.find_next('div', class_='bg-white')
    if ht_container:
        data['home_team'] = ht_container.text.strip().replace('\n', ' ')

# Let's just grab all h2 or h3 blocks
sections = soup.find_all(['h2', 'h3'])
for sec in sections:
    title = sec.text.strip()
    content_div = sec.find_next_sibling('div')
    if content_div:
        # Get list items or text
        items = [t.text.strip() for t in content_div.find_all('li') if t.text.strip()]
        if not items:
            # Check for table
            table = content_div.find('table')
            if table:
                items = [' | '.join([c.text.strip() for c in tr.find_all(['td', 'th'])]) for tr in table.find_all('tr')]
            else:
                items = content_div.text.strip().replace('\n', ' ')
        data[title] = items

print(json.dumps(data, indent=2))
