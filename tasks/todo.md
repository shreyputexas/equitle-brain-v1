# Pivot from LinkedIn to Website Scraping - Task Plan

## Problem Analysis
LinkedIn scraping violates their Terms of Service. We need to pivot to scraping company websites instead to extract founder information, testimonials, and other useful data for personalized outreach.

## Test Company
- URL: https://www.topchoiceaustin.com/top-choice-team/
- Looking for: Founder info, founder's story, testimonials, company background

## Current State
- Multiple Python files for LinkedIn scraping (10 files total)
- Files include: advanced_scraper.py, outreach_testing.py, test_real_linkedin.py, etc.
- All focused on LinkedIn profile scraping

## Plan

### Phase 1: Cleanup ✅
- [ ] Delete all LinkedIn-specific scraper files (keeping only node_modules Python files)
- [ ] Remove: advanced_scraper.py, manual_profile_input.py, outreach_demo.py, outreach_testing.py, quick_test.py, real_scraper.py, test_aliwins_realistic.py, test_custom_outreach.py, test_real_linkedin.py, test_real_profile.py

### Phase 2: Create Website Scraper ✅
- [ ] Create single file: `website_scraper.py`
- [ ] Implement Beautiful Soup / Selenium-based scraper for general websites
- [ ] Extract key information:
  - Company name
  - Founder name(s)
  - Founder story/background
  - Team member bios
  - Testimonials
  - Company mission/values
  - Contact information

### Phase 3: Test with Target Company ✅
- [ ] Test scraper on https://www.topchoiceaustin.com/top-choice-team/
- [ ] Verify data extraction quality
- [ ] Format output in JSON for easy consumption

### Phase 4: Integration ✅
- [ ] Ensure scraper output can be used for personalized message generation
- [ ] Test end-to-end flow: scrape → analyze → generate message

## Expected Outcome
- Single `website_scraper.py` file that can scrape any company website
- Successfully extract founder and company info from test URL
- Clean, structured output ready for message personalization

## Review Section

### Changes Completed

**Phase 1: Cleanup ✅**
- Deleted all 10 LinkedIn-specific Python scraper files
- Removed: advanced_scraper.py, manual_profile_input.py, outreach_demo.py, outreach_testing.py, quick_test.py, real_scraper.py, test_aliwins_realistic.py, test_custom_outreach.py, test_real_linkedin.py, test_real_profile.py

**Phase 2: Website Scraper Created ✅**
- Created single file: `website_scraper.py` (221 lines)
- Uses Beautiful Soup for HTML parsing
- Implements intelligent text extraction based on heading patterns
- Extracts:
  - Company name (from meta tags or title)
  - Founders/leadership (detected by keywords: founder, CEO, manager, owner, etc.)
  - Team members (name, title, bio up to 500 chars)
  - Testimonials
  - About/mission statements
  - Contact info (email, phone)
- Outputs to JSON with timestamp

**Phase 3: Testing ✅**
- Successfully tested on https://www.topchoiceaustin.com/top-choice-team/
- Extracted data for:
  - Company: Top Choice Lawn Care
  - Team members: Nolan (General Manager), Golden (Operations Manager), Justin (Operations), Joe (Ops), Scott (Irrigation), Vanessa (Customer Service), Allison (Estimator), and more
  - Detailed bios for each person
  - Contact: phone number
  - Company story: Founded 2005, veteran-owned

**Phase 4: Output ✅**
- JSON file generated with complete structured data
- Data ready for personalized message generation
- Simple, clean format

### Key Implementation Details
- Kept it simple: single file, no complex dependencies
- Smart extraction: looks for heading patterns (h2/h3/h4/strong) followed by bio content
- Flexible: works across different website structures
- Keyword-based founder detection
- Limits output to prevent data overload (15 team members max, 500 char bios)

### Usage
```bash
python3 website_scraper.py
```

The scraper can be easily modified to accept different URLs as command-line arguments.

---

## Update: Intelligent Page Crawling Added

### Enhancement: Auto-Discovery of Relevant Pages

**New Feature ✅**
- Added `scrape_website_with_crawl()` method that automatically discovers and scrapes relevant pages
- Added `find_relevant_pages()` method to locate About, Team, Leadership pages

**How it works:**
1. Starts at homepage URL
2. Finds all links matching keywords: about, team, leadership, our-story, founders, management, etc.
3. Crawls up to 5 relevant pages automatically
4. Combines data from all pages (deduplicates team members, founders, etc.)
5. Returns comprehensive company information

**Test Results:**
- Started with: https://www.topchoiceaustin.com/ (homepage)
- Auto-discovered 3 pages:
  - Homepage
  - /top-choice-team/ (team page)
  - /author/topchoice/
- Successfully extracted: Nolan (GM), Golden (Operations Manager), Justin, and 17 other team members
- Total data more comprehensive than single-page scraping

**Key Features:**
- Stay within same domain (no external links)
- Limit to 5 pages to avoid excessive requests
- Deduplicates team members across pages
- Combines contact info, about sections, testimonials from all pages

**Benefits:**
- User only needs to provide homepage URL
- Scraper intelligently finds the right pages
- More complete data extraction
- Still simple and fast (limits page count)

---

## Update: Frontend Integration Added

### New Feature: Website Scraper UI in Deals Page ✅

**Backend API Endpoint:**
- Created `/api/scraper/scrape` endpoint in `server/src/routes/websiteScraper.ts`
- Executes Python scraper via spawn
- Returns JSON with company data
- Registered in server index.ts

**Frontend Component:**
- Created `WebsiteScraper.tsx` component
- Clean input field for URL entry
- Real-time scraping with loading states
- Beautiful accordion-based results display:
  - Company info with contact details
  - Founders & Leadership section
  - Team Members section (scrollable)
  - Testimonials section
- Integrated into Deals page (pipeline view) after Automated Outreach section

**Features:**
- Simple URL input with "Scrape" button
- Loading spinner during scraping
- Error handling with user-friendly messages
- Organized display of:
  - Company name, about, contact info
  - Founders with titles and bios
  - Team members with details
  - Customer testimonials
- Black header matching app design
- White content area with accordion sections

**Usage:**
1. Navigate to Deals page (pipeline view)
2. Scroll to "Website Research Tool" section
3. Enter company URL (e.g., https://www.seedlingslandscapingaustin.com/about)
4. Click "Scrape"
5. View extracted data in organized sections

**Ready to test with:** https://www.seedlingslandscapingaustin.com/about
