import undetected_chromedriver as uc
import bs4
import json
import sys
import time
import re
import threading
import platform

# Platform detection
IS_LINUX = platform.system() == 'Linux'

# Windows-only imports
if not IS_LINUX:
    try:
        import win32gui
        import win32con
        import win32process
        import psutil
        WIN32_AVAILABLE = True
    except ImportError:
        WIN32_AVAILABLE = False
else:
    WIN32_AVAILABLE = False

def start_hiding_thread(browser_pid):
    """
    Windows only: Runs a background thread that hides Chrome windows from the taskbar.
    On Linux, Chrome runs in Xvfb virtual display - no window management needed.
    """
    if not WIN32_AVAILABLE:
        return None

    import psutil

    def hide_loop():
        end_time = time.time() + 15
        while time.time() < end_time:
            try:
                try:
                    parent = psutil.Process(browser_pid)
                    all_pids = {parent.pid} | {c.pid for c in parent.children(recursive=True)}
                except psutil.NoSuchProcess:
                    break

                def callback(hwnd, extra):
                    try:
                        _, window_pid = win32process.GetWindowThreadProcessId(hwnd)
                        if window_pid in all_pids:
                            ex_style = win32gui.GetWindowLong(hwnd, win32con.GWL_EXSTYLE)
                            new_style = (ex_style | win32con.WS_EX_TOOLWINDOW) & ~win32con.WS_EX_APPWINDOW
                            win32gui.SetWindowLong(hwnd, win32con.GWL_EXSTYLE, new_style)
                            win32gui.ShowWindow(hwnd, win32con.SW_HIDE)
                    except:
                        pass

                win32gui.EnumWindows(callback, None)
            except:
                pass
            time.sleep(0.05)

    t = threading.Thread(target=hide_loop, daemon=True)
    t.start()
    return t

def parse_html(html):
    with open("campnou_dump.html", "w", encoding="utf-8") as f: f.write(html)
    soup = bs4.BeautifulSoup(html, 'lxml')
    data = {"isBDFutbol": True}

    # Fetch Location Coordinates natively from Leaflet script on the page
    map_match = re.search(r"L\.map\('mapid'\)\.setView\(\[\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\]", html)
    if map_match:
        data['locationCoords'] = [float(map_match.group(1)), float(map_match.group(2))]
    else:
        data['locationCoords'] = [0, 0]

    h1 = soup.find('h1')
    if h1: data['stadium_name'] = h1.text.strip()

    def get_val(label):
        el = soup.find(string=lambda t: t and t.strip() == label)
        if el:
            nxt = el.find_next('div')
            if nxt: return nxt.text.strip()
        return None

    data['capacity'] = get_val('Capacity')
    
    cap_str = data.get('capacity', '')
    if cap_str:
        cap_val = re.sub(r'[^\d]', '', cap_str)
        data['capacity'] = int(cap_val) if cap_val else 0
    else:
        data['capacity'] = 0

    for box in ['Matches', 'Clubs', 'Seasons', 'Competitions']:
        el = soup.find('div', string=lambda t: t and t.strip() == box)
        if el:
            parent = el.find_parent('div')
            if parent:
                val_div = parent.find_next_sibling('div')
                if val_div:
                    val_text = val_div.text.strip()
                    try:
                        data[box.lower()] = int(val_text)
                    except ValueError:
                        data[box.lower()] = 0
                else:
                    data[box.lower()] = 0
        else:
            data[box.lower()] = 0

    data['matchesHosted'] = data.get('matches', 0)
    data['competitionsTotal'] = data.get('competitions', 0)
    
    # Defaults
    data['homeTeams'] = []
    data['competitions'] = []
    data['seasonsList'] = []
    data['historicalNames'] = []
    data['visitingTeams'] = []
    data['topVisitors'] = []

    # Home Team
    home_team_el = soup.find(lambda t: t.name in ['h2', 'h3'] and 'Home Team' in t.text) or soup.find('div', string=lambda t: t and 'Home Team' in t.text)
    if home_team_el:
        ht_container = home_team_el.find_next_sibling('div') or home_team_el.find_next('div', class_='bg-white')
        if ht_container:
            for item in ht_container.find_all(lambda tag: tag.name == 'div' and tag.has_attr('class') and 'd-flex' in tag['class'] and 'justify-content-between' in tag['class']):
                a_tag = item.find('a')
                badge = item.find('div', class_='badge-custom') or item.find('span', class_='badge-custom')
                if a_tag and badge:
                    name = a_tag.text.strip()
                    m = re.search(r'\d+', badge.text)
                    data['homeTeams'].append({'name': name, 'matches': int(m.group()) if m else 0})

    # Other Sections
    for sec in soup.find_all(['h2', 'h3']):
        title = sec.text.strip()
        content_div = sec.find_next_sibling('div')
        if not content_div and sec.parent:
            content_div = sec.parent.find_next_sibling('div')
        
        if not content_div: continue
        
        if title == 'Competitions':
            table = content_div.find('table')
            if table:
                for tr in table.find_all('tr'):
                    cols = [td.text.strip() for td in tr.find_all(['td', 'th'])]
                    if len(cols) >= 2 and not 'competition' in cols[0].lower():
                        name = re.sub(r'^\d+\.\s*', '', cols[0])
                        m = re.search(r'\d+', cols[1])
                        data['competitions'].append({'name': name, 'matches': int(m.group()) if m else 0})
            else:
                items = content_div.find_all(lambda tag: tag.name == 'div' and tag.has_attr('class') and 'd-flex' in tag['class'] and 'justify-content-between' in tag['class'])
                if items:
                    for item in items:
                        spans = item.find_all('span')
                        if len(spans) >= 2:
                            name = spans[0].text.strip()
                            m = re.search(r'\d+', spans[1].text)
                            data['competitions'].append({'name': name, 'matches': int(m.group()) if m else 0})
                        
        elif title in ['Seasons', 'Visiting Teams']:
            table = content_div.find('table')
            if table:
                for tr in table.find_all('tr'):
                    cols = [td.text.strip() for td in tr.find_all(['td', 'th'])]
                    if len(cols) >= 2 and not cols[0].lower() in ['season', 'team']:
                        name = re.sub(r'^\d+\.\s*', '', cols[0])
                        m = re.search(r'\d+', cols[1])
                        val = int(m.group()) if m else 0
                        if title == 'Seasons': data['seasonsList'].append({'year': name, 'matches': val})
                        else: data['visitingTeams'].append({'name': name, 'matches': val})
            else:
                items = content_div.find_all('div', class_='visitor-item')
                if items:
                    for item in items:
                        divs = item.find_all('div')
                        if len(divs) >= 2:
                            name = divs[0].text.strip()
                            name = re.sub(r'^\d+\.\s*', '', name)
                            m = re.search(r'\d+', divs[1].text)
                            val = int(m.group()) if m else 0
                            if title == 'Seasons': data['seasonsList'].append({'year': name, 'matches': val})
                            else: data['visitingTeams'].append({'name': name, 'matches': val})
                            
        elif 'Name' in title:
            table = content_div.find('table')
            if table:
                for tr in table.find_all('tr'):
                    cols = [td.text.strip() for td in tr.find_all(['td', 'th'])]
                    if len(cols) >= 1:
                        name_str = " ".join(cols)
                        m = re.search(r'\((.*?)\)', name_str)
                        period = m.group(1) if m else ""
                        name = re.sub(r'\(.*?\)', '', name_str).strip()
                        if name and not any(x['name'] == name for x in data['historicalNames']):
                            data['historicalNames'].append({'name': name, 'period': period})
            else:
                # Robust extraction: look at all divs/lis, extract text, find parenthesis
                for row in content_div.find_all(['div', 'li', 'p']):
                    text = row.get_text(separator=" ", strip=True)
                    if not text or len(text) > 100: continue
                    m = re.search(r'\((.*?)\)', text)
                    if m:
                        period = m.group(1)
                        name = re.sub(r'\(.*?\)', '', text).strip()
                        if name and not any(x['name'] == name for x in data['historicalNames']):
                            data['historicalNames'].append({'name': name, 'period': period})
                            
        elif title == 'Finals Played':
            finals_arr = []
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
            if finals_arr:
                data['finalsPlayed'] = ", ".join(finals_arr)
                        
        elif title == 'Top Visitors':
            script_match = re.search(r'dataVisit\s*=\s*(\[.*?\]);', html, re.DOTALL)
            if script_match:
                try:
                    data['topVisitors'] = json.loads(script_match.group(1))
                except:
                    pass

    return data

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No ID provided"}))
        return
        
    stadium_id = sys.argv[1]
    
    options = uc.ChromeOptions()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    if IS_LINUX:
        # Linux (Render): Xvfb provides virtual display via xvfb-run wrapper
        # Chrome runs completely invisibly - no window management needed
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-software-rasterizer')
    else:
        # Windows (local dev): position off-screen + hide via win32
        options.add_argument('--window-position=-2000,0')

    if not IS_LINUX:
        # On Windows, undetected_chromedriver often crashes with WinError 183 if a zombie 
        # chromedriver.exe is left over in the APPDATA folder from a previous aborted run.
        import os, shutil
        appdata = os.environ.get('APPDATA')
        if appdata:
            uc_path = os.path.join(appdata, 'undetected_chromedriver')
            if os.path.exists(uc_path):
                try:
                    shutil.rmtree(uc_path, ignore_errors=True)
                except Exception:
                    pass

    driver = None
    try:
        driver = uc.Chrome(options=options, version_main=149)

        # Start hiding thread on Windows only
        hide_thread = start_hiding_thread(driver.browser_pid)
        
        # Determine endpoint: teams start with 'e', stadiums usually don't but we use 's' as default.
        endpoint = "e" if stadium_id.startswith("e") else "s"
        driver.get(f'https://www.bdfutbol.com/en/{endpoint}/{stadium_id}.html')
        
        # Smart wait for Cloudflare challenge to solve (up to 30 seconds)
        for _ in range(30):
            title = driver.title.lower()
            if "just a moment" not in title and "www.bdfutbol.com" not in title and "cloudflare" not in title:
                break
            time.sleep(1)
            
        time.sleep(2) # Give it 2 extra seconds to render the DOM fully after bypass
        
        html = driver.page_source
        data = parse_html(html)
        print(json.dumps(data))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
    finally:
        try:
            driver.quit()
        except:
            pass

if __name__ == '__main__':
    main()
