#!/usr/bin/env python3
"""
Website Scraper for Company Information
Extracts founder info, testimonials, and other useful data for personalized outreach
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
    founders: List[Dict[str, str]]  # name, title, bio
    team_members: List[Dict[str, str]]  # name, title, bio
    testimonials: List[Dict[str, str]]  # text, author
    about: str
    mission: str
    contact_info: Dict[str, str]
    scraped_at: str

class WebsiteScraper:
    """Simple website scraper for company information"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })
        self.visited_urls: Set[str] = set()

    def find_relevant_pages(self, base_url: str) -> List[str]:
        """Find relevant pages like About, Team, Leadership from the homepage"""

        print(f"🔎 Looking for relevant pages on {base_url}...")

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
                        print(f"  ✓ Found: {full_url}")

            print(f"📋 Found {len(relevant_urls)} relevant page(s)")
            return relevant_urls[:5]  # Limit to 5 pages to avoid too many requests

        except Exception as e:
            print(f"⚠️  Error finding pages: {str(e)}")
            return [base_url]  # Fallback to just the base URL

    def scrape_website_with_crawl(self, base_url: str) -> Optional[CompanyInfo]:
        """Scrape website by automatically finding and crawling relevant pages"""

        print(f"\n🌐 Starting intelligent crawl from: {base_url}")
        print("=" * 60)

        # Find relevant pages
        relevant_urls = self.find_relevant_pages(base_url)

        # Scrape all relevant pages and combine data
        all_founders = []
        all_team_members = []
        all_testimonials = []
        company_name = ""
        about = ""
        mission = ""
        contact_info = {}

        for url in relevant_urls:
            print(f"\n🔍 Scraping: {url}")

            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')

                # Extract from this page
                if not company_name:
                    company_name = self._extract_company_name(soup, url)

                founders = self._extract_founders(soup)
                team_members = self._extract_team_members(soup)
                testimonials = self._extract_testimonials(soup)

                # Combine unique entries
                for founder in founders:
                    if founder not in all_founders:
                        all_founders.append(founder)

                for member in team_members:
                    if member not in all_team_members:
                        all_team_members.append(member)

                for testimonial in testimonials:
                    if testimonial not in all_testimonials:
                        all_testimonials.append(testimonial)

                # Get about/mission if not already found
                if not about:
                    about = self._extract_about(soup)
                if not mission:
                    mission = self._extract_mission(soup)

                # Get contact info
                page_contact = self._extract_contact_info(soup)
                contact_info.update(page_contact)

                print(f"  ✓ Found {len(team_members)} team members, {len(founders)} founders")

            except Exception as e:
                print(f"  ⚠️  Error scraping {url}: {str(e)}")
                continue

        # Create combined result
        company_info = CompanyInfo(
            company_name=company_name or "Unknown Company",
            url=base_url,
            founders=all_founders[:10],  # Limit founders
            team_members=all_team_members[:20],  # Limit team members
            testimonials=all_testimonials[:5],  # Limit testimonials
            about=about,
            mission=mission,
            contact_info=contact_info,
            scraped_at=datetime.now().isoformat()
        )

        print(f"\n✅ Crawl complete! Scraped {len(relevant_urls)} pages")
        return company_info

    def scrape_website(self, url: str) -> Optional[CompanyInfo]:
        """Scrape company website for useful information"""

        print(f"\n🔍 Scraping: {url}")
        print("=" * 60)

        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract information
            company_name = self._extract_company_name(soup, url)
            founders = self._extract_founders(soup)
            team_members = self._extract_team_members(soup)
            testimonials = self._extract_testimonials(soup)
            about = self._extract_about(soup)
            mission = self._extract_mission(soup)
            contact_info = self._extract_contact_info(soup)

            company_info = CompanyInfo(
                company_name=company_name,
                url=url,
                founders=founders,
                team_members=team_members,
                testimonials=testimonials,
                about=about,
                mission=mission,
                contact_info=contact_info,
                scraped_at=datetime.now().isoformat()
            )

            print(f"✅ Successfully scraped {company_name}")
            return company_info

        except Exception as e:
            print(f"❌ Error scraping website: {str(e)}")
            return None

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

    def _extract_founders(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract founder information"""

        founders = []
        founder_keywords = ['founder', 'ceo', 'president', 'owner', 'co-founder', 'partner', 'general manager', 'operations manager']

        # Get all text to search for founder-related content
        page_text = soup.get_text().lower()

        # Look for all headings that might be names
        headings = soup.find_all(['h2', 'h3', 'h4'])

        for heading in headings:
            name = heading.get_text(strip=True)

            # Skip if too long or too short
            if len(name) > 50 or len(name) < 2:
                continue

            # Get content after heading
            bio_parts = []
            title = ""

            for sibling in heading.find_next_siblings():
                if sibling.name in ['h2', 'h3', 'h4']:
                    break

                text = sibling.get_text(strip=True)
                if text and not self._is_noise_text(text):
                    if not title and len(text) < 100:
                        title = text
                    else:
                        bio_parts.append(text)

                if len(bio_parts) >= 5:
                    break

            bio = ' '.join(bio_parts)[:500]
            combined_text = f"{title} {bio}".lower()

            # Check if this person is a founder/leader
            if any(keyword in combined_text for keyword in founder_keywords):
                founders.append({
                    'name': name,
                    'title': title,
                    'bio': bio
                })

        return founders

    def _extract_team_members(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract team member information - cleaned approach"""

        team_members = []

        # Get all paragraphs and divs - look for patterns
        all_elements = soup.find_all(['p', 'div', 'h2', 'h3', 'h4', 'h5', 'strong'])

        i = 0
        while i < len(all_elements):
            elem = all_elements[i]
            text = elem.get_text(strip=True)

            # Skip phone numbers and repetitive content
            if self._is_noise_text(text):
                i += 1
                continue

            # Look for potential names (short text, often in bold or headings)
            if elem.name in ['h2', 'h3', 'h4', 'h5', 'strong'] and 2 <= len(text) <= 30:
                potential_name = text

                # Collect bio from following elements
                bio_parts = []
                title = ""
                j = i + 1

                while j < len(all_elements) and j < i + 10:
                    next_text = all_elements[j].get_text(strip=True)

                    # Skip noise text
                    if self._is_noise_text(next_text):
                        j += 1
                        continue

                    # Stop if we hit another heading/name
                    if all_elements[j].name in ['h2', 'h3', 'h4', 'h5', 'strong'] and len(next_text) <= 30:
                        break

                    if next_text and len(next_text) > 10:
                        if not title and len(next_text) < 80:
                            title = next_text
                        elif len(next_text) > 20:  # Only substantial text
                            bio_parts.append(next_text)

                    j += 1

                bio = ' '.join(bio_parts)[:500]

                # Only add if we have meaningful content
                if (bio and len(bio) > 30) or title:
                    team_members.append({
                        'name': potential_name,
                        'title': title,
                        'bio': bio
                    })

                i = j  # Skip ahead
            else:
                i += 1

        return team_members[:15]  # Limit to first 15 members

    def _extract_testimonials(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract testimonials"""

        testimonials = []

        # Look for testimonial sections
        testimonial_sections = soup.find_all(['div', 'section'], class_=lambda x: x and any(
            word in str(x).lower() for word in ['testimonial', 'review', 'feedback', 'quote']
        ))

        for section in testimonial_sections:
            quotes = section.find_all(['blockquote', 'div', 'p'], class_=lambda x: x and any(
                word in str(x).lower() for word in ['testimonial', 'review', 'quote', 'feedback']
            ))

            for quote in quotes:
                text = quote.get_text(strip=True)
                
                # Skip noise testimonials
                if self._is_noise_text(text):
                    continue
                    
                author_elem = quote.find_next(['cite', 'span', 'p'], class_=lambda x: x and any(
                    word in str(x).lower() for word in ['author', 'name', 'client']
                ))

                author = author_elem.text.strip() if author_elem else "Anonymous"

                if text and len(text) > 20:  # Only include substantial testimonials
                    testimonials.append({
                        'text': text[:500],  # Limit length
                        'author': author
                    })

        return testimonials[:5]  # Limit to first 5 testimonials

    def _extract_about(self, soup: BeautifulSoup) -> str:
        """Extract company about/description"""

        # Try meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            return meta_desc['content']

        # Try OG description
        og_desc = soup.find('meta', property='og:description')
        if og_desc and og_desc.get('content'):
            return og_desc['content']

        # Look for about section
        about_section = soup.find(['div', 'section'], class_=lambda x: x and 'about' in str(x).lower())
        if about_section:
            paragraphs = about_section.find_all('p')
            if paragraphs:
                return ' '.join([p.get_text(strip=True) for p in paragraphs[:2]])

        return ""

    def _extract_mission(self, soup: BeautifulSoup) -> str:
        """Extract company mission/values"""

        mission_keywords = ['mission', 'vision', 'values', 'purpose', 'why we']

        for keyword in mission_keywords:
            section = soup.find(['div', 'section', 'p'], class_=lambda x: x and keyword in str(x).lower())
            if section:
                text = section.get_text(strip=True)
                if len(text) > 20:
                    return text[:500]

        return ""

    def _extract_contact_info(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract contact information"""

        contact = {}

        # Look for email
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = soup.find_all('a', href=lambda x: x and 'mailto:' in x)
        if emails:
            contact['email'] = emails[0]['href'].replace('mailto:', '')

        # Look for phone
        phones = soup.find_all('a', href=lambda x: x and 'tel:' in x)
        if phones:
            contact['phone'] = phones[0]['href'].replace('tel:', '')

        return contact

    def _is_noise_text(self, text: str) -> bool:
        """Check if text is noise that should be filtered out"""
        
        if not text or len(text) < 3:
            return True
            
        # Phone numbers
        if any(char.isdigit() for char in text) and len([c for c in text if c.isdigit()]) > 5:
            return True
            
        # Common noise patterns
        noise_patterns = [
            'free fast quote', 'get a free estimate', 'click to enlarge',
            'we don\'t need contracts', 'our service area', 'some of our',
            'we love to smile', 'we have fun', 'happy customers',
            'reviews on yelp', 'why choose', 'services for your',
            'we can handle', 'we believe', 'we offer', 'we serve',
            'we recently', 'we love', 'we enjoy', 'we don\'t',
            'come home to', 'routine mowing', 'seasonal fertilization',
            'turf experts', 'lawn care solutions', 'landscaping products',
            'irrigation repairs', 'bed maintenance', 'backflow prevention',
            'christmas lighting', 'fire lord', 'puts out fire',
            'makes the trains run', 'nuts and bolts', 'scheduling day',
            'ever annoyed', 'justin\'s', 'golden hails', 'salt lake city',
            'idaho farmer', 'brigham young', 'twice from', 'operations manager',
            'general manager', 'guy that tries', 'guy that actually',
            'guy that makes', 'born and raised', 'landscape entrepreneur',
            'texas state', 'attended texas', 'son of a', 'since he can',
            'nolan was', 'nolan attended', 'golden hails', 'suburb of',
            'small-town', 'graduated twice', 'brigham young university',
            'mowingedgingblowingfertilizationweed control', 'lawn care',
            'estimator extraordinaire', 'horticulture phenom', 'madman with a mower',
            'christmas lighting legend', 'fire lord', 'puts out fire',
            'makes the trains run', 'nuts and bolts', 'scheduling day',
            'ever annoyed', 'justin\'s', 'golden hails', 'salt lake city',
            'idaho farmer', 'brigham young', 'twice from', 'operations manager',
            'general manager', 'guy that tries', 'guy that actually',
            'guy that makes', 'born and raised', 'landscape entrepreneur',
            'texas state', 'attended texas', 'son of a', 'since he can',
            'nolan was', 'nolan attended', 'golden hails', 'suburb of',
            'small-town', 'graduated twice', 'brigham young university'
        ]
        
        text_lower = text.lower()
        for pattern in noise_patterns:
            if pattern in text_lower:
                return True
                
        # Skip repetitive text (same word repeated)
        words = text.split()
        if len(words) > 3:
            word_counts = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
            if max(word_counts.values()) > len(words) // 2:
                return True
                
        # Skip very short repetitive phrases
        if len(text) < 50 and text.count(text.split()[0]) > 2:
            return True
            
        # Skip concatenated words (like "MowingEdgingBlowingFertilizationWeed Control")
        if len(text) > 20 and any(word.isupper() and len(word) > 10 for word in text.split()):
            return True
            
        # Skip text with too many concatenated words
        words = text.split()
        if len(words) > 2:
            concatenated_count = sum(1 for word in words if len(word) > 15 and any(c.isupper() for c in word))
            if concatenated_count > len(words) // 2:
                return True
                
        # Skip text with name concatenated to title (like "VanessaCustomer Service Manager")
        if len(text) > 10 and any(word[0].isupper() and word[1:].islower() and len(word) > 8 for word in text.split()):
            return True
            
        # Skip text with "FULL SCOOP HERE" and similar marketing phrases
        marketing_phrases = ['full scoop here', 'click here', 'learn more', 'read more', 'see more']
        if any(phrase in text_lower for phrase in marketing_phrases):
            return True
            
        return False

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

        print(f"💾 Saved to: {filename}")
        return filename

    def print_summary(self, company_info: CompanyInfo):
        """Print a summary of scraped information"""

        print(f"\n📊 SCRAPING SUMMARY")
        print("=" * 60)
        print(f"Company: {company_info.company_name}")
        print(f"URL: {company_info.url}")
        print(f"\n👥 Founders found: {len(company_info.founders)}")
        for founder in company_info.founders:
            print(f"  • {founder['name']} - {founder['title']}")

        print(f"\n👨‍💼 Team members found: {len(company_info.team_members)}")
        for member in company_info.team_members[:3]:  # Show first 3
            print(f"  • {member['name']} - {member['title']}")

        print(f"\n💬 Testimonials found: {len(company_info.testimonials)}")
        if company_info.testimonials:
            print(f"  Sample: \"{company_info.testimonials[0]['text'][:100]}...\"")

        print(f"\n📝 About: {company_info.about[:200]}..." if company_info.about else "")
        print(f"\n🎯 Mission: {company_info.mission[:200]}..." if company_info.mission else "")
        print(f"\n📧 Contact: {company_info.contact_info}")
        print("=" * 60)

def main():
    """Test the scraper with intelligent crawling"""

    print("🌐 WEBSITE SCRAPER WITH AUTO-CRAWL TEST")
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

        print("\n✅ Scraping completed successfully!")
    else:
        print("\n❌ Scraping failed!")

if __name__ == "__main__":
    main()
