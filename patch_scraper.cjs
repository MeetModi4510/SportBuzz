const fs = require('fs');

let code = fs.readFileSync('server/bdfutbol_uc_scraper.py', 'utf8');

// Add imports
code = code.replace('import sys', 'import sys\nimport win32gui\nimport win32con\nimport win32process');

// Add hide_chrome function
const hideFunc = `def hide_chrome(pid):
    def callback(hwnd, extra):
        try:
            _, window_pid = win32process.GetWindowThreadProcessId(hwnd)
            if window_pid == pid:
                win32gui.ShowWindow(hwnd, win32con.SW_HIDE)
        except:
            pass
    win32gui.EnumWindows(callback, None)

def parse_html(html):`;
code = code.replace('def parse_html(html):', hideFunc);

// Update main to position window off-screen and hide
const newMainStart = `    options = uc.ChromeOptions()
    options.add_argument('--window-position=-2000,0')
    
    try:
        driver = uc.Chrome(options=options, version_main=149)
        time.sleep(0.5)
        hide_chrome(driver.browser_pid)
        driver.get`;
code = code.replace(/    options = uc\.ChromeOptions\(\)\s+try:\s+driver = uc\.Chrome\(options=options, version_main=149\)\s+driver\.minimize_window\(\)\s+driver\.get/, newMainStart);

fs.writeFileSync('server/bdfutbol_uc_scraper.py', code);
console.log('Patched server/bdfutbol_uc_scraper.py successfully!');
