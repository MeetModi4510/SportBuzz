import undetected_chromedriver as uc
import time
import os

def main():
    options = uc.ChromeOptions()
    options.headless = False
    print("Launching UC...")
    driver = uc.Chrome(options=options, version_main=149)
    
    try:
        print("Navigating to BDFutbol...")
        driver.get('https://www.bdfutbol.com/en/s/2002.html')
        
        # Wait a bit to let any CF challenge solve itself
        time.sleep(10)
        
        html = driver.page_source
        with open('bdfutbol_uc.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Saved to bdfutbol_uc.html")
        
    except Exception as e:
        print("Error:", e)
    finally:
        driver.quit()

if __name__ == '__main__':
    main()
