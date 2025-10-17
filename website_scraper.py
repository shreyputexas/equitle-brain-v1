#!/usr/bin/env python3
"""
Website Scraper for Company Information
Crawls About/Team/Company History pages and returns raw text for AI processing
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse

@dataclass
class CompanyInfo:
    """Data structure for company information"""
    company_name: str
    url: str
    about_text: str  # Raw text from About/Team pages
    scraped_at: str

class WebsiteScraper:
    """Simple website scraper focused on About/Team pages"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })

    def find_relevant_pages(self, base_url: str) -> List[str]:
        """Find relevant pages like About, Team, Leadership from the homepage"""

        print(f"Looking for relevant pages on {base_url}...")

        relevant_keywords = [
            'about', 'team', 'our-team', 'leadership', 'our-story',
            'who-we-are', 'meet', 'people', 'staff', 'founders',
            'management', 'executives', 'board', 'our-people'
        ]

        try:
            response = self.session.get(base_url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            # Get the base domain
            parsed_base = urlparse(base_url)
            base_domain = f"{parsed_base.scheme}://{parsed_base.netloc}"

            # Find all links
            all_links = soup.find_all('a', href=True)
            relevant_urls = [base_url]  # Always include the starting URL

            for link in all_links:
                href = link['href']

                # Convert relative URLs to absolute
                full_url = urljoin(base_url, href)

                # Only process URLs from the same domain
                if not full_url.startswith(base_domain):
                    continue

                # Check if URL or link text contains relevant keywords
                link_text = link.get_text(strip=True).lower()
                url_path = urlparse(full_url).path.lower()

                if any(keyword in url_path or keyword in link_text for keyword in relevant_keywords):
                    if full_url not in relevant_urls:
                        relevant_urls.append(full_url)
                        print(f"  Found: {full_url}")

            print(f"Found {len(relevant_urls)} relevant page(s)")
            return relevant_urls[:5]  # Limit to 5 pages to avoid too many requests

        except Exception as e:
            print(f"Error finding pages: {str(e)}")
            return [base_url]  # Fallback to just the base URL

    def scrape_website_with_crawl(self, base_url: str) -> Optional[CompanyInfo]:
        """Scrape website by automatically finding and crawling About/Team pages"""

        print(f"\nStarting crawl from: {base_url}")
        print("=" * 60)

        # Find relevant pages
        relevant_urls = self.find_relevant_pages(base_url)

        # Combine text from all relevant pages
        all_text = []
        company_name = ""

        for url in relevant_urls:
            print(f"\nScraping: {url}")

            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')

                # Extract company name from first page
                if not company_name:
                    company_name = self._extract_company_name(soup, url)

                # Extract raw text content
                page_text = self._extract_page_text(soup)
                if page_text:
                    all_text.append(page_text)
                    print(f"  Extracted {len(page_text)} characters")

            except Exception as e:
                print(f"  Error scraping {url}: {str(e)}")
                continue

        # Combine all text
        combined_text = "\n\n".join(all_text)

        # Create result
        company_info = CompanyInfo(
            company_name=company_name or "Unknown Company",
            url=base_url,
            about_text=combined_text,
            scraped_at=datetime.now().isoformat()
        )

        print(f"\nCrawl complete! Scraped {len(relevant_urls)} pages")
        print(f"Total text extracted: {len(combined_text)} characters")
        return company_info

    def _extract_page_text(self, soup: BeautifulSoup) -> str:
        """Extract clean text content from page"""
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text

    def _extract_company_name(self, soup: BeautifulSoup, url: str) -> str:
        """Extract company name from page"""

        # Try meta tags first
        og_title = soup.find('meta', property='og:site_name')
        if og_title and og_title.get('content'):
            return og_title['content']

        # Try title tag
        title = soup.find('title')
        if title:
            return title.text.split('|')[0].split('-')[0].strip()

        # Fallback to domain
        return url.split('/')[2].replace('www.', '').split('.')[0].title()

    def save_to_json(self, company_info: CompanyInfo, filename: str = None):
        """Save scraped data to JSON file"""

        if not filename:
            # Create filename from company name and timestamp
            safe_name = company_info.company_name.lower().replace(' ', '_')
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{safe_name}_{timestamp}.json"

        data = asdict(company_info)

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"Saved to: {filename}")
        return filename

    def print_summary(self, company_info: CompanyInfo):
        """Print a summary of scraped information"""

        print(f"\nSCRAPING SUMMARY")
        print("=" * 60)
        print(f"Company: {company_info.company_name}")
        print(f"URL: {company_info.url}")
        print(f"Text extracted: {len(company_info.about_text)} characters")
        print(f"\nSample text (first 500 chars):")
        print(f"{company_info.about_text[:500]}...")
        print("=" * 60)

def main():
    """Test the scraper with intelligent crawling"""

    print("WEBSITE SCRAPER WITH AUTO-CRAWL TEST")
    print("=" * 60)

    # Initialize scraper
    scraper = WebsiteScraper()

    # Test with homepage URL (crawler will find relevant pages automatically)
    test_url = "https://www.topchoiceaustin.com/"

    # Use the intelligent crawler
    company_info = scraper.scrape_website_with_crawl(test_url)

    if company_info:
        # Print summary
        scraper.print_summary(company_info)

        # Save to JSON
        scraper.save_to_json(company_info)

        print("\nScraping completed successfully!")
    else:
        print("\nScraping failed!")

if __name__ == "__main__":
    main()
