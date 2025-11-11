import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { OpenAIService } from '../services/openai.service';

const router = express.Router();

interface BrokerData {
  brokerName?: string;
  firmName?: string;
  specialization?: string;
  experience?: string;
  location?: string;
  callPreference: string;
}

interface MessageGenerationRequest {
  brokerData: {
    rawLinkedInText: string;
    websiteUrl?: string;
    callPreference: string;
  };
  thesis: any;
  searcherProfile: any;
}

// POST /api/broker-outreach/generate-message - Generate broker outreach message
router.post('/generate-message', async (req, res) => {
  try {
    const { brokerData, thesis, searcherProfile }: MessageGenerationRequest = req.body;

    if (!brokerData || !brokerData.rawLinkedInText) {
      return res.status(400).json({ error: 'Broker LinkedIn profile data is required' });
    }

    if (!thesis) {
      return res.status(400).json({ error: 'Investment thesis is required' });
    }

    if (!searcherProfile) {
      return res.status(400).json({ error: 'Searcher profile is required' });
    }

    console.log(`Generating broker outreach message for thesis: ${thesis.name}`);

    // Extract broker data from raw LinkedIn text using AI
    const extractedBrokerData = await extractBrokerData(brokerData.rawLinkedInText);

    // Add call preference
    extractedBrokerData.callPreference = brokerData.callPreference;

    // Check if website URL is provided
    if (brokerData.websiteUrl && brokerData.websiteUrl.trim() !== '') {
      // Validate URL format
      try {
        new URL(brokerData.websiteUrl);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      console.log(`Website URL provided: ${brokerData.websiteUrl} - Running scraper...`);

      // Scrape the website and generate message with brokerage firm info
      scrapeAndGenerateBrokerMessage(brokerData.websiteUrl, extractedBrokerData, thesis, searcherProfile, res);
    } else {
      // No website URL - generate message without firm info
      console.log('No website URL provided - Generating message without brokerage firm data');
      generateBrokerMessageWithoutFirmInfo(extractedBrokerData, thesis, searcherProfile, res);
    }

  } catch (error) {
    console.error('Error in broker generate-message endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function scrapeAndGenerateBrokerMessage(
  websiteUrl: string,
  brokerData: BrokerData,
  thesis: any,
  searcherProfile: any,
  res: express.Response
) {
  const scraperPath = path.join(__dirname, '../../../website_scraper.py');
  const scraperDir = path.dirname(scraperPath);

  console.log('Scraper path:', scraperPath);
  console.log('Scraper directory:', scraperDir);

  const scrapeCode = `
import sys
import json
import os
sys.path.insert(0, '${scraperDir}')
os.chdir('${scraperDir}')
from website_scraper import WebsiteScraper

scraper = WebsiteScraper()
company_info = scraper.scrape_website_with_crawl('${websiteUrl}')

if company_info:
    from dataclasses import asdict
    print(json.dumps(asdict(company_info)))
else:
    print(json.dumps({'error': 'Failed to scrape website'}))
`;

  const scraper = spawn('python3', ['-c', scrapeCode]);

  let scraperOutput = '';
  let scraperError = '';

  scraper.stdout.on('data', (data) => {
    scraperOutput += data.toString();
  });

  scraper.stderr.on('data', (data) => {
    scraperError += data.toString();
  });

  scraper.on('close', async (code) => {
    console.log('Python scraper exit code:', code);

    if (code !== 0) {
      console.log('Scraper failed, falling back to message without firm info');
      return generateBrokerMessageWithoutFirmInfo(brokerData, thesis, searcherProfile, res);
    }

    try {
      const lines = scraperOutput.trim().split('\n');
      const jsonLine = lines[lines.length - 1];
      const firmInfo = JSON.parse(jsonLine);

      if (firmInfo.error) {
        console.log('Scraper returned error, falling back');
        return generateBrokerMessageWithoutFirmInfo(brokerData, thesis, searcherProfile, res);
      }

      // Generate the personalized message with firm info
      generateBrokerMessage(firmInfo, brokerData, thesis, searcherProfile, res);

    } catch (e) {
      console.error('Error parsing scraper output:', e);
      generateBrokerMessageWithoutFirmInfo(brokerData, thesis, searcherProfile, res);
    }
  });
}

async function generateBrokerMessageWithoutFirmInfo(
  brokerData: BrokerData,
  thesis: any,
  searcherProfile: any,
  res: express.Response
) {
  try {
    // Format thesis criteria into readable text
    const thesisCriteria = formatThesisCriteria(thesis);

    // Format searcher profile into readable text
    const searcherBackground = formatSearcherProfile(searcherProfile);

    const prompt = `You are an expert at crafting professional acquisition outreach messages to business brokers. Your goal is to generate a compelling, formal message that introduces a searcher/buyer and their acquisition criteria.

**SEARCHER PROFILE:**
${searcherBackground}

**INVESTMENT THESIS:**
Thesis Name: ${thesis.name}
${thesisCriteria}

**BROKER INFORMATION:**
Name: ${brokerData.brokerName || 'Not specified'}
Firm: ${brokerData.firmName || 'Not specified'}
Specialization: ${brokerData.specialization || 'Not specified'}
Experience: ${brokerData.experience || 'Not specified'}
Location: ${brokerData.location || 'Not specified'}
Call Preference: ${brokerData.callPreference}

**YOUR TASK:**
Generate a professional email that accomplishes the following:

1. **Introduction** (Balanced - ~40% of message):
   - Introduce ${searcherProfile.name} by name and title: ${searcherProfile.title}
   - Briefly establish credibility using 1-2 key highlights from their background
   - Mention why they're pursuing an acquisition
   - Keep this section concise but credible

2. **Acquisition Criteria** (Balanced - ~40% of message):
   - Clearly articulate what type of business they're looking to acquire based on the thesis
   - Include specific criteria from the thesis
   - Make criteria clear and specific, not vague
   - Frame criteria as "ideal" or "target" to allow flexibility

3. **Call to Action** (~20% of message):
   - Request a brief introductory call to discuss potential opportunities
   - Offer the call availability: ${brokerData.callPreference}
   - Express genuine interest in the broker's portfolio/network
   - Professional close with contact information

**PERSONALIZATION:**
${brokerData.brokerName && brokerData.brokerName !== 'Not specified' ? `- Reference the broker by name: ${brokerData.brokerName}` : '- Use "Dear Broker" or "Hello" as greeting'}
${brokerData.specialization && brokerData.specialization !== 'Not specified' ? `- Mention their specialization in ${brokerData.specialization}` : ''}
${brokerData.firmName && brokerData.firmName !== 'Not specified' ? `- Reference their firm: ${brokerData.firmName}` : ''}

**TONE & STYLE:**
- Professional and formal business communication
- Confident but not arrogant
- Specific and credible (use real details from profile/thesis)
- Concise - aim for 200-250 words total
- Avoid generic flattery or excessive pleasantries
- Use proper business email formatting

**STRUCTURE:**
Subject Line: [Should reference ${searcherProfile.name} and acquisition interest - make it specific and professional]

Body:
- Greeting: "Dear ${brokerData.brokerName || 'Sir/Madam'},"
- Opening paragraph: Who is the searcher (name, title, brief background)
- Second paragraph: What they're looking for (thesis/acquisition criteria)
- Third paragraph: Why reaching out + call to action
- Professional close with full contact details

**IMPORTANT:**
- Do NOT make up information not provided in the context
- Do NOT use overly salesy or manipulative language
- Do NOT include placeholders like [INSERT NAME] - use actual data or omit
- Ensure all numbers/ranges from thesis are accurately represented
- Subject line should be specific, not generic

**FORMAT:**
Return a JSON object with:
{
  "message": {
    "subject": "clear, specific subject line",
    "body": "the full email body with proper formatting and line breaks",
    "approach": "brief description of the personalization strategy used"
  }
}`;

    const openaiService = new OpenAIService();

    try {
      console.log('🤖 Calling OpenAI to generate broker outreach message...');

      const aiResponse = await openaiService.generateResponse(
        prompt,
        [],
        ''
      );

      console.log('✅ OpenAI response received');

      // Parse the AI response
      let aiMessage;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiMessage = parsed.message || parsed;
        } else {
          aiMessage = {
            subject: `Acquisition Opportunity - ${searcherProfile.name}`,
            body: aiResponse,
            approach: 'AI-generated broker outreach message'
          };
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse AI response as JSON, using as-is');
        aiMessage = {
          subject: `Acquisition Opportunity - ${searcherProfile.name}`,
          body: aiResponse,
          approach: 'AI-generated broker outreach message'
        };
      }

      console.log('📧 Generated broker outreach message:', aiMessage.subject);

      res.json({
        success: true,
        data: {
          message: aiMessage,
          firmInfo: null,
          brokerData: brokerData,
          mode: 'profile-only'
        }
      });

    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError);

      // Fallback message
      const fallbackMessage = {
        subject: `Acquisition Opportunity - ${searcherProfile.name}`,
        body: `Dear ${brokerData.brokerName || 'Sir/Madam'},\n\nMy name is ${searcherProfile.name}, ${searcherProfile.title}. I am actively seeking to acquire a business that fits my investment criteria.\n\nI am looking for ${thesisCriteria}\n\nI would appreciate the opportunity to discuss potential opportunities in your portfolio. Would you be available for a brief call ${brokerData.callPreference.toLowerCase()}?\n\nBest regards,\n${searcherProfile.name}`,
        approach: `Fallback message due to OpenAI error`
      };

      res.json({
        success: true,
        data: {
          message: fallbackMessage,
          firmInfo: null,
          brokerData: brokerData,
          mode: 'profile-only'
        }
      });
    }

  } catch (error) {
    console.error('Error generating broker message without firm info:', error);
    res.status(500).json({
      error: 'Failed to generate broker outreach message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function extractBrokerData(rawLinkedInText: string): Promise<BrokerData> {
  try {
    const openaiService = new OpenAIService();

    const extractionPrompt = `Extract the following information from this LinkedIn profile text of a business broker:

LINKEDIN PROFILE TEXT:
${rawLinkedInText}

Please extract and return ONLY a JSON object with these exact fields:
{
  "brokerName": "The broker's full name",
  "firmName": "The brokerage firm they work for",
  "specialization": "Their area of specialization (industries, deal sizes, regions)",
  "experience": "Their professional experience and background",
  "location": "Their city, state/country"
}

If any information is not available, use "Not specified" for that field.
Return ONLY the JSON object, no other text.`;

    const aiResponse = await openaiService.generateResponse(
      extractionPrompt,
      [],
      ''
    );

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extractedData = JSON.parse(jsonMatch[0]);
      return {
        ...extractedData,
        callPreference: ''
      };
    }

    // Fallback
    return {
      brokerName: 'Not specified',
      firmName: 'Not specified',
      specialization: 'Not specified',
      experience: 'Not specified',
      location: 'Not specified',
      callPreference: ''
    };

  } catch (error) {
    console.error('Error extracting broker data:', error);
    return {
      brokerName: 'Not specified',
      firmName: 'Not specified',
      specialization: 'Not specified',
      experience: 'Not specified',
      location: 'Not specified',
      callPreference: ''
    };
  }
}

async function generateBrokerMessage(
  firmInfo: any,
  brokerData: BrokerData,
  thesis: any,
  searcherProfile: any,
  res: express.Response
) {
  try {
    const thesisCriteria = formatThesisCriteria(thesis);
    const searcherBackground = formatSearcherProfile(searcherProfile);

    const prompt = `You are an expert at crafting professional acquisition outreach messages to business brokers. Your goal is to generate a compelling, formal message that introduces a searcher/buyer and their acquisition criteria.

**SEARCHER PROFILE:**
${searcherBackground}

**INVESTMENT THESIS:**
Thesis Name: ${thesis.name}
${thesisCriteria}

**BROKERAGE FIRM INFORMATION:**
Firm Name: ${firmInfo.company_name || 'Not specified'}
Website: ${firmInfo.url || 'Not specified'}
About: ${firmInfo.about_text || 'Not specified'}

**BROKER INFORMATION:**
Name: ${brokerData.brokerName || 'Not specified'}
Firm: ${brokerData.firmName || firmInfo.company_name || 'Not specified'}
Specialization: ${brokerData.specialization || 'Not specified'}
Experience: ${brokerData.experience || 'Not specified'}
Location: ${brokerData.location || 'Not specified'}
Call Preference: ${brokerData.callPreference}

**YOUR TASK:**
Generate a professional email that accomplishes the following:

1. **Introduction** (Balanced - ~40% of message):
   - Introduce ${searcherProfile.name} by name and title: ${searcherProfile.title}
   - Briefly establish credibility using 1-2 key highlights from their background
   - Mention why they're pursuing an acquisition
   - Keep this section concise but credible

2. **Acquisition Criteria** (Balanced - ~40% of message):
   - Clearly articulate what type of business they're looking to acquire based on the thesis
   - Include specific criteria from the thesis
   - Make criteria clear and specific, not vague
   - Frame criteria as "ideal" or "target" to allow flexibility

3. **Call to Action** (~20% of message):
   - Request a brief introductory call to discuss potential opportunities
   - Offer the call availability: ${brokerData.callPreference}
   - Express genuine interest in the broker's portfolio/network at ${firmInfo.company_name || 'their firm'}
   - Professional close with contact information

**PERSONALIZATION:**
${brokerData.brokerName && brokerData.brokerName !== 'Not specified' ? `- Reference the broker by name: ${brokerData.brokerName}` : ''}
${firmInfo.company_name ? `- Mention their brokerage firm: ${firmInfo.company_name}` : ''}
${brokerData.specialization && brokerData.specialization !== 'Not specified' ? `- Reference their specialization in ${brokerData.specialization}` : ''}
- Reference relevant details from the firm's website

**TONE & STYLE:**
- Professional and formal business communication
- Confident but not arrogant
- Specific and credible (use real details from profile/thesis)
- Concise - aim for 200-250 words total
- Avoid generic flattery or excessive pleasantries
- Use proper business email formatting

**STRUCTURE:**
Subject Line: [Should reference ${searcherProfile.name} and acquisition interest - make it specific and professional]

Body:
- Greeting: "Dear ${brokerData.brokerName || 'Sir/Madam'},"
- Opening paragraph: Who is the searcher (name, title, brief background)
- Second paragraph: What they're looking for (thesis/acquisition criteria)
- Third paragraph: Why reaching out + call to action
- Professional close with full contact details

**IMPORTANT:**
- Do NOT make up information not provided in the context
- Do NOT use overly salesy or manipulative language
- Do NOT include placeholders - use actual data or omit
- Ensure all numbers/ranges from thesis are accurately represented
- Subject line should be specific, not generic

**FORMAT:**
Return a JSON object with:
{
  "message": {
    "subject": "clear, specific subject line",
    "body": "the full email body with proper formatting and line breaks",
    "approach": "brief description of the personalization strategy used"
  }
}`;

    const openaiService = new OpenAIService();

    try {
      console.log('🤖 Calling OpenAI to generate broker outreach message with firm info...');

      const aiResponse = await openaiService.generateResponse(
        prompt,
        [],
        ''
      );

      console.log('✅ OpenAI response received');

      let aiMessage;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiMessage = parsed.message || parsed;
        } else {
          aiMessage = {
            subject: `Acquisition Opportunity - ${searcherProfile.name}`,
            body: aiResponse,
            approach: 'AI-generated broker outreach message with firm research'
          };
        }
      } catch (parseError) {
        aiMessage = {
          subject: `Acquisition Opportunity - ${searcherProfile.name}`,
          body: aiResponse,
          approach: 'AI-generated broker outreach message with firm research'
        };
      }

      res.json({
        success: true,
        data: {
          message: aiMessage,
          firmInfo: {
            name: firmInfo.company_name,
            url: firmInfo.url
          },
          brokerData: brokerData,
          mode: 'full-research'
        }
      });

    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError);

      const fallbackMessage = {
        subject: `Acquisition Opportunity - ${searcherProfile.name}`,
        body: `Dear ${brokerData.brokerName || 'Sir/Madam'},\n\nMy name is ${searcherProfile.name}, ${searcherProfile.title}. I am actively seeking to acquire a business that fits my investment criteria.\n\nI came across ${firmInfo.company_name || 'your firm'} and was impressed by your focus on ${brokerData.specialization || 'business brokerage'}.\n\nI am looking for ${thesisCriteria}\n\nI would appreciate the opportunity to discuss potential opportunities in your portfolio. Would you be available for a brief call ${brokerData.callPreference.toLowerCase()}?\n\nBest regards,\n${searcherProfile.name}`,
        approach: 'Fallback message'
      };

      res.json({
        success: true,
        data: {
          message: fallbackMessage,
          firmInfo: {
            name: firmInfo.company_name,
            url: firmInfo.url
          },
          brokerData: brokerData,
          mode: 'full-research'
        }
      });
    }

  } catch (error) {
    console.error('Error generating broker message:', error);
    res.status(500).json({
      error: 'Failed to generate broker outreach message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function formatThesisCriteria(thesis: any): string {
  if (!thesis.criteria || thesis.criteria.length === 0) {
    return 'No specific criteria provided';
  }

  const criteriaText = thesis.criteria
    .map((criterion: any) => {
      return `- ${criterion.category}: ${criterion.field} ${criterion.operator} ${criterion.value}`;
    })
    .join('\n');

  return `Acquisition Criteria:\n${criteriaText}`;
}

function formatSearcherProfile(profile: any): string {
  let formatted = `Name: ${profile.name}\nTitle: ${profile.title}\n`;

  if (profile.bio) {
    formatted += `Bio: ${profile.bio}\n`;
  }

  if (profile.why) {
    formatted += `Why Acquiring: ${profile.why}\n`;
  }

  if (profile.education && profile.education.length > 0) {
    formatted += `\nEducation:\n`;
    profile.education.forEach((edu: any) => {
      formatted += `- ${edu.degree} in ${edu.field} from ${edu.institution}\n`;
    });
  }

  if (profile.experience && profile.experience.length > 0) {
    formatted += `\nExperience:\n`;
    profile.experience.slice(0, 3).forEach((exp: any) => {
      formatted += `- ${exp.position} at ${exp.company}\n`;
    });
  }

  return formatted;
}

export default router;
