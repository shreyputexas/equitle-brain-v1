import OpenAI from 'openai';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import fs from 'fs';
import path from 'path';
import { templateEditorService, TemplateData } from './templateEditor.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SearcherProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  why: string;
  headshotUrl?: string;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string;
  }>;
}

export interface InvestmentCriteria {
  id: string;
  category: string;
  field: string;
  value: string | number;
  operator: string;
  weight: number;
  valuationType?: string;
}

export interface ThesisData {
  name: string;
  criteria: InvestmentCriteria[];
}

export interface OnePagerRequest {
  searcherProfiles: SearcherProfile[];
  thesisData: ThesisData;
  teamConnection?: string;
  template?: string;
  searchFundName?: string;
  searchFundWebsite?: string;
  searchFundLogo?: string;
  searchFundAddress?: string;
  searchFundEmail?: string;
}

export interface OnePagerContent {
  whyWorkWithUs: string;
  investmentCriteria: string;
  industriesWeServe: string;
  ourStories: string;
  searcherStory1: string;
  searcherStory2: string;
}

export class OnePagerGenerationService {
  async generateContent(request: OnePagerRequest): Promise<OnePagerContent> {
    const prompt = this.buildPrompt(request);

    try {
      console.log('Calling OpenAI API for content generation...');
      console.log('=== SEARCHER PROFILES DATA ===');
      console.log('Number of profiles:', request.searcherProfiles?.length || 0);
      request.searcherProfiles?.forEach((profile, idx) => {
        console.log(`Profile ${idx + 1}:`, {
          name: profile.name,
          title: profile.title,
          hasBio: !!profile.bio,
          hasWhy: !!profile.why,
          educationCount: profile.education?.length || 0,
          experienceCount: profile.experience?.length || 0
        });
      });
      console.log('=== END SEARCHER PROFILES DATA ===');
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional copywriter specializing in creating compelling investment pitch materials for search fund professionals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log('OpenAI API call successful');
      const content = completion.choices[0].message.content;
      console.log('=== OPENAI RESPONSE ===');
      console.log('Raw content length:', content?.length);
      console.log('Full raw content:', content);
      // Save to file for inspection
      require('fs').writeFileSync('/tmp/openai-response.txt', content || '');
      console.log('=== END OPENAI RESPONSE ===');
      const parsed = this.parseContent(content || '', request);
      console.log('=== PARSED CONTENT ===');
      console.log('searcherStory1 length:', parsed.searcherStory1?.length || 0);
      console.log('searcherStory2 length:', parsed.searcherStory2?.length || 0);
      console.log('searcherStory1 preview:', parsed.searcherStory1?.substring(0, 100) || 'EMPTY');
      console.log('searcherStory2 preview:', parsed.searcherStory2?.substring(0, 100) || 'EMPTY');
      console.log('=== END PARSED CONTENT ===');
      return parsed;
    } catch (error: any) {
      console.error('=== OPENAI API ERROR ===');
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error type:', error?.type);
      console.error('Error status:', error?.status);
      console.error('Full error:', error);
      console.error('========================');
      throw new Error(`Failed to generate one-pager content: ${error?.message || error}`);
    }
  }

  private buildPrompt(request: OnePagerRequest): string {
    const searcherProfilesText = request.searcherProfiles.map(profile => 
      `Name: ${profile.name}
Title: ${profile.title}
Bio: ${profile.bio || 'Not provided'}
Why: ${profile.why || 'Not provided'}
Education: ${profile.education?.map(edu => `${edu.degree} in ${edu.field} from ${edu.institution}`).join(', ') || 'Not provided'}
Experience: ${profile.experience?.map(exp => `${exp.position} at ${exp.company}`).join(', ') || 'Not provided'}`
    ).join('\n\n---\n\n');

    const thesisText = `Thesis: ${request.thesisData.name}
Criteria: ${request.thesisData.criteria?.map(c => 
      `${c.field} ${c.operator} ${c.value} (${c.weight}% weight)`
    ).join(', ') || 'Not specified'}`;

    const teamConnectionText = request.teamConnection ? 
      `Team Connection: ${request.teamConnection}` : '';

    return `Generate content for a one-page pitch document based on the provided searcher profile(s) and investment thesis.

**SEARCHER PROFILE(S):**
${searcherProfilesText}

**INVESTMENT THESIS:**
${thesisText}

**TEAM CONNECTION (if multiple searchers):**
${teamConnectionText}

**IMPORTANT INSTRUCTIONS FOR TEAM STORIES:**
- If team connection is provided, use it as the foundation for "Our Stories"
- Lead with WHERE and HOW the searchers met
- Explain WHY they work well together
- Show the EMOTIONAL and PROFESSIONAL bond
- Make it feel like a genuine partnership story

**CONTENT REQUIREMENTS:**

1. **"Why Work With Us"** (4 lines maximum):
   - Use a mixed tone: professional yet personal, confident but approachable
   - Highlight the searcher(s)' unique qualifications, experience, and value proposition
   - Focus on what makes them the ideal team to acquire and operate the target business
   - Use specific achievements and relevant experience
   - Keep it concise and impactful

2. **"Investment Criteria"** (6 lines maximum):
   - Transform the investment thesis criteria into compelling, investor-friendly language
   - Use exact numbers from the data but present them in natural, flowing language
   - Focus on the most important criteria that define their ideal acquisition target
   - Use clear, professional language that investors can quickly understand
   - Include specific metrics and ranges as provided in the thesis data

3. **"Industries We Serve"** (12 lines maximum):
   - Identify 3-4 target industries based on BOTH searcher experience AND thesis criteria
   - If searcher(s) have direct experience in industries that match the thesis, highlight that connection
   - If no direct experience, focus solely on thesis criteria to identify attractive industries
   - For each industry, provide 2-3 lines explaining:
     - Why this industry is attractive based on thesis criteria
     - The searcher(s)' relevant experience in this space (if any)
     - Specific opportunities or trends they're targeting
   - Prioritize industries where searcher experience aligns with thesis criteria
   - **BE PASSIONATE**: Use enthusiastic language about why these industries excite you
   - **BE SPECIFIC**: Mention concrete trends, technologies, or market dynamics that drive your interest
   - **SHOW EXPERTISE**: Demonstrate deep knowledge and genuine excitement for these sectors

4. **"Our Stories"** (7 lines maximum):
   - **EMPHASIZE PERSONAL CONNECTION**: If multiple searchers, lead with how and where you met
   - **SHOW WHY YOU WORK TOGETHER**: Highlight complementary skills, shared values, or common goals
   - **BE PASSIONATE AND PERSONAL**: Use emotional language, not just professional achievements
   - **INCLUDE SPECIFIC MOMENTS**: Share a defining experience that shows your partnership
   - **DEMONSTRATE CHEMISTRY**: Show why your team dynamic is special and effective
   - **MAKE IT MEMORABLE**: Use storytelling that investors will remember
   - **SHOW AUTHENTICITY**: Be genuine about your relationship and shared vision

5. **"Searcher Story 1"** (3-4 lines maximum):
   - Write a personal story for the FIRST searcher (${request.searcherProfiles?.[0]?.name || 'Searcher 1'}, ${request.searcherProfiles?.[0]?.title || 'Founder'})
   - If detailed profile information is available, focus on their individual journey, background, and what drives them
   - If profile details are limited, write an engaging narrative about their role, expertise, and vision for the search
   - Make it personal and compelling regardless of available data
   - Show their passion and why they're pursuing this search
   - IMPORTANT: ALWAYS generate this section even if profile data is limited

6. **"Searcher Story 2"** (3-4 lines maximum):
   - Write a personal story for the SECOND searcher (${request.searcherProfiles?.[1]?.name || 'Searcher 2'}, ${request.searcherProfiles?.[1]?.title || 'Co-Founder'})
   - If detailed profile information is available, focus on their individual journey, background, and what drives them
   - If profile details are limited, write an engaging narrative about their role, expertise, and vision for the search
   - Make it personal and compelling regardless of available data
   - Show their passion and why they're pursuing this search
   - IMPORTANT: ALWAYS generate this section even if profile data is limited

**TONE AND STYLE:**
- **PASSIONATE AND ENTHUSIASTIC**: Show genuine excitement and energy
- **PERSONAL AND AUTHENTIC**: Use emotional language that connects with investors
- **SPECIFIC AND CONCRETE**: Avoid generic statements, use real examples
- **STORY-DRIVEN**: Focus on compelling narratives, not just achievements
- **TEAM-FOCUSED**: If multiple searchers, emphasize partnership and chemistry
- **INDUSTRY-EXCITED**: Show deep passion for the sectors you're targeting
- **MEMORABLE**: Use language that investors will remember and quote
- **AUTHENTIC**: Be genuine about your relationship and shared vision

**OUTPUT FORMAT:**
Provide the content in the exact format requested, with clear section headers and line count compliance. Each section should be ready to insert directly into the one-pager template.

IMPORTANT: Do NOT use markdown formatting (**, *, etc.) in the section headers. Use plain text only.

Format your response EXACTLY as shown below (no asterisks, no bold, just plain text):
WHY_WORK_WITH_US:
[content]

INVESTMENT_CRITERIA:
[content]

INDUSTRIES_WE_SERVE:
[content]

OUR_STORIES:
[content]

SEARCHER_STORY_1:
[content]

SEARCHER_STORY_2:
[content]`;
  }

  private parseContent(content: string, request: OnePagerRequest): OnePagerContent {
    // Split on one or more newlines followed by section headers (includes digits for SEARCHER_STORY_1, etc.)
    const sections = content.split(/\n+(?=[A-Z_0-9]+:)/);
    console.log('=== PARSING SECTIONS ===');
    console.log('Number of sections:', sections.length);
    const result: OnePagerContent = {
      whyWorkWithUs: '',
      investmentCriteria: '',
      industriesWeServe: '',
      ourStories: '',
      searcherStory1: '',
      searcherStory2: ''
    };

    sections.forEach((section, idx) => {
      const lines = section.split('\n');
      // Strip markdown formatting (**, *, etc.) from header but keep underscores, remove colon
      const header = lines[0].replace(/\*/g, '').replace(':', '').trim();
      const content = lines.slice(1).join('\n').trim();
      console.log(`Section ${idx}: header="${header}", content length=${content.length}`);

      switch (header) {
        case 'WHY_WORK_WITH_US':
          result.whyWorkWithUs = content;
          break;
        case 'INVESTMENT_CRITERIA':
          result.investmentCriteria = content;
          break;
        case 'INDUSTRIES_WE_SERVE':
          result.industriesWeServe = content;
          break;
        case 'OUR_STORIES':
          result.ourStories = content;
          break;
        case 'SEARCHER_STORY_1':
          result.searcherStory1 = content;
          break;
        case 'SEARCHER_STORY_2':
          result.searcherStory2 = content;
          break;
      }
    });

    // Fallback: If OpenAI didn't generate searcher stories, create placeholder content
    if (!result.searcherStory1 && request.searcherProfiles?.[0]) {
      const profile1 = request.searcherProfiles[0];
      result.searcherStory1 = `${profile1.name}, ${profile1.title}, brings a wealth of experience and passion to this search. With a deep commitment to identifying and scaling businesses, ${profile1.name} is dedicated to driving growth and creating lasting value in the companies we acquire.`;
    }

    if (!result.searcherStory2 && request.searcherProfiles?.[1]) {
      const profile2 = request.searcherProfiles[1];
      result.searcherStory2 = `${profile2.name}, ${profile2.title}, combines strategic insight with hands-on operational expertise. ${profile2.name}'s vision and drive complement our team perfectly, ensuring we can execute on our acquisition strategy and build exceptional businesses together.`;
    }

    return result;
  }

  async generateDocx(content: OnePagerContent, searcherNames: string[]): Promise<Buffer> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "Search Fund Pitch",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),

          // Why Work With Us
          new Paragraph({
            children: [
              new TextRun({
                text: "Why Work With Us",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: content.whyWorkWithUs,
                size: 22,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Investment Criteria
          new Paragraph({
            children: [
              new TextRun({
                text: "Investment Criteria",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: content.investmentCriteria,
                size: 22,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Industries We Serve
          new Paragraph({
            children: [
              new TextRun({
                text: "Industries We Serve",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: content.industriesWeServe,
                size: 22,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Our Stories
          new Paragraph({
            children: [
              new TextRun({
                text: "Our Stories",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: content.ourStories,
                size: 22,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Footer with searcher names
          new Paragraph({
            children: [
              new TextRun({
                text: `Prepared by: ${searcherNames.join(', ')}`,
                italics: true,
                size: 18,
              }),
            ],
            spacing: { before: 400 },
          }),
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }

  async generateDocxWithTemplate(request: OnePagerRequest, content: OnePagerContent): Promise<Buffer> {
    // Check if template is specified and not basic
    if (request.template && request.template !== 'basic') {
      const templateData: TemplateData = {
        searchFundName: request.searchFundName || 'Search Fund',
        searchFundWebsite: request.searchFundWebsite || '',
        searchFundLogo: request.searchFundLogo,
        searchFundAddress: request.searchFundAddress,
        searchFundEmail: request.searchFundEmail,
        searcherProfiles: request.searcherProfiles.map(profile => ({
          name: profile.name,
          title: profile.title,
          headshotUrl: profile.headshotUrl
        })),
        content
      };

      return await templateEditorService.editTemplate(request.template, templateData);
    }

    // Fall back to basic template for 'basic' or no template specified
    const searcherNames = request.searcherProfiles.map(profile => profile.name);
    return await this.generateDocx(content, searcherNames);
  }

  async generateIndustryResearchDocx(thesisData: ThesisData): Promise<Buffer> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "Industry Research Report",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),

          // Thesis Name
          new Paragraph({
            children: [
              new TextRun({
                text: "Investment Thesis: " + thesisData.name,
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
          }),

          // Investment Criteria Summary
          new Paragraph({
            children: [
              new TextRun({
                text: "Investment Criteria:",
                bold: true,
                size: 20,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          ...thesisData.criteria.map(criteria => 
            new Paragraph({
              children: [
                new TextRun({
                  text: "• " + criteria.category + ": " + criteria.field + " " + criteria.operator + " " + criteria.value + " (Weight: " + criteria.weight + "%)",
                  size: 18,
                }),
              ],
              spacing: { after: 100 },
            })
          ),

          // Placeholder for AI-generated content
          new Paragraph({
            children: [
              new TextRun({
                text: "This document will be populated with AI-generated industry research content.",
                italics: true,
                size: 16,
              }),
            ],
            spacing: { after: 400 },
          }),
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }

  async generateIndustryResearchWithAI(thesisData: ThesisData, selectedIndustry?: string): Promise<Buffer> {
    try {
      console.log('=== INDUSTRY RESEARCH GENERATION START ===');
      console.log('Thesis Name:', thesisData.name);
      console.log('Selected Industry from parameter:', selectedIndustry);
      console.log('Selected Industry type:', typeof selectedIndustry);
      console.log('Selected Industry is null/undefined?', selectedIndustry === null || selectedIndustry === undefined);

      if (!selectedIndustry) {
        throw new Error('selectedIndustry is required but was not provided');
      }

      const prompt = this.createIndustryResearchPrompt(thesisData, selectedIndustry);
      console.log('=== PROMPT BEING SENT ===');
      console.log(prompt);
      console.log('=== END PROMPT ===');

      // Use the comprehensive prompt with detailed requirements
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior private equity research analyst at a top-tier firm.

CRITICAL INSTRUCTIONS:
1. Write ONLY about ${selectedIndustry} - no other industries
2. Be EXTREMELY detailed and specific
3. Use REAL company names, REAL deal names, REAL data
4. Include specific M&A transactions with buyer/seller names and deal values
5. Cite EVERY statistic with real sources: (Source: Company/Report Name, Year)
6. Provide deep analysis and insights, not superficial summaries
7. Think like you're presenting this to a senior partner who will grill you on every detail
8. Focus on ${selectedIndustry} companies and activity in the target geography
9. Use 2024 data wherever possible
10. Be comprehensive - this should be investment-grade research

Your report will be evaluated on:
- Specificity (real companies, real deals, real numbers)
- Depth of analysis (why things are happening, not just what)
- Citation quality (every statistic must have a real source)
- Actionability (insights that inform investment decisions)
- Comprehensiveness (cover all aspects thoroughly)

Write a report that would impress a senior PE partner.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });

      const researchContent = completion.choices[0]?.message?.content || '';
      console.log('Generated Research Content Length:', researchContent.length);
      console.log('=== AI RESPONSE ===');
      console.log(researchContent);
      console.log('=== END AI RESPONSE ===');

      // Save raw response for debugging
      require('fs').writeFileSync('/tmp/industry-research-raw.txt', researchContent);
      console.log('Raw response saved to /tmp/industry-research-raw.txt');

      // Parse the AI response into structured content
      const parsedContent = this.parseIndustryResearchContent(researchContent);

      // Log parsed sections
      console.log('=== PARSED SECTIONS ===');
      Object.keys(parsedContent).forEach(key => {
        console.log(`${key}: ${parsedContent[key].length} characters`);
      });
      console.log('=== END PARSED SECTIONS ===');

      // Generate the document
      return await this.generateIndustryResearchDocxWithContent(thesisData, parsedContent);

    } catch (error) {
      console.error('Error generating industry research:', error);
      throw new Error('Failed to generate industry research report');
    }
  }

  private createIndustryResearchPrompt(thesisData: ThesisData, selectedIndustry?: string): string {
    if (!selectedIndustry) {
      throw new Error('Selected industry is required');
    }

    // Extract key context from criteria
    const location = thesisData.criteria.find(c => c.category === 'Geographic')?.value || 'United States';
    const ebitda = thesisData.criteria.find(c => c.field?.toLowerCase().includes('ebitda'))?.value || '5M+';
    const growthRate = thesisData.criteria.find(c => c.category === 'Growth Rate')?.value;

    const criteriaContext = thesisData.criteria.map(c =>
      `${c.category}: ${c.field} ${c.operator} ${c.value}`
    ).join('\n');

    return `You are a senior private equity research analyst writing a comprehensive industry report.

TARGET INDUSTRY: ${selectedIndustry}
TARGET GEOGRAPHY: ${location}
TARGET COMPANY SIZE: $${ebitda} EBITDA
${growthRate ? `TARGET GROWTH RATE: ${growthRate}` : ''}

INVESTMENT THESIS CONTEXT:
${thesisData.name}
${criteriaContext}

CRITICAL REQUIREMENTS:
1. Write ONLY about ${selectedIndustry} - no other industries
2. Be HIGHLY SPECIFIC - use real company names, real deals, real data
3. Focus on ${location} when discussing geography, M&A activity, and opportunities
4. Focus on companies in the $${ebitda} EBITDA range
5. Provide ANALYSIS and INSIGHTS, not just facts
6. Include 2024 data and recent developments
7. Cite EVERY statistic with real sources: (Source: Company/Report Name, Year)

DEPTH REQUIREMENTS:
- Don't write generic statements - be specific
- Include actual company examples operating in ${selectedIndustry}
- Reference specific M&A deals in ${selectedIndustry}, especially in ${location}
- Provide your analytical perspective on trends and opportunities
- Explain WHY things are happening, not just WHAT is happening

SECTIONS TO WRITE (all about ${selectedIndustry} in ${location}):

1. INDUSTRY
Write exactly: "${selectedIndustry}"

2. MARKET OVERVIEW (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence analysis of the ${selectedIndustry} market, then provide 8-10 comprehensive bullet points:

Your analysis should cover:
- Current market size and growth trajectory for ${selectedIndustry} in ${location}
- Specific trends shaping ${selectedIndustry} in 2024
- Key market drivers with explanations of WHY they matter
- Market dynamics specific to ${location}

Then provide detailed bullets including:
- Exact market size figures with growth rates (Source: Name, Year)
- ${location}-specific market characteristics and opportunities
- Major players in ${selectedIndustry} operating in ${location} with their market positions
- Specific examples of successful companies in the $${ebitda} EBITDA range
- Customer segments and demand drivers
- Regulatory environment in ${location} affecting ${selectedIndustry}
- Supply-demand dynamics and market saturation levels
- 2024 developments and forward-looking trends

Be specific. Use real data. Cite everything.

3. M&A ACTIVITY AND CONSOLIDATION (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence analysis of consolidation trends, then provide 8-10 detailed bullets:

Your analysis should cover:
- Current fragmentation level and consolidation trends in ${selectedIndustry}
- Why consolidation is or isn't happening in ${selectedIndustry}
- Strategic rationale behind recent M&A activity
- Your perspective on future consolidation opportunities

Then provide detailed bullets including:
- Specific M&A deals in ${selectedIndustry} in ${location} in 2023-2024 with deal values and buyer/seller names (Source: Name, Year)
- Roll-up opportunities and platform company examples
- Private equity activity in ${selectedIndustry} - which firms are active?
- Typical acquisition multiples for companies in the $${ebitda} EBITDA range (Source: Name, Year)
- Competitive landscape and market share concentration
- Strategic vs financial buyer activity
- Cross-border M&A trends affecting ${location}
- Barriers or drivers to further consolidation

Be specific with deal names, company names, and transaction details.

4. BARRIERS TO ENTRY AND DEFENSIBILITY (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence analysis of barriers to entry, then provide 8-10 detailed bullets:

Your analysis should address:
- How high are barriers to entry in ${selectedIndustry}?
- What makes existing players defensible?
- Why this matters for investment returns
- ${location}-specific regulatory or market barriers

Then provide detailed bullets including:
- Specific regulatory requirements in ${location} for ${selectedIndustry} (Source: Name, Year)
- Capital intensity and startup costs with real examples
- Licensing, certification, or compliance requirements
- Technology or intellectual property barriers
- Brand recognition and customer switching costs
- Supplier or distribution relationships required
- Skilled labor requirements and availability in ${location}
- Time to profitability for new entrants

Use specific examples and data.

5. FINANCIAL PROFILE AND UNIT ECONOMICS (for ${selectedIndustry} companies)
Write a detailed 5-6 sentence analysis of the financial characteristics, then provide 8-10 detailed bullets:

Your analysis should cover:
- Typical revenue models and pricing structures in ${selectedIndustry}
- Cash flow characteristics and working capital dynamics
- Profitability benchmarks for companies in the $${ebitda} EBITDA range
- Financial resilience during economic downturns

Then provide detailed bullets including:
- Typical EBITDA margins by company size with specific benchmarks (Source: Name, Year)
- Revenue model details (recurring vs one-time, subscription vs transaction)
- Working capital as % of revenue (Source: Name, Year)
- Capex requirements and intensity
- Seasonality patterns with specific months/quarters
- Customer payment terms and DSO
- Rule of 40 or other key metrics for ${selectedIndustry}
- Example P&L from a representative company in the sector

Be specific with percentages and financial metrics.

6. TECHNOLOGY AND INNOVATION TRENDS (for ${selectedIndustry})
Write a detailed 5-6 sentence analysis of technology trends, then provide 8-10 detailed bullets:

Your analysis should cover:
- How technology is transforming ${selectedIndustry}
- Which companies are leading vs lagging in adoption
- Investment opportunities in technology-enabled businesses
- Disruption risks and defensive strategies

Then provide detailed bullets including:
- Specific technologies being adopted (AI, automation, SaaS tools, etc.) with company examples
- Digital transformation case studies in ${selectedIndustry}
- Technology spend as % of revenue (Source: Name, Year)
- Emerging tech vendors serving ${selectedIndustry}
- Impact on labor costs and productivity
- Customer-facing vs back-office technology adoption
- PropTech/FinTech/HealthTech (as relevant) penetration rates
- Technology-driven competitive advantages

Name specific technology platforms and vendors.

7. INVESTMENT OPPORTUNITY AND VALUE CREATION (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence investment recommendation, then provide 8-10 detailed bullets:

Your analysis should include:
- Why ${selectedIndustry} in ${location} is attractive for PE investment
- Specific value creation levers available
- Risk factors and how to mitigate them
- Target company profiles and acquisition criteria

Then provide detailed bullets including:
- Platform company characteristics to target in ${selectedIndustry}
- Add-on acquisition opportunities and bolt-on targets
- Operational improvement levers with expected impact (e.g., "Pricing optimization: +200-300bps margin")
- Revenue growth strategies specific to ${selectedIndustry}
- Multiple arbitrage opportunities (e.g., buy at 4-5x, sell at 6-7x)
- Exit strategy considerations and potential buyers
- Key success factors for investments in ${selectedIndustry}
- Red flags or risk factors to avoid

Provide actionable investment insights with specific examples.

FINAL INSTRUCTIONS:
- This is a COMPREHENSIVE report - be detailed and specific
- Write ONLY about ${selectedIndustry} in ${location}
- Include specific company names, deal names, and real data points
- Cite EVERY statistic: (Source: Report/Company Name, Year)
- Provide analysis and insights, not just facts
- Think like a senior PE analyst making an investment recommendation
- Use 2024 data wherever possible`;
  }

  private parseIndustryResearchContent(content: string): any {
    // Parse the AI response into structured sections based on new comprehensive format
    const sections = {
      industry: this.extractSection(content, 'Industry'),
      marketOverview: this.extractSection(content, 'Market Overview'),
      consolidationAndCompetitiveLandscape: this.extractSection(content, 'M&A Activity and Consolidation'),
      barriersToEntry: this.extractSection(content, 'Barriers to Entry and Defensibility'),
      cashFlowProfile: this.extractSection(content, 'Financial Profile and Unit Economics'),
      technologyTrends: this.extractSection(content, 'Technology and Innovation Trends'),
      investmentHighlights: this.extractSection(content, 'Investment Opportunity and Value Creation')
    };

    return sections;
  }

  private extractSection(content: string, sectionName: string): string {
    console.log(`Extracting section: ${sectionName}`);

    // Split content into lines
    const lines = content.split('\n');
    let sectionContent: string[] = [];
    let inSection = false;

    // Match either markdown headers (## SECTION) or numbered (2. SECTION)
    const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let sectionHeaderPattern = new RegExp(`^#{1,3}\\s*${escapedName}|^\\d+\\.\\s*${escapedName}`, 'i');
    let nextSectionPattern = /^#{1,3}\s+[A-Z]|^\d+\.\s+[A-Z]/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if we found our section header
      if (sectionHeaderPattern.test(line)) {
        inSection = true;
        console.log(`Found section header: ${line}`);
        continue; // Skip the header itself
      }

      // If we're in the section and hit the next section, stop
      if (inSection && nextSectionPattern.test(line) && !sectionHeaderPattern.test(line)) {
        console.log(`Found next section, stopping: ${line}`);
        break;
      }

      // Collect content if we're in the section
      if (inSection) {
        sectionContent.push(line);
      }
    }

    const extracted = sectionContent.join('\n').trim();
    console.log(`Extracted ${sectionName}, length: ${extracted.length}`);
    return extracted;
  }

  async generateIndustryResearchDocxWithContent(thesisData: ThesisData, content: any): Promise<Buffer> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "Industry Research Report",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),

          // Thesis Name
          new Paragraph({
            children: [
              new TextRun({
                text: "Investment Thesis: " + thesisData.name,
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
          }),

          // Investment Criteria Summary
          new Paragraph({
            children: [
              new TextRun({
                text: "Investment Criteria:",
                bold: true,
                size: 20,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          ...thesisData.criteria.map(criteria => 
            new Paragraph({
              children: [
                new TextRun({
                  text: "• " + criteria.category + ": " + criteria.field + " " + criteria.operator + " " + criteria.value + " (Weight: " + criteria.weight + "%)",
                  size: 18,
                }),
              ],
              spacing: { after: 100 },
            })
          ),

          // Industry Section
          ...this.createSectionParagraphs("Industry", content.industry),
          
          // Market Overview Section
          ...this.createSectionParagraphs("Market Overview", content.marketOverview),

          // M&A Activity and Consolidation Section
          ...this.createSectionParagraphs("M&A Activity and Consolidation", content.consolidationAndCompetitiveLandscape),

          // Barriers to Entry and Defensibility Section
          ...this.createSectionParagraphs("Barriers to Entry and Defensibility", content.barriersToEntry),

          // Financial Profile and Unit Economics Section
          ...this.createSectionParagraphs("Financial Profile and Unit Economics", content.cashFlowProfile),

          // Technology and Innovation Trends Section
          ...this.createSectionParagraphs("Technology and Innovation Trends", content.technologyTrends),

          // Investment Opportunity and Value Creation Section
          ...this.createSectionParagraphs("Investment Opportunity and Value Creation", content.investmentHighlights),
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }

  private createSectionParagraphs(title: string, content: string): Paragraph[] {
    if (!content.trim()) return [];

    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 20,
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      })
    ];

    // Split content into lines and create paragraphs
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: line.trim(),
            size: 18,
          }),
        ],
        spacing: { after: 100 },
      }));
    });

    return paragraphs;
  }
}

// Export the service instance
export const onePagerGenerationService = new OnePagerGenerationService(); 
