from bs4 import BeautifulSoup
import re
import sys
soup = BeautifulSoup(open('campnou_dump.html', encoding='utf-8'), 'html.parser')

finals_arr = []
for sec in soup.find_all(['h2', 'h3']):
    title = sec.text.strip()
    if title == 'Finals Played':
        content_div = sec.find_next_sibling('div')
        if not content_div and sec.parent:
            content_div = sec.parent.find_next_sibling('div')
        
        if content_div:
            for mb4 in content_div.find_all('div', class_='mb-4'):
                comp = ''
                h4 = mb4.find('h4')
                if h4: comp = h4.text.strip()
                
                for match in mb4.find_all('div', class_='final-match'):
                    date = ''
                    muted = match.find('small', class_='text-muted')
                    if muted: date = muted.text.strip()
                    
                    teams = [t.text.strip() for t in match.find_all('span', class_='team-name')]
                    scores = [s.text.strip() for s in match.find_all('div', class_=re.compile('resultat-gols'))]
                    
                    if len(teams) >= 2:
                        score_str = f"{scores[0]} - {scores[1]}" if len(scores) >= 2 else ""
                        finals_arr.append(f"{comp} {date} {teams[0]} {score_str} {teams[1]}")

print(', '.join(finals_arr).encode('utf-8').decode(sys.stdout.encoding, 'replace'))
