import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { OpenAIService } from '../services/openai.service';

const router = express.Router();

interface LinkedInData {
  interest: string;
  aboutMe: string;
  experience: string;
  latestPost: string;
  education: string;
  location: string;
  callPreference: string;
  outreachType: string;
}

interface MessageGenerationRequest {
  linkedinProfileData: {
    rawLinkedInText: string;
    websiteUrl?: string; // Made optional
    callPreference: string;
    outreachType: string;
  };
}

// POST /api/linkedin-outreach/generate-message - Generate personalized message
router.post('/generate-message', async (req, res) => {
  try {
    const { linkedinProfileData }: MessageGenerationRequest = req.body;

    if (!linkedinProfileData || !linkedinProfileData.rawLinkedInText) {
      return res.status(400).json({ error: 'LinkedIn profile data is required' });
    }

    console.log(`Generating message for outreach type: ${linkedinProfileData.outreachType}`);

    // Extract LinkedIn data from raw text using AI
    const extractedLinkedInData = await extractLinkedInData(linkedinProfileData.rawLinkedInText);
    
    // Add form data to extracted data
    extractedLinkedInData.callPreference = linkedinProfileData.callPreference;
    extractedLinkedInData.outreachType = linkedinProfileData.outreachType;

    // Check if website URL is provided
    if (linkedinProfileData.websiteUrl && linkedinProfileData.websiteUrl.trim() !== '') {
      // Validate URL format
      try {
        new URL(linkedinProfileData.websiteUrl);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      console.log(`Website URL provided: ${linkedinProfileData.websiteUrl} - Running scraper...`);

      // Scrape the website and generate message with company info
      scrapeAndGenerateMessage(linkedinProfileData.websiteUrl, extractedLinkedInData, res);
    } else {
      // No website URL - generate message without company info
      console.log('No website URL provided - Generating message without company data');
      generateMessageWithoutCompanyInfo(extractedLinkedInData, res);
    }

  } catch (error) {
    console.error('Error in generate-message endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function scrapeAndGenerateMessage(websiteUrl: string, linkedinData: LinkedInData, res: express.Response) {
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

  // Execute website scraper
  const scraper = spawn('python', ['-c', scrapeCode]);
  
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
    console.log('Python scraper output:', scraperOutput);
    console.log('Python scraper error:', scraperError);
    
    if (code !== 0) {
      return res.status(500).json({
        error: 'Failed to scrape website',
        details: scraperError
      });
    }

    try {
      // Parse scraper output
      const lines = scraperOutput.trim().split('\n');
      const jsonLine = lines[lines.length - 1];
      const companyInfo = JSON.parse(jsonLine);

      if (companyInfo.error) {
        return res.status(500).json({ error: companyInfo.error });
      }

      // Now generate the personalized message using OpenAI with company info
      generatePersonalizedMessage(companyInfo, linkedinData, res);

    } catch (e) {
      console.error('Error parsing scraper output:', e);
      res.status(500).json({
        error: 'Failed to parse scraper output',
        details: scraperOutput
      });
    }
  });
}

async function generateMessageWithoutCompanyInfo(linkedinData: LinkedInData, res: express.Response) {
  try {
    let prompt = '';
    
    if (linkedinData.outreachType === 'Interest in Acquisition') {
      prompt = `You are a search fund professional reaching out to a potential contact. Generate a personalized LinkedIn message based on the following information:

TARGET PERSON'S LinkedIn Profile Data:
Interest: ${linkedinData.interest}
About Me: ${linkedinData.aboutMe}
Experience: ${linkedinData.experience}
Latest Post: ${linkedinData.latestPost}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Call Preference: ${linkedinData.callPreference}

CONTEXT: You are a search fund professional exploring acquisition opportunities. This is an initial outreach without specific company research yet.

TASK:
Create a personalized acquisition-focused outreach message that:
1. References specific details from the target person's LinkedIn profile
2. Shows genuine interest in their business/industry expertise
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional interested in learning about potential opportunities
5. Is professional but warm and engaging
6. Includes a clear call-to-action for the specific time preference
7. Is concise and respectful of their time

FORMAT:
Return a JSON object with:
- subject: Email subject line
- body: The message body
- approach: Brief explanation of why this approach was chosen

Make the message feel personal and authentic based on their LinkedIn profile.`;
    } else if (linkedinData.outreachType === 'Interest in Entrepreneurial Journey') {
      prompt = `You are a search fund professional reaching out to learn from a successful entrepreneur. Generate a personalized LinkedIn message based on the following information:

TARGET PERSON'S LinkedIn Profile Data:
Interest: ${linkedinData.interest}
About Me: ${linkedinData.aboutMe}
Experience: ${linkedinData.experience}
Latest Post: ${linkedinData.latestPost}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Call Preference: ${linkedinData.callPreference}

CONTEXT: You are a search fund professional looking to learn from successful entrepreneurs and their experiences.

TASK:
Create a personalized entrepreneurial journey-focused outreach message that:
1. References specific details from the target person's LinkedIn profile
2. Shows genuine interest in learning from their journey and experiences
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional seeking mentorship/insights
5. Is professional but warm and engaging
6. Includes a clear call-to-action for the specific time preference
7. Is concise and respectful of their time

FORMAT:
Return a JSON object with:
- subject: Email subject line
- body: The message body
- approach: Brief explanation of why this approach was chosen

Make the message feel personal and authentic. Show that you've researched their profile and are genuinely interested in learning from them.`;
    } else {
      // Default prompt
      prompt = `You are a search fund professional reaching out to a potential business connection. Generate a personalized LinkedIn message based on the following information:

TARGET PERSON'S LinkedIn Profile Data:
Interest: ${linkedinData.interest}
About Me: ${linkedinData.aboutMe}
Experience: ${linkedinData.experience}
Latest Post: ${linkedinData.latestPost}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Call Preference: ${linkedinData.callPreference}

CONTEXT: You are a search fund professional looking to connect with potential business opportunities and interesting people in your space.

TASK:
Create a personalized outreach message that:
1. References specific details from the target person's LinkedIn profile
2. Shows genuine interest in their work and background
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional
5. Is professional but warm and engaging
6. Includes a clear call-to-action for the specific time preference
7. Is concise and respectful of their time

FORMAT:
Return a JSON object with:
- subject: Email subject line
- body: The message body
- approach: Brief explanation of why this approach was chosen

Make the message feel personal and authentic based on their LinkedIn profile.`;
    }

    const openaiService = new OpenAIService();
    
    try {
      console.log('🤖 Calling OpenAI to generate personalized message (without company data)...');
      
      const aiResponse = await openaiService.generateResponse(
        prompt,
        [],
        ''
      );
      
      console.log('✅ OpenAI response received:', aiResponse.substring(0, 200) + '...');
      
      // Parse the AI response
      let aiMessage;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiMessage = JSON.parse(jsonMatch[0]);
        } else {
          aiMessage = {
            subject: `Let's connect`,
            body: aiResponse,
            approach: `AI-generated message based on ${linkedinData.outreachType}`
          };
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse AI response as JSON, using as-is');
        aiMessage = {
          subject: `Let's connect`,
          body: aiResponse,
          approach: `AI-generated message based on ${linkedinData.outreachType}`
        };
      }
      
      console.log('📧 Generated message:', aiMessage.subject);
      
      res.json({
        success: true,
        data: {
          message: aiMessage,
          companyInfo: null, // No company info when URL not provided
          linkedinData: linkedinData,
          mode: 'profile-only' // Indicate this was generated without company data
        }
      });
      
    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError);
      
      // Fallback to a basic template if OpenAI fails
      const fallbackMessage = {
        subject: `Quick question`,
        body: `Hi there,\n\nI came across your profile and was impressed by your background in ${linkedinData.experience}. I'm a search fund professional and would love to connect.\n\nI'm particularly interested in ${linkedinData.callPreference.toLowerCase()} to discuss potential opportunities.\n\nWould you be open to a brief call ${linkedinData.callPreference.toLowerCase()}?\n\nBest regards,\nShariq Hafizi\nFounder & CEO, Equitle`,
        approach: `Fallback message due to OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`
      };
      
      res.json({
        success: true,
        data: {
          message: fallbackMessage,
          companyInfo: null,
          linkedinData: linkedinData,
          mode: 'profile-only'
        }
      });
    }

  } catch (error) {
    console.error('Error generating message without company info:', error);
    res.status(500).json({
      error: 'Failed to generate personalized message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function extractLinkedInData(rawLinkedInText: string): Promise<LinkedInData> {
  try {
    const openaiService = new OpenAIService();
    
    const extractionPrompt = `Extract the following information from this LinkedIn profile text:

LINKEDIN PROFILE TEXT:
${rawLinkedInText}

Please extract and return ONLY a JSON object with these exact fields:
{
  "interest": "What the person is passionate about professionally",
  "aboutMe": "Their about/summary section content", 
  "experience": "Their work experience and key achievements",
  "latestPost": "Their most recent LinkedIn post or update",
  "education": "Their educational background and degrees",
  "location": "Their city, state/country"
}

If any information is not available, use "Not specified" for that field.
Return ONLY the JSON object, no other text.`;

    const aiResponse = await openaiService.generateResponse(
      extractionPrompt,
      [],
      ''
    );

    // Parse the AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extractedData = JSON.parse(jsonMatch[0]);
      return {
        ...extractedData,
        callPreference: '',
        outreachType: ''
      };
    }

    // Fallback if JSON parsing fails
    return {
      interest: 'Not specified',
      aboutMe: 'Not specified', 
      experience: 'Not specified',
      latestPost: 'Not specified',
      education: 'Not specified',
      location: 'Not specified',
      callPreference: '',
      outreachType: ''
    };

  } catch (error) {
    console.error('Error extracting LinkedIn data:', error);
    return {
      interest: 'Not specified',
      aboutMe: 'Not specified',
      experience: 'Not specified', 
      latestPost: 'Not specified',
      education: 'Not specified',
      location: 'Not specified',
      callPreference: '',
      outreachType: ''
    };
  }
}

async function generatePersonalizedMessage(companyInfo: any, linkedinData: LinkedInData, res: express.Response) {
  try {
    let prompt = '';
    
    if (linkedinData.outreachType === 'Interest in Acquisition') {
      prompt = `You are a search fund professional reaching out to a potential acquisition target. Generate a personalized LinkedIn message based on the following information:

TARGET COMPANY INFORMATION:
Company: ${companyInfo.company_name}
Website: ${companyInfo.url}
About Text: ${companyInfo.about_text}

TARGET PERSON'S LinkedIn Profile Data (this is the person you're reaching out to - likely the founder/owner/decision maker):
Interest: ${linkedinData.interest}
About Me: ${linkedinData.aboutMe}
Experience: ${linkedinData.experience}
Latest Post: ${linkedinData.latestPost}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Call Preference: ${linkedinData.callPreference}

CONTEXT: You are a search fund professional looking to acquire or partner with this company. The LinkedIn data above is about the person you're reaching out to (the target), not about you.

TASK:
Create a personalized acquisition-focused outreach message that:
1. References specific details from the target person's LinkedIn profile
2. Mentions relevant information from their company website
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional interested in acquisition/partnership
5. Shows you've done your homework on both the person and their company
6. Is professional but warm and engaging
7. Includes a clear call-to-action for the specific time preference

FORMAT:
Return a JSON object with:
- subject: Email subject line
- body: The message body
- approach: Brief explanation of why this approach was chosen

Make the message feel personal and authentic. Show that you understand their business and have researched them specifically as a search fund professional.`;
    } else if (linkedinData.outreachType === 'Interest in Entrepreneurial Journey') {
      prompt = `You are a search fund professional reaching out to learn from a successful entrepreneur's journey. Generate a personalized LinkedIn message based on the following information:

TARGET COMPANY INFORMATION:
Company: ${companyInfo.company_name}
Website: ${companyInfo.url}
About Text: ${companyInfo.about_text}

TARGET PERSON'S LinkedIn Profile Data (this is the person you're reaching out to - likely the founder/owner):
Interest: ${linkedinData.interest}
About Me: ${linkedinData.aboutMe}
Experience: ${linkedinData.experience}
Latest Post: ${linkedinData.latestPost}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Call Preference: ${linkedinData.callPreference}

CONTEXT: You are a search fund professional looking to learn from successful entrepreneurs. The LinkedIn data above is about the person you're reaching out to (the target), not about you.

TASK:
Create a personalized entrepreneurial journey-focused outreach message that:
1. References specific details from the target person's LinkedIn profile
2. Mentions relevant information from their company website
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional seeking mentorship/advice
5. Shows genuine interest in learning from their entrepreneurial journey
6. Is professional but warm and engaging
7. Includes a clear call-to-action for the specific time preference

FORMAT:
Return a JSON object with:
- subject: Email subject line
- body: The message body
- approach: Brief explanation of why this approach was chosen

Make the message feel personal and authentic. Show that you understand their business and have researched them specifically as a search fund professional seeking to learn.`;
    } else {
      // Default prompt
      prompt = `You are a search fund professional reaching out to a potential business connection. Generate a personalized LinkedIn message based on the following information:

TARGET COMPANY INFORMATION:
Company: ${companyInfo.company_name}
Website: ${companyInfo.url}
About Text: ${companyInfo.about_text}

TARGET PERSON'S LinkedIn Profile Data (this is the person you're reaching out to):
Interest: ${linkedinData.interest}
About Me: ${linkedinData.aboutMe}
Experience: ${linkedinData.experience}
Latest Post: ${linkedinData.latestPost}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Call Preference: ${linkedinData.callPreference}

CONTEXT: You are a search fund professional looking to connect with potential business opportunities. The LinkedIn data above is about the person you're reaching out to (the target), not about you.

TASK:
Create a personalized outreach message that:
1. References specific details from the target person's LinkedIn profile
2. Mentions relevant information from their company website
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional
5. Shows genuine interest in their business
6. Is professional but warm and engaging
7. Includes a clear call-to-action for the specific time preference

FORMAT:
Return a JSON object with:
- subject: Email subject line
- body: The message body
- approach: Brief explanation of why this approach was chosen

Make the message feel personal and authentic. Show that you understand their business and have researched them specifically as a search fund professional.`;
    }

    const openaiService = new OpenAIService();
    
    try {
      console.log('🤖 Calling OpenAI to generate personalized message...');
      
      const aiResponse = await openaiService.generateResponse(
        prompt,
        [],
        ''
      );
      
      console.log('✅ OpenAI response received:', aiResponse.substring(0, 200) + '...');
      
      // Parse the AI response
      let aiMessage;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiMessage = JSON.parse(jsonMatch[0]);
        } else {
          aiMessage = {
            subject: `Personalized outreach to ${companyInfo.company_name}`,
            body: aiResponse,
            approach: `AI-generated message based on ${linkedinData.outreachType}`
          };
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse AI response as JSON, using as-is');
        aiMessage = {
          subject: `Personalized outreach to ${companyInfo.company_name}`,
          body: aiResponse,
          approach: `AI-generated message based on ${linkedinData.outreachType}`
        };
      }
      
      console.log('📧 Generated message:', aiMessage.subject);
      
      res.json({
        success: true,
        data: {
          message: aiMessage,
          companyInfo: {
            name: companyInfo.company_name,
            url: companyInfo.url,
            textLength: companyInfo.about_text.length
          },
          linkedinData: linkedinData,
          mode: 'full-research' // Indicate this was generated with company data
        }
      });
      
    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError);
      
      const fallbackMessage = {
        subject: `Quick question about ${companyInfo.company_name}`,
        body: `Hi there,\n\nI came across ${companyInfo.company_name} and was impressed by your work. Based on your background in ${linkedinData.experience}, I thought you might be interested in connecting.\n\nI'm particularly interested in ${linkedinData.callPreference.toLowerCase()} to discuss potential opportunities.\n\nWould you be open to a brief call ${linkedinData.callPreference.toLowerCase()}?\n\nBest regards,\nShariq Hafizi\nFounder & CEO, Equitle`,
        approach: `Fallback message due to OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`
      };
      
      res.json({
        success: true,
        data: {
          message: fallbackMessage,
          companyInfo: {
            name: companyInfo.company_name,
            url: companyInfo.url,
            textLength: companyInfo.about_text.length
          },
          linkedinData: linkedinData,
          mode: 'full-research'
        }
      });
    }

  } catch (error) {
    console.error('Error generating message:', error);
    res.status(500).json({
      error: 'Failed to generate personalized message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default router;