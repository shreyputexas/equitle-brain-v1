import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { OpenAIService } from '../services/openai.service';
import { SearcherProfilesFirestoreService } from '../services/searcherProfiles.firestore.service';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';

const router = express.Router();

interface LinkedInData {
  contactName: string; // Person's full name
  interest: string;
  aboutMe: string;
  experience: string;
  specificCompanies: string; // Specific companies they've worked at
  specificRoles: string; // Specific job titles and roles
  achievements: string; // Specific achievements and accomplishments
  skills: string; // Key skills and expertise areas
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
    contactName?: string; // Contact's name for personalized greeting
    contactEmail?: string; // Contact's email
  };
}

// Rate limiting for bulk processing
const requestTimes: { [key: string]: number[] } = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per IP

// Simple rate limiting function
const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const userRequests = requestTimes[ip] || [];

  // Remove requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  requestTimes[ip] = recentRequests;

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  // Add current request
  requestTimes[ip].push(now);
  return false;
};

// Function to get user profile information for signature
const getUserProfileInfo = async (req: express.Request): Promise<{ name: string; title: string; } | null> => {
  try {
    // Extract userId from the request headers or token (depending on your auth setup)
    const userId = (req as any).userId || req.headers['x-user-id'];

    console.log('🔍 LinkedIn Outreach - Getting user profile info:', {
      hasUserId: !!userId,
      userId: userId,
      reqUserId: (req as any).userId,
      headerUserId: req.headers['x-user-id']
    });

    if (!userId) {
      console.warn('⚠️ LinkedIn Outreach - No userId found in request for profile lookup');
      return { name: 'Shariq Hafizi', title: 'Founder & CEO, Equitle' }; // Fallback
    }

    const profiles = await SearcherProfilesFirestoreService.getSearcherProfiles(userId);

    console.log('🔍 LinkedIn Outreach - Searcher profiles retrieved:', {
      profileCount: profiles?.length || 0,
      profiles: profiles?.map(p => ({ id: p.id, name: p.name, title: p.title })) || []
    });

    if (profiles && profiles.length > 0) {
      const profile = profiles[0]; // Use first profile
      // Use the full title if the profile title is just "Founder"
      let fullTitle = profile.title;
      if (fullTitle === 'Founder') {
        fullTitle = 'Founder & CEO, Equitle';
      }

      const userInfo = {
        name: profile.name || 'Shariq Hafizi',
        title: fullTitle || 'Founder & CEO, Equitle'
      };
      console.log('GOOD LinkedIn Outreach - Using user profile:', userInfo);
      return userInfo;
    }

    // Fallback if no profile found
    console.warn('⚠️ LinkedIn Outreach - No profiles found, using fallback');
    return { name: 'Shariq Hafizi', title: 'Founder & CEO, Equitle' };
  } catch (error) {
    console.error('❌ LinkedIn Outreach - Error fetching user profile:', error);
    return { name: 'Shariq Hafizi', title: 'Founder & CEO, Equitle' }; // Fallback
  }
};

// POST /api/linkedin-outreach/generate-message - Generate personalized message
router.post('/generate-message', firebaseAuthMiddleware, async (req, res) => {
  const startTime = Date.now();
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    // Rate limiting check
    if (isRateLimited(clientIp)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${clientIp}`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait before trying again.'
      });
    }

    const { linkedinProfileData }: MessageGenerationRequest = req.body;

    if (!linkedinProfileData || !linkedinProfileData.rawLinkedInText) {
      return res.status(400).json({
        success: false,
        error: 'LinkedIn profile data is required'
      });
    }

    console.log(`🚀 [${clientIp}] Generating message for outreach type: ${linkedinProfileData.outreachType}`);

    // Get user profile for signature
    console.log('🔍 LinkedIn Outreach - About to get user profile info...');
    const userProfile = await getUserProfileInfo(req);
    console.log('🔍 LinkedIn Outreach - User profile retrieved for signature:', userProfile);

    // Extract LinkedIn data from raw text using AI
    console.log('🔍 LinkedIn Outreach - Raw LinkedIn text length:', linkedinProfileData.rawLinkedInText?.length || 0);
    console.log('🔍 LinkedIn Outreach - Raw LinkedIn text preview:', linkedinProfileData.rawLinkedInText?.substring(0, 200) + '...');
    const extractedLinkedInData = await extractLinkedInData(linkedinProfileData.rawLinkedInText);
    console.log('🔍 LinkedIn Outreach - Extracted LinkedIn data:', {
      contactName: extractedLinkedInData.contactName,
      specificCompanies: extractedLinkedInData.specificCompanies,
      specificRoles: extractedLinkedInData.specificRoles,
      achievements: extractedLinkedInData.achievements
    });

    // Add form data to extracted data
    extractedLinkedInData.callPreference = linkedinProfileData.callPreference;
    extractedLinkedInData.outreachType = linkedinProfileData.outreachType;

    // Extract contact name from LinkedIn profile if not provided directly
    const contactName = linkedinProfileData.contactName || extractedLinkedInData.contactName || 'there';
    const contactEmail = linkedinProfileData.contactEmail;

    // Always generate a LinkedIn-based message first as the primary approach
    console.log(`📄 [${clientIp}] Generating LinkedIn-based message...`);

    // Check if website URL is provided for optional enhancement
    if (linkedinProfileData.websiteUrl && linkedinProfileData.websiteUrl.trim() !== '') {
      // Validate URL format
      try {
        new URL(linkedinProfileData.websiteUrl);
        console.log(`🌐 [${clientIp}] Website URL provided: ${linkedinProfileData.websiteUrl} - Will try to enhance with website data...`);

        // Try to scrape website and enhance the message, but fall back to LinkedIn-only if it fails
        tryWebsiteEnhancedMessage(linkedinProfileData.websiteUrl, extractedLinkedInData, res, startTime, clientIp, contactName, userProfile);
      } catch (e) {
        console.log(`⚠️ [${clientIp}] Invalid URL format, using LinkedIn-only approach: ${linkedinProfileData.websiteUrl}`);
        generateMessageWithoutCompanyInfo(extractedLinkedInData, res, startTime, clientIp, contactName, userProfile);
      }
    } else {
      // No website URL - generate message with LinkedIn data only
      console.log(`📄 [${clientIp}] No website URL provided - Generating LinkedIn-only message`);
      generateMessageWithoutCompanyInfo(extractedLinkedInData, res, startTime, clientIp, contactName, userProfile);
    }

  } catch (error) {
    console.error(`❌ [${clientIp}] Error in generate-message endpoint:`, error);
    const duration = Date.now() - startTime;
    console.log(`⏱️ [${clientIp}] Request failed after ${duration}ms`);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function scrapeAndGenerateMessage(websiteUrl: string, linkedinData: LinkedInData, res: express.Response, startTime: number, clientIp: string, contactName: string, userProfile: { name: string; title: string; } | null) {
  const scraperPath = path.join(__dirname, '../../../website_scraper.py');
  const scraperDir = path.dirname(scraperPath);
  
  console.log('Scraper path:', scraperPath);
  console.log('Scraper directory:', scraperDir);
  
  const scrapeCode = `
import sys
import json
import os

# Add the scraper directory to Python path
scraper_dir = r'${scraperDir}'
if scraper_dir not in sys.path:
    sys.path.insert(0, scraper_dir)

# Change to the scraper directory
try:
    os.chdir(scraper_dir)
except Exception as e:
    print(json.dumps({'error': f'Failed to change directory: {str(e)}'}))
    sys.exit(1)

# Import with explicit error handling
try:
    from website_scraper import WebsiteScraper
    scraper = WebsiteScraper()
    company_info = scraper.scrape_website_with_crawl('${websiteUrl}')

    if company_info:
        from dataclasses import asdict
        print(json.dumps(asdict(company_info)))
    else:
        print(json.dumps({'error': 'Failed to scrape website'}))
except ImportError as e:
    print(json.dumps({'error': f'Import error: {str(e)}'}))
except Exception as e:
    print(json.dumps({'error': f'Scraper error: {str(e)}'}))
`;

  // Execute website scraper (use python3 on macOS)
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
    const duration = Date.now() - startTime;
    console.log(`🐍 [${clientIp}] Python scraper exit code: ${code} (${duration}ms)`);
    console.log(`📄 [${clientIp}] Python scraper output:`, scraperOutput);
    if (scraperError) {
      console.error(`❌ [${clientIp}] Python scraper error:`, scraperError);
    }

    if (code !== 0) {
      return res.status(500).json({
        success: false,
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
        return res.status(500).json({
          success: false,
          error: companyInfo.error
        });
      }

      // Now generate the personalized message using OpenAI with company info
      generatePersonalizedMessage(companyInfo, linkedinData, res, startTime, clientIp, contactName, userProfile);

    } catch (e) {
      console.error(`❌ [${clientIp}] Error parsing scraper output:`, e);
      res.status(500).json({
        success: false,
        error: 'Failed to parse scraper output',
        details: scraperOutput
      });
    }
  });
}

async function tryWebsiteEnhancedMessage(websiteUrl: string, linkedinData: LinkedInData, res: express.Response, startTime: number, clientIp: string, contactName: string, userProfile: { name: string; title: string; } | null) {
  try {
    console.log(`🌐 [${clientIp}] Attempting to enhance message with website data from: ${websiteUrl}`);

    const scraperPath = path.join(__dirname, '../../../website_scraper.py');
    const scraperDir = path.dirname(scraperPath);

    const scrapeCode = `
import sys
import json
import os

# Add the scraper directory to Python path
scraper_dir = r'${scraperDir}'
if scraper_dir not in sys.path:
    sys.path.insert(0, scraper_dir)

# Change to the scraper directory
try:
    os.chdir(scraper_dir)
except Exception as e:
    print(json.dumps({'error': f'Failed to change directory: {str(e)}'}))
    sys.exit(1)

# Import with explicit error handling
try:
    from website_scraper import WebsiteScraper
    scraper = WebsiteScraper()
    company_info = scraper.scrape_website_with_crawl('${websiteUrl}')

    if company_info:
        from dataclasses import asdict
        print(json.dumps(asdict(company_info)))
    else:
        print(json.dumps({'error': 'Failed to scrape website'}))
except ImportError as e:
    print(json.dumps({'error': f'Import error: {str(e)}'}))
except Exception as e:
    print(json.dumps({'error': f'Scraper error: {str(e)}'}))
`;

    // Execute website scraper with timeout
    const scraper = spawn('python3', ['-c', scrapeCode]);
    let scraperOutput = '';
    let scraperError = '';

    // Set timeout for scraper
    const timeout = setTimeout(() => {
      console.log(`⏰ [${clientIp}] Website scraper timeout, falling back to LinkedIn-only message`);
      scraper.kill('SIGTERM');
      generateMessageWithoutCompanyInfo(linkedinData, res, startTime, clientIp, contactName, userProfile);
    }, 30000); // 30 second timeout

    scraper.stdout.on('data', (data) => {
      scraperOutput += data.toString();
    });

    scraper.stderr.on('data', (data) => {
      scraperError += data.toString();
    });

    scraper.on('close', async (code) => {
      clearTimeout(timeout);

      console.log(`🐍 [${clientIp}] Python scraper exit code: ${code}`);

      // If scraper failed, fall back to LinkedIn-only message
      if (code !== 0) {
        console.log(`❌ [${clientIp}] Website scraper failed (exit code ${code}), falling back to LinkedIn-only message`);
        console.error(`❌ [${clientIp}] Scraper error:`, scraperError);
        return generateMessageWithoutCompanyInfo(linkedinData, res, startTime, clientIp, contactName, userProfile);
      }

      try {
        // Parse scraper output
        const lines = scraperOutput.trim().split('\n');
        const jsonLine = lines[lines.length - 1];
        const companyInfo = JSON.parse(jsonLine);

        if (companyInfo.error) {
          console.log(`⚠️ [${clientIp}] Website scraping returned error, falling back to LinkedIn-only message`);
          return generateMessageWithoutCompanyInfo(linkedinData, res, startTime, clientIp, contactName, userProfile);
        }

        console.log(`GOOD [${clientIp}] Website data successfully retrieved, generating enhanced message`);
        // Generate enhanced message with company info
        generatePersonalizedMessage(companyInfo, linkedinData, res, startTime, clientIp, contactName, userProfile);

      } catch (parseError) {
        console.error(`❌ [${clientIp}] Error parsing scraper output, falling back to LinkedIn-only message:`, parseError);
        generateMessageWithoutCompanyInfo(linkedinData, res, startTime, clientIp, contactName, userProfile);
      }
    });

    scraper.on('error', (error) => {
      clearTimeout(timeout);
      console.error(`❌ [${clientIp}] Scraper process error, falling back to LinkedIn-only message:`, error);
      generateMessageWithoutCompanyInfo(linkedinData, res, startTime, clientIp, contactName, userProfile);
    });

  } catch (error) {
    console.error(`❌ [${clientIp}] Error in tryWebsiteEnhancedMessage, falling back to LinkedIn-only message:`, error);
    generateMessageWithoutCompanyInfo(linkedinData, res, startTime, clientIp, contactName, userProfile);
  }
}

async function generateMessageWithoutCompanyInfo(linkedinData: LinkedInData, res: express.Response, startTime: number, clientIp: string, contactName: string, userProfile: { name: string; title: string; } | null) {
  try {
    let prompt = '';
    
    if (linkedinData.outreachType === 'Interest in Acquisition') {
      prompt = `You are ${userProfile?.name || 'a search fund professional'}, ${userProfile?.title || 'a search fund professional'}, reaching out to a potential acquisition target.

CONTACT INFORMATION:
Contact Name: ${contactName}
First Name: ${contactName.split(' ')[0]}

TARGET PERSON'S DETAILED LinkedIn Profile Data:
Contact Name: ${linkedinData.contactName}
Specific Companies: ${linkedinData.specificCompanies}
Specific Roles: ${linkedinData.specificRoles}
Key Achievements: ${linkedinData.achievements}
Skills/Expertise: ${linkedinData.skills}
About/Summary: ${linkedinData.aboutMe}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Latest Post: ${linkedinData.latestPost}
Call Preference: ${linkedinData.callPreference}

CRITICAL PERSONALIZATION REQUIREMENTS:
1. Start with "Hi ${contactName.split(' ')[0] || contactName}," (use first name only in greeting)
2. Reference SPECIFIC companies, roles, or achievements from their profile (not generic industry terms)
3. Use exact company names and job titles mentioned in their experience
4. Reference specific numbers, metrics, or accomplishments when available
5. End with proper signature: "Best regards,\n${userProfile?.name || 'Shariq Hafizi'}\n${userProfile?.title || 'Founder & CEO, Equitle'}"

EXAMPLES OF SPECIFIC vs GENERIC:
❌ AVOID: "your experience in SaaS and growth marketing"
GOOD USE: "your role as VP of Growth at Slack where you scaled user acquisition from 1M to 10M users"

❌ AVOID: "your background in finance"
GOOD USE: "your experience as Managing Director at Goldman Sachs leading the $2B technology investment fund"

TASK:
Create a highly personalized acquisition-focused outreach message that:
1. Uses their specific company names, job titles, and achievements
2. Shows you've thoroughly researched their background
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional interested in learning about potential acquisition opportunities
5. References specific accomplishments or notable experiences from their profile
6. Is professional but warm and engaging
7. Includes clear call-to-action for the specified time preference

FORMAT:
Return a JSON object with:
- subject: Compelling email subject line referencing something specific from their background
- body: The complete message body with proper greeting and signature
- approach: Brief explanation of the specific personalization used

The message should feel like you've done extensive research on them specifically.`;
    } else if (linkedinData.outreachType === 'Interest in Entrepreneurial Journey') {
      prompt = `You are ${userProfile?.name || 'a search fund professional'}, ${userProfile?.title || 'a search fund professional'}, reaching out to learn from a successful entrepreneur.

CONTACT INFORMATION:
Contact Name: ${contactName}
First Name: ${contactName.split(' ')[0]}

TARGET PERSON'S DETAILED LinkedIn Profile Data:
Contact Name: ${linkedinData.contactName}
Specific Companies: ${linkedinData.specificCompanies}
Specific Roles: ${linkedinData.specificRoles}
Key Achievements: ${linkedinData.achievements}
Skills/Expertise: ${linkedinData.skills}
About/Summary: ${linkedinData.aboutMe}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Latest Post: ${linkedinData.latestPost}
Call Preference: ${linkedinData.callPreference}

CRITICAL PERSONALIZATION REQUIREMENTS:
1. Start with "Hi ${contactName.split(' ')[0] || contactName}," (use first name only in greeting)
2. Reference SPECIFIC companies they founded/led, deals they closed, or teams they built
3. Use exact company names, funding amounts, growth metrics, or team sizes when available
4. Reference their specific entrepreneurial achievements and journey milestones
5. End with proper signature: "Best regards,\n${userProfile?.name || 'Shariq Hafizi'}\n${userProfile?.title || 'Founder & CEO, Equitle'}"

EXAMPLES OF SPECIFIC vs GENERIC:
❌ AVOID: "your entrepreneurial experience"
GOOD USE: "your journey building Airbnb from a simple idea to a $75B company serving 1B+ guests"

❌ AVOID: "your startup background"
GOOD USE: "how you led Stripe through their Series A to $95B valuation, scaling from 50 to 3,000+ employees"

TASK:
Create a highly personalized entrepreneurial journey-focused outreach message that:
1. References their specific companies, funding rounds, growth metrics, or notable achievements
2. Shows genuine interest in learning from their specific journey and experiences
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional seeking specific insights/mentorship
5. References their actual entrepreneurial accomplishments with numbers when possible
6. Is professional but warm and shows you've done extensive research
7. Includes clear call-to-action for the specified time preference

FORMAT:
Return a JSON object with:
- subject: Compelling email subject line referencing their specific entrepreneurial achievement
- body: The complete message body with proper greeting and signature
- approach: Brief explanation of the specific entrepreneurial details referenced

Make the message feel personal and show that you've researched their specific journey.`;
    } else {
      // Default prompt
      prompt = `You are ${userProfile?.name || 'a search fund professional'}, ${userProfile?.title || 'a search fund professional'}, reaching out to a potential business connection.

CONTACT INFORMATION:
Contact Name: ${contactName}
First Name: ${contactName.split(' ')[0]}

TARGET PERSON'S DETAILED LinkedIn Profile Data:
Contact Name: ${linkedinData.contactName}
Specific Companies: ${linkedinData.specificCompanies}
Specific Roles: ${linkedinData.specificRoles}
Key Achievements: ${linkedinData.achievements}
Skills/Expertise: ${linkedinData.skills}
About/Summary: ${linkedinData.aboutMe}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Latest Post: ${linkedinData.latestPost}
Call Preference: ${linkedinData.callPreference}

CRITICAL PERSONALIZATION REQUIREMENTS:
1. Start with "Hi ${contactName.split(' ')[0] || contactName}," (use first name only in greeting)
2. Reference SPECIFIC companies, roles, or achievements from their profile
3. Use exact company names and job titles mentioned in their experience
4. Reference specific accomplishments or notable work when available
5. End with proper signature: "Best regards,\n${userProfile?.name || 'Shariq Hafizi'}\n${userProfile?.title || 'Founder & CEO, Equitle'}"

EXAMPLES OF SPECIFIC vs GENERIC:
❌ AVOID: "your experience in technology"
GOOD USE: "your role as CTO at Tesla where you led the development of the Model S autopilot system"

❌ AVOID: "your background in consulting"
GOOD USE: "your work as Partner at McKinsey leading digital transformation projects for Fortune 500 companies"

TASK:
Create a highly personalized business outreach message that:
1. Uses their specific company names, job titles, and achievements
2. Shows genuine interest in their professional background
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional looking to connect
5. References specific accomplishments or notable experiences from their profile
6. Is professional but warm and engaging
7. Includes clear call-to-action for the specified time preference

FORMAT:
Return a JSON object with:
- subject: Compelling email subject line referencing something specific from their background
- body: The complete message body with proper greeting and signature
- approach: Brief explanation of the specific details referenced

Make the message feel personal and show that you've researched their specific background.`;
    }

    const openaiService = new OpenAIService();
    
    try {
      console.log(`🤖 [${clientIp}] Calling OpenAI to generate personalized message (without company data)...`);

      const aiResponse = await openaiService.generateResponse(
        prompt,
        [],
        ''
      );

      console.log(`GOOD [${clientIp}] OpenAI response received:`, aiResponse.substring(0, 200) + '...');

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
        console.log(`⚠️ [${clientIp}] Could not parse AI response as JSON, using as-is`);
        aiMessage = {
          subject: `Let's connect`,
          body: aiResponse,
          approach: `AI-generated message based on ${linkedinData.outreachType}`
        };
      }

      const duration = Date.now() - startTime;
      console.log(`[EMAIL] [${clientIp}] Generated message: "${aiMessage.subject}" (${duration}ms)`);

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
      console.error(`❌ [${clientIp}] OpenAI API error:`, openaiError);

      // Fallback to a basic template if OpenAI fails
      const fallbackMessage = {
        subject: `Quick question`,
        body: `Hi there,\n\nI came across your profile and was impressed by your background in ${linkedinData.experience}. I'm a search fund professional and would love to connect.\n\nI'm particularly interested in ${linkedinData.callPreference.toLowerCase()} to discuss potential opportunities.\n\nWould you be open to a brief call ${linkedinData.callPreference.toLowerCase()}?\n\nBest regards,\nShariq Hafizi\nFounder & CEO, Equitle`,
        approach: `Fallback message due to OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`
      };

      const duration = Date.now() - startTime;
      console.log(`📧 [${clientIp}] Using fallback message (${duration}ms)`);

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
    const duration = Date.now() - startTime;
    console.error(`❌ [${clientIp}] Error generating message without company info:`, error);
    console.log(`⏱️ [${clientIp}] Request failed after ${duration}ms`);

    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function extractLinkedInData(rawLinkedInText: string): Promise<LinkedInData> {
  try {
    const openaiService = new OpenAIService();

    const extractionPrompt = `You are an expert at extracting specific details from LinkedIn profiles. Extract the following information with maximum specificity and detail:

LINKEDIN PROFILE TEXT:
${rawLinkedInText}

CRITICAL INSTRUCTIONS:
- Extract SPECIFIC company names, job titles, achievements, and numbers/metrics
- Do NOT generalize (e.g., avoid "experience in SaaS" - instead say "VP of Engineering at Stripe, scaling payment infrastructure")
- Include specific accomplishments, revenue numbers, team sizes, growth metrics when available
- Preserve exact company names, job titles, and quantifiable results
- ENSURE THE JSON IS VALID - use proper escaping for quotes and special characters

Please extract and return ONLY a simple JSON object with these exact fields (use SIMPLE STRINGS only, NO nested arrays or objects):
{
  "contactName": "Person's full name",
  "interest": "What they are passionate about professionally",
  "aboutMe": "Brief summary of their about section",
  "experience": "Work experience summary with companies and roles",
  "specificCompanies": "Company names separated by commas",
  "specificRoles": "Job titles separated by commas",
  "achievements": "Key accomplishments with numbers when available",
  "skills": "Skills and expertise areas",
  "latestPost": "Recent post content if available",
  "education": "Education background",
  "location": "Current location"
}

EXAMPLES OF GOOD vs BAD EXTRACTION:
❌ BAD: "experience in SaaS and growth marketing"
✅ GOOD: "VP of Growth at Slack where she scaled user acquisition from 1M to 10M users through innovative referral programs and product-led growth strategies"

❌ BAD: "background in finance"
✅ GOOD: "Managing Director at Goldman Sachs leading the $2B technology investment fund, previously Investment Banking Analyst covering fintech deals worth $500M+"

IMPORTANT:
- If any information is not available or unclear, use "Not specified" for that field.
- Return ONLY the JSON object - NO markdown code blocks, NO json backticks, NO explanations
- Ensure all strings are properly escaped and valid JSON format
- Use simple strings only, NO nested arrays or objects`;

    const aiResponse = await openaiService.generateResponse(
      extractionPrompt,
      [],
      ''
    );

    console.log('🔍 LinkedIn data extraction response length:', aiResponse.length);
    console.log('🔍 LinkedIn `data extraction response preview:', aiResponse.substring(0, 500) + '...');

    // Try to clean up the JSON before parsing
    let jsonString = aiResponse;

    // First, remove markdown code blocks if present
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');

    // Then extract the JSON object
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    // Try to parse the JSON with better error handling
    let extractedData;
    try {
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Initial JSON parse failed, attempting to fix:', parseError);
      console.log('Problematic JSON string:', jsonString);

      // Try to fix common JSON issues
      let fixedJsonString = jsonString
        .replace(/[\r\n]+/g, ' ') // Remove newlines
        .replace(/,\s*}/g, '}') // Remove trailing commas before }
        .replace(/,\s*]/g, ']') // Remove trailing commas before ]
        .replace(/\}\s*\]/g, '}]') // Fix spacing issues
        .replace(/\[\s*\{/g, '[{') // Fix array formatting
        .trim(); // Remove extra whitespace

      try {
        extractedData = JSON.parse(fixedJsonString);
        console.log('GOOD Successfully fixed and parsed JSON');
      } catch (secondError) {
        console.error('Secondary JSON parse also failed:', secondError);
        // Return default values if all parsing attempts fail
        return {
          contactName: 'Not specified',
          interest: 'Not specified',
          aboutMe: 'Not specified',
          experience: 'Not specified',
          specificCompanies: 'Not specified',
          specificRoles: 'Not specified',
          achievements: 'Not specified',
          skills: 'Not specified',
          latestPost: 'Not specified',
          education: 'Not specified',
          location: 'Not specified',
          callPreference: '',
          outreachType: ''
        };
      }
    }

    return {
      contactName: extractedData.contactName || 'Not specified',
      interest: extractedData.interest || 'Not specified',
      aboutMe: extractedData.aboutMe || 'Not specified',
      experience: extractedData.experience || 'Not specified',
      specificCompanies: extractedData.specificCompanies || 'Not specified',
      specificRoles: extractedData.specificRoles || 'Not specified',
      achievements: extractedData.achievements || 'Not specified',
      skills: extractedData.skills || 'Not specified',
      latestPost: extractedData.latestPost || 'Not specified',
      education: extractedData.education || 'Not specified',
      location: extractedData.location || 'Not specified',
      callPreference: '',
      outreachType: ''
    };

  } catch (error) {
    console.error('Error extracting LinkedIn data:', error);
    return {
      contactName: 'Not specified',
      interest: 'Not specified',
      aboutMe: 'Not specified',
      experience: 'Not specified',
      specificCompanies: 'Not specified',
      specificRoles: 'Not specified',
      achievements: 'Not specified',
      skills: 'Not specified',
      latestPost: 'Not specified',
      education: 'Not specified',
      location: 'Not specified',
      callPreference: '',
      outreachType: ''
    };
  }
}

async function generatePersonalizedMessage(companyInfo: any, linkedinData: LinkedInData, res: express.Response, startTime: number, clientIp: string, contactName: string, userProfile: { name: string; title: string; } | null) {
  try {
    let prompt = '';
    
    if (linkedinData.outreachType === 'Interest in Acquisition') {
      prompt = `You are ${userProfile?.name || 'a search fund professional'}, ${userProfile?.title || 'a search fund professional'}, reaching out to a potential acquisition target.

CONTACT INFORMATION:
Contact Name: ${contactName}
First Name: ${contactName.split(' ')[0]}

TARGET COMPANY INFORMATION:
Company: ${companyInfo.company_name}
Website: ${companyInfo.url}
About Text: ${companyInfo.about_text}

TARGET PERSON'S DETAILED LinkedIn Profile Data:
Contact Name: ${linkedinData.contactName}
Specific Companies: ${linkedinData.specificCompanies}
Specific Roles: ${linkedinData.specificRoles}
Key Achievements: ${linkedinData.achievements}
Skills/Expertise: ${linkedinData.skills}
About/Summary: ${linkedinData.aboutMe}
Education: ${linkedinData.education}
Location: ${linkedinData.location}
Latest Post: ${linkedinData.latestPost}
Call Preference: ${linkedinData.callPreference}

CRITICAL PERSONALIZATION REQUIREMENTS:
1. Start with "Hi ${contactName.split(' ')[0] || contactName}," (use first name only in greeting)
2. Reference SPECIFIC companies, roles, achievements, and metrics from their profile
3. Mention specific aspects of their company (${companyInfo.company_name}) from the website research
4. Use exact company names, job titles, and accomplishments
5. End with proper signature: "Best regards,\n${userProfile?.name || 'Shariq Hafizi'}\n${userProfile?.title || 'Founder & CEO, Equitle'}"

EXAMPLES OF SPECIFIC vs GENERIC:
❌ AVOID: "your experience in the tech industry and your company"
GOOD USE: "your role as CTO at ${companyInfo.company_name} where you've built the AI-powered platform serving 50,000+ customers"

TASK:
Create a highly personalized acquisition-focused outreach message that:
1. Uses their specific company names, job titles, and achievements from LinkedIn
2. References specific details about ${companyInfo.company_name} from the company research
3. Incorporates their call preference: ${linkedinData.callPreference}
4. Positions you as a search fund professional interested in acquisition opportunities
5. Shows you've researched both their personal background and their company thoroughly
6. Is professional but warm and engaging
7. Includes clear call-to-action for the specified time preference

FORMAT:
Return a JSON object with:
- subject: Compelling email subject line mentioning their company or specific achievement
- body: The complete message body with proper greeting and signature
- approach: Brief explanation of the specific personalization used

Make the message feel like you've done extensive research on both them personally and their company.`;
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
      console.log(`🤖 [${clientIp}] Calling OpenAI to generate personalized message...`);

      const aiResponse = await openaiService.generateResponse(
        prompt,
        [],
        ''
      );

      console.log(`GOOD [${clientIp}] OpenAI response received:`, aiResponse.substring(0, 200) + '...');

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
        console.log(`⚠️ [${clientIp}] Could not parse AI response as JSON, using as-is`);
        aiMessage = {
          subject: `Personalized outreach to ${companyInfo.company_name}`,
          body: aiResponse,
          approach: `AI-generated message based on ${linkedinData.outreachType}`
        };
      }

      const duration = Date.now() - startTime;
      console.log(`[EMAIL] [${clientIp}] Generated message: "${aiMessage.subject}" (${duration}ms)`);

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
      console.error(`❌ [${clientIp}] OpenAI API error:`, openaiError);

      const fallbackMessage = {
        subject: `Quick question about ${companyInfo.company_name}`,
        body: `Hi there,\n\nI came across ${companyInfo.company_name} and was impressed by your work. Based on your background in ${linkedinData.experience}, I thought you might be interested in connecting.\n\nI'm particularly interested in ${linkedinData.callPreference.toLowerCase()} to discuss potential opportunities.\n\nWould you be open to a brief call ${linkedinData.callPreference.toLowerCase()}?\n\nBest regards,\nShariq Hafizi\nFounder & CEO, Equitle`,
        approach: `Fallback message due to OpenAI error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`
      };

      const duration = Date.now() - startTime;
      console.log(`📧 [${clientIp}] Using fallback message (${duration}ms)`);

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
    const duration = Date.now() - startTime;
    console.error(`❌ [${clientIp}] Error generating message:`, error);
    console.log(`⏱️ [${clientIp}] Request failed after ${duration}ms`);

    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default router;
