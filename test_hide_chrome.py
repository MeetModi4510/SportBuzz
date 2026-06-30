import undetected_chromedriver as uc
import time
import win32gui
import win32con
import win32process

def hide_chrome(pid):
    def callback(hwnd, extra):
        _, window_pid = win32process.GetWindowThreadProcessId(hwnd)
        if window_pid == pid:
            win32gui.ShowWindow(hwnd, win32con.SW_HIDE)
    # Give it a second to create the window
    time.sleep(1)
    win32gui.EnumWindows(callback, None)

options = uc.ChromeOptions()
# You can also position it offscreen just in case it flashes before hiding
options.add_argument('--window-position=-2000,0')
driver = uc.Chrome(options=options, version_main=149)
hide_chrome(driver.browser_pid)

driver.get('https://www.bdfutbol.com/en/s/2002.html')
time.sleep(10)
html = driver.page_source
if html and "Etihad" in html:
    print("Success! Hidden window bypassed Cloudflare.")
else:
    print("Failed to bypass in hidden window.")
driver.quit()
