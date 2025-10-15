import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = express.Router();

interface ScraperResult {
  success: boolean;
  data?: any;
  error?: string;
}

// POST /api/scraper/scrape - Scrape a website
router.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`Scraping website: ${url}`);

    // Path to Python scraper
    const scraperPath = path.join(__dirname, '../../../website_scraper.py');

    // Create a temporary Python script that uses the scraper
    const pythonCode = `
import sys
import json
sys.path.insert(0, '${path.dirname(scraperPath)}')
from website_scraper import WebsiteScraper

scraper = WebsiteScraper()
company_info = scraper.scrape_website_with_crawl('${url}')

if company_info:
    from dataclasses import asdict
    print(json.dumps(asdict(company_info)))
else:
    print(json.dumps({'error': 'Failed to scrape website'}))
`;

    // Execute Python scraper
    const python = spawn('python3', ['-c', pythonCode]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    python.on('close', (code) => {
      console.log(`Python process closed with code ${code}`);
      console.log(`Output length: ${output.length}`);
      console.log(`Error output length: ${errorOutput.length}`);

      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`Error output: ${errorOutput}`);
        console.error(`Standard output: ${output}`);
        return res.status(500).json({
          error: 'Failed to scrape website',
          details: errorOutput || output,
          code: code
        });
      }

      try {
        console.log('Attempting to parse output...');
        console.log('Raw output:', output.substring(0, 500));

        // Parse the last line of output (which should be the JSON)
        const lines = output.trim().split('\n');
        console.log(`Found ${lines.length} lines of output`);
        const jsonLine = lines[lines.length - 1];
        console.log('Last line:', jsonLine.substring(0, 200));

        const result = JSON.parse(jsonLine);

        if (result.error) {
          return res.status(500).json({ error: result.error });
        }

        console.log('Successfully parsed result');
        res.json({
          success: true,
          data: result
        });
      } catch (e) {
        console.error('Error parsing Python output:', e);
        console.error('Full output was:', output);
        res.status(500).json({
          error: 'Failed to parse scraper output',
          details: output,
          parseError: e instanceof Error ? e.message : 'Unknown parse error'
        });
      }
    });

  } catch (error) {
    console.error('Error in scrape endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
