import os
import re
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("scraper")

# Maintain logs for frontend consumption
SCRAPE_LOGS = []

def add_log(msg: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    entry = {"time": timestamp, "message": msg, "level": level}
    SCRAPE_LOGS.append(entry)
    if len(SCRAPE_LOGS) > 300:
        SCRAPE_LOGS.pop(0)
    logger.info(f"[{level}] {msg}")

# Alias for backwards compatibility in main.py
def purge_synthetic_pdfs():
    pass

def scrape_public_data(full_scrape: bool = False):
    return scrape_official_coal_portal()

# Output directory for ingested PDFs
STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage", "pdfs")
os.makedirs(STORAGE_DIR, exist_ok=True)

# Primary public index pages for Ministry of Coal & CIL documents
TARGET_INDEX_URLS = [
    "https://coal.gov.in/public-information/monthly-statistics-at-glance",
    "https://coal.nic.in/public-information/monthly-report-cabinet",
]

# Direct backup links to official government & CIL PDFs if live index scraping is blocked
DIRECT_GOVT_PDFS = [
    {
        "name": "MoC_Policy_Initiatives_Annual_Report.pdf",
        "url": "https://coal.gov.in/sites/default/files/2025-02/chap3AnnualReport2025en2.pdf"
    },
    {
        "name": "CIL_Integrated_BRSR_Report.pdf",
        "url": "https://nsearchives.nseindia.com/corporate/COALINDIA_11082023153330_BRSR23.pdf"
    }
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def download_pdf(url: str, filename: str) -> bool:
    """Downloads a single PDF file to local storage."""
    filepath = os.path.join(STORAGE_DIR, filename)
    if os.path.exists(filepath) and os.path.getsize(filepath) > 10000:
        add_log(f"[SKIP] Already downloaded: {filename}")
        return True

    try:
        with httpx.Client(timeout=30.0, follow_redirects=True, headers=HEADERS) as client:
            response = client.get(url)
            if response.status_code == 200 and len(response.content) > 5000:
                with open(filepath, "wb") as f:
                    f.write(response.content)
                add_log(f"[SUCCESS] Downloaded {filename} ({len(response.content) // 1024} KB)", "SUCCESS")
                return True
    except Exception as e:
        add_log(f"[ERROR] Failed downloading {url}: {e}", "ERROR")
    return False

def scrape_official_coal_portal():
    """Crawls official Ministry of Coal pages for PDF links and downloads them."""
    add_log("=== Starting Real PDF Scraper for CMPDI / CIL ===")
    downloaded_count = 0
    downloaded_files = []

    # 1. Download Direct Official Key Documents
    for doc in DIRECT_GOVT_PDFS:
        if download_pdf(doc["url"], doc["name"]):
            downloaded_count += 1
            downloaded_files.append(doc["name"])

    # 2. Crawl Public Portal Pages for Additional Monthly PDFs
    with httpx.Client(timeout=15.0, follow_redirects=True, headers=HEADERS) as client:
        for page_url in TARGET_INDEX_URLS:
            try:
                res = client.get(page_url)
                if res.status_code != 200:
                    continue

                soup = BeautifulSoup(res.text, "html.parser")
                links = soup.find_all("a", href=True)

                for link in links:
                    href = link["href"]
                    if href.lower().endswith(".pdf") or "Download" in link.text:
                        full_url = urljoin(page_url, href)
                        clean_name = re.sub(r'[^a-zA-Z0-0_]', '_', link.text.strip()) or "coal_report"
                        filename = f"{clean_name[:40]}.pdf"

                        if download_pdf(full_url, filename):
                            downloaded_count += 1
                            downloaded_files.append(filename)
                            if downloaded_count >= 15: # Cap batch for memory efficiency
                                break
            except Exception as e:
                add_log(f"[WARN] Error crawling {page_url}: {e}", "WARNING")

    add_log(f"=== Scraping Complete. Total real PDFs available: {len(os.listdir(STORAGE_DIR))} ===", "SUCCESS")
    return downloaded_files

if __name__ == "__main__":
    scrape_official_coal_portal()
