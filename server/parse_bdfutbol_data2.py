import bs4
import json

html = open('bdfutbol_uc.html', encoding='utf-8').read()
soup = bs4.BeautifulSoup(html, 'lxml')

data = {}

# 1. Top banner details
h1 = soup.find('h1')
data['stadium_name'] = h1.text.strip() if h1 else None

# Sometimes details are in sibling divs or parent divs
# Let's search by text and get the next sibling or parent's next text
def get_val(label):
    el = soup.find(text=lambda t: t and t.strip() == label)
    if el:
        # Check next sibling
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
home_team_el = soup.find('div', string=lambda t: t and t.strip() == 'Home Team')
if home_team_el:
    ht_container = home_team_el.find_next_sibling('div')
    if ht_container:
        # The team name might be in an anchor or strong tag
        data['home_team'] = ht_container.text.strip().replace('\n', ' ')

# Visiting Teams
visiting = soup.find('div', string=lambda t: t and t.strip() == 'Visiting Teams')
if visiting:
    vt_list = []
    ul = visiting.find_next_sibling('div').find('ul')
    if ul:
        for li in ul.find_all('li'):
            vt_list.append(li.text.strip().replace('\n', ' '))
    data['visiting_teams'] = vt_list

print(json.dumps(data, indent=2))
