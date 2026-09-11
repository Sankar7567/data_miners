import os
import re
import sys
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("scraper")

# Output directory for ingested PDFs
STORAGE_DIR = Path(__file__).resolve().parent / "storage" / "pdfs"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

SCRAPE_LOGS: List[Dict[str, str]] = []

def add_log(msg: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    entry = {"time": timestamp, "message": msg, "level": level}
    SCRAPE_LOGS.append(entry)
    if len(SCRAPE_LOGS) > 300:
        SCRAPE_LOGS.pop(0)
    logger.info(f"[{level}] {msg}")

# Primary public index pages for Ministry of Coal & CIL documents
TARGET_INDEX_URLS = [
    {
        "url": "https://coal.gov.in/public-information/monthly-statistics-at-glance",
        "prefix": "MoC_Monthly_Statistics"
    },
    {
        "url": "https://coal.nic.in/public-information/monthly-report-cabinet",
        "prefix": "MoC_Monthly_Cabinet_Summary"
    }
]

# Direct backup links to official government & CIL PDFs
DIRECT_GOVT_PDFS = [
    {
        "name": "MoC_Policy_Initiatives_Annual_Report.pdf",
        "url": "https://coal.gov.in/sites/default/files/2025-02/chap3AnnualReport2025en2.pdf"
    },
    {
        "name": "CIL_Integrated_BRSR_Report.pdf",
        "url": "https://nsearchives.nseindia.com/corporate/COALINDIA_11082023153330_BRSR23.pdf"
    },
    {
        "name": "Coal_Ministry_Mine_Plan_Guidelines.pdf",
        "url": "https://coal.gov.in/sites/default/files/2026-07/31-07-2026-wn.pdf"
    },
    {
        "name": "CIL_CSR_Operational_Review.pdf",
        "url": "https://coal.gov.in/sites/default/files/2024-03/15-03-2024csr.pdf"
    },
    {
        "name": "Ministry_Gasification_Clarifications.pdf",
        "url": "https://coal.gov.in/sites/default/files/2026-08/MOC-CCT-07-08.pdf"
    }
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def purge_synthetic_pdfs() -> int:
    """Removes previous synthetic/mock PDFs (< 20KB stubs) so only real documents exist."""
    purged = 0
    for pdf_file in STORAGE_DIR.glob("*.pdf"):
        try:
            sz = pdf_file.stat().st_size
            if sz < 20000:  # Mock files were 2KB-5KB stubs
                pdf_file.unlink()
                purged += 1
        except Exception as e:
            logger.warning(f"Could not purge {pdf_file.name}: {e}")
    if purged > 0:
        add_log(f"Purged {purged} synthetic mock PDF files from repository.", "INFO")
    return purged

def download_pdf(url: str, filename: str) -> bool:
    """Downloads a single PDF file to local storage."""
    filepath = STORAGE_DIR / filename
    if filepath.exists() and filepath.stat().st_size > 10000:
        add_log(f"Verified cached real PDF: {filename} ({round(filepath.stat().st_size / 1024, 1)} KB)")
        return True

    try:
        with httpx.Client(timeout=45.0, follow_redirects=True, headers=HEADERS) as client:
            response = client.get(url)
            if response.status_code == 200 and len(response.content) > 5000:
                with open(filepath, "wb") as f:
                    f.write(response.content)
                sz_kb = round(len(response.content) / 1024, 1)
                add_log(f"Downloaded official document: {filename} ({sz_kb} KB)", "SUCCESS")
                return True
            else:
                add_log(f"HTTP {response.status_code} for {url}", "WARNING")
    except Exception as e:
        add_log(f"Failed downloading {url}: {e}", "ERROR")
    return False

def scrape_official_coal_portal(max_crawled_per_page: int = 8) -> List[str]:
    """Crawls official Ministry of Coal pages for PDF links and downloads real documents."""
    add_log("=== Starting Real PDF Scraper for Ministry of Coal & CIL ===")
    purge_synthetic_pdfs()
    downloaded_count = 0

    # 1. Download Direct Official Key Documents
    for doc in DIRECT_GOVT_PDFS:
        if download_pdf(doc["url"], doc["name"]):
            downloaded_count += 1

    # 2. Crawl Public Portal Pages for Additional Monthly PDFs
    with httpx.Client(timeout=25.0, follow_redirects=True, headers=HEADERS) as client:
        for target in TARGET_INDEX_URLS:
            page_url = target["url"]
            prefix = target["prefix"]
            try:
                add_log(f"Crawling portal index: {page_url}...")
                res = client.get(page_url)
                if res.status_code != 200:
                    add_log(f"Index status {res.status_code} for {page_url}", "WARNING")
                    continue
                
                soup = BeautifulSoup(res.text, "html.parser")
                rows = soup.find_all("tr")
                page_downloads = 0

                for row in rows:
                    cols = [c.get_text(strip=True) for c in row.find_all(["th", "td"])]
                    link_tag = row.find("a", href=True)
                    if not link_tag:
                        continue

                    href = link_tag["href"]
                    if not (href.lower().endswith(".pdf") or "download" in link_tag.text.lower()):
                        continue

                    full_url = urljoin(page_url, href)
                    
                    # Formulate clean, descriptive official filename
                    title_text = cols[1] if len(cols) > 1 and len(cols[1]) > 2 else link_tag.text.strip()
                    clean_title = re.sub(r'[^a-zA-Z0-9]', '_', title_text).strip('_')
                    clean_title = re.sub(r'_+', '_', clean_title)
                    if clean_title:
                        filename = f"{prefix}_{clean_title[:35]}.pdf"
                    else:
                        base_fname = href.split("/")[-1].split("?")[0]
                        filename = f"{prefix}_{base_fname}"

                    if download_pdf(full_url, filename):
                        downloaded_count += 1
                        page_downloads += 1
                        if page_downloads >= max_crawled_per_page:
                            break

            except Exception as e:
                add_log(f"Error crawling {page_url}: {e}", "WARNING")

    all_pdfs = [str(f.name) for f in STORAGE_DIR.glob("*.pdf")]
    add_log(f"=== Scraping Complete. Total real official PDFs available: {len(all_pdfs)} ===", "SUCCESS")
    return all_pdfs

def scrape_public_data(full_scrape: bool = False) -> List[str]:
    """Alias for backwards compatibility with existing callers."""
    return scrape_official_coal_portal(max_crawled_per_page=12 if full_scrape else 6)

if __name__ == "__main__":
    files = scrape_official_coal_portal()
    print(f"\nCompleted scraping. Total real PDFs available: {len(files)}")
