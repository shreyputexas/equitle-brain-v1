import OpenAI from 'openai';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import fs from 'fs';
import path from 'path';
import { templateEditorService, TemplateData, IndustryTemplateData } from './templateEditor.service';

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

   ⚠️ ⚠️ ⚠️ ABSOLUTE REQUIREMENT - READ CAREFULLY ⚠️ ⚠️ ⚠️

   YOU MUST ONLY WRITE ABOUT THE INDUSTRIES LISTED IN THE THESIS CRITERIA.
   DO NOT MENTION ANY OTHER INDUSTRIES. PERIOD.

   FORBIDDEN - DO NOT MENTION:
   - Consulting
   - Technology / Tech / SaaS / Software
   - Finance / Banking / Private Equity
   - Any industry from the searcher's background
   - Any industry not explicitly in the thesis

   REQUIRED - ONLY MENTION:
   - The exact industries listed in the thesis criteria
   - Nothing else

   STRUCTURE:
   1. State ONLY the thesis industries: "We are looking to invest in [thesis industry 1], [thesis industry 2], and [thesis industry 3]"
   2. For each thesis industry, explain the skills that apply to THAT industry (don't say where skills came from)
   3. Talk about why you're excited about THOSE SPECIFIC thesis industries

   DO NOT say things like:
   ❌ "Our background in consulting..."
   ❌ "Our experience in technology..."
   ❌ "Though our careers have been in..."
   ❌ "We worked in [any industry]..."

   ONLY talk about:
   ✅ The thesis industries
   ✅ Skills and expertise (without mentioning source industries)
   ✅ Why these thesis industries are exciting

   **EXAMPLES OF CORRECT RESPONSES:**

   Example 1 - If thesis industries are: Manufacturing, Industrial Services, Distribution
   "We are looking to invest in manufacturing, industrial services, and distribution businesses. Our expertise in operational optimization and process improvement positions us to drive significant value in these sectors. We understand supply chain dynamics, margin enhancement strategies, and the operational levers that matter most in manufacturing and distribution. We're excited about the resilience and cash flow characteristics of these industries, and we see tremendous opportunity to implement best practices that unlock growth and profitability."

   Example 2 - If thesis industries are: Healthcare Services, Medical Practices
   "We are targeting healthcare services and medical practices. Our skills in scaling operations, optimizing unit economics, and building high-performing teams translate directly to growing healthcare businesses. We understand the unique regulatory environment, reimbursement models, and operational challenges in healthcare services. We're passionate about improving patient outcomes while building sustainable, profitable businesses in this essential and growing sector."

   Example 3 - If thesis industries are: Business Services, Professional Services
   "We are seeking opportunities in business services and professional services. Our expertise in evaluating recurring revenue models, assessing competitive positioning, and identifying operational leverage opportunities makes us well-suited for this sector. We understand what drives value in service businesses—customer retention, employee productivity, and scalable delivery models. We're excited to partner with businesses in professional services and help them scale systematically while maintaining quality and margins."

   ⚠️ REMINDER: Only mention thesis industries. Never mention background industries. ⚠️

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

      // Map template names to actual file names
      let templateName = request.template;
      if (templateName === 'navy' || templateName === 'industry_navy') {
        templateName = 'industry_navy_placeholders';
      } else if (templateName === 'personal_navy') {
        templateName = 'personal_navy_placeholders';
      }
      
      console.log('Using template name:', templateName);
      return await templateEditorService.editTemplate(templateName, templateData);
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

  async generateBasicDocument(thesisData: ThesisData, selectedIndustry: string): Promise<Buffer> {
    try {
      console.log('=== BASIC DOCUMENT GENERATION START ===');
      console.log('Thesis Name:', thesisData.name);
      console.log('Selected Industry:', selectedIndustry);

      if (!selectedIndustry) {
        throw new Error('selectedIndustry is required');
      }

      // Extract key context from thesis criteria
      const location = thesisData.criteria.find(c => c.category === 'Geographic')?.value || 'United States';
      const ebitda = thesisData.criteria.find(c => c.field?.toLowerCase().includes('ebitda'))?.value || '5M+';
      const growthRate = thesisData.criteria.find(c => c.category === 'Growth Rate')?.value;

      const criteriaContext = thesisData.criteria.map(c =>
        `${c.category}: ${c.field} ${c.operator} ${c.value}`
      ).join('\n');

      // Create the prompt using the user's template
      const prompt = `You are a senior private equity research analyst writing a comprehensive industry report.

TARGET INDUSTRY: ${selectedIndustry}
TARGET GEOGRAPHY: ${location}
TARGET COMPANY SIZE: ${ebitda} EBITDA
${growthRate ? `TARGET GROWTH RATE: ${growthRate}` : ''}

INVESTMENT THESIS CONTEXT:
${thesisData.name}
${criteriaContext}

CRITICAL REQUIREMENTS:
1. Write ONLY about ${selectedIndustry} - no other industries
2. Be HIGHLY SPECIFIC - use real company names, real deals, real data
3. Focus on ${location} when discussing geography, M&A activity, and opportunities
4. Focus on companies in the ${ebitda} EBITDA range
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
Write a detailed 5-6 sentence analysis of the ${selectedIndustry} market, then provide 8-10 comprehensive bullet points.

3. M&A ACTIVITY AND CONSOLIDATION (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence analysis of consolidation trends, then provide 8-10 detailed bullets.

4. BARRIERS TO ENTRY AND DEFENSIBILITY (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence analysis of barriers to entry, then provide 8-10 detailed bullets.

5. FINANCIAL PROFILE AND UNIT ECONOMICS (for ${selectedIndustry} companies)
Write a detailed 5-6 sentence analysis of the financial characteristics, then provide 8-10 detailed bullets.

6. TECHNOLOGY AND INNOVATION TRENDS (for ${selectedIndustry})
Write a detailed 5-6 sentence analysis of technology trends, then provide 8-10 detailed bullets.

7. INVESTMENT OPPORTUNITY AND VALUE CREATION (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence investment recommendation, then provide 8-10 detailed bullets.

FINAL INSTRUCTIONS:
- This is a COMPREHENSIVE report - be detailed and specific
- Write ONLY about ${selectedIndustry} in ${location}
- Include specific company names, deal names, and real data points
- Cite EVERY statistic: (Source: Report/Company Name, Year)
- Provide analysis and insights, not just facts
- Think like a senior PE analyst making an investment recommendation
- Use 2024 data wherever possible`;

      console.log('=== PROMPT BEING SENT ===');
      console.log(prompt);
      console.log('=== END PROMPT ===');

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior private equity research analyst at a top-tier firm. Write comprehensive, detailed industry research reports with specific data, company names, and actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });

      const generatedContent = completion.choices[0]?.message?.content || '';
      console.log('Generated Content Length:', generatedContent.length);
      console.log('=== CONTENT PREVIEW (First 2000 chars) ===');
      console.log(generatedContent.substring(0, 2000));
      console.log('=== END PREVIEW ===');

      // Create a simple Word document with the generated content
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
                  text: `Investment Thesis: ${thesisData.name}`,
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            // Target Industry
            new Paragraph({
              children: [
                new TextRun({
                  text: `Target Industry: ${selectedIndustry}`,
                  bold: true,
                  size: 20,
                }),
              ],
              spacing: { after: 200 },
            }),

            // Generated content
            ...this.parseContentIntoParagraphs(generatedContent),
          ],
        }],
      });

      console.log('=== BASIC DOCUMENT GENERATION COMPLETE ===');
      return await Packer.toBuffer(doc);

    } catch (error) {
      console.error('Error generating basic document:', error);
      throw new Error('Failed to generate basic document');
    }
  }

  private parseContentIntoParagraphs(content: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        // Empty line - add spacing
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 100 },
        }));
        continue;
      }

      // Check if it's a heading (starts with ## or #)
      if (trimmedLine.startsWith('##')) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine.replace(/^#+\s*/, ''),
              bold: true,
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        }));
      } else if (trimmedLine.startsWith('#')) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine.replace(/^#+\s*/, ''),
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 300 },
        }));
      } else if (trimmedLine.match(/^\d+\.\s+[A-Z]/)) {
        // Numbered section heading
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              bold: true,
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        }));
      } else {
        // Regular paragraph
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        }));
      }
    }

    return paragraphs;
  }

  /**
   * Generate industry research content using OpenAI
   * Extracted from generateBasicDocument for reusability
   */
  private async generateIndustryResearchContent(
    thesisData: ThesisData,
    selectedIndustry: string
  ): Promise<string> {
    try {
      console.log('=== GENERATING INDUSTRY RESEARCH CONTENT ===');
      console.log('Thesis Name:', thesisData.name);
      console.log('Selected Industry:', selectedIndustry);

      if (!selectedIndustry) {
        throw new Error('selectedIndustry is required');
      }

    // Extract key context from thesis criteria
    const location = thesisData.criteria.find(c => c.category === 'Geographic')?.value || 'United States';
    const ebitda = thesisData.criteria.find(c => c.field?.toLowerCase().includes('ebitda'))?.value || '5M+';
    const growthRate = thesisData.criteria.find(c => c.category === 'Growth Rate')?.value;

    const criteriaContext = thesisData.criteria.map(c =>
      `${c.category}: ${c.field} ${c.operator} ${c.value}`
    ).join('\n');

    // Create the prompt
    const prompt = `You are a senior private equity research analyst writing a comprehensive industry report.

TARGET INDUSTRY: ${selectedIndustry}
TARGET GEOGRAPHY: ${location}
TARGET COMPANY SIZE: ${ebitda} EBITDA
${growthRate ? `TARGET GROWTH RATE: ${growthRate}` : ''}

INVESTMENT THESIS CONTEXT:
${thesisData.name}
${criteriaContext}

CRITICAL REQUIREMENTS:
1. Write ONLY about ${selectedIndustry} - no other industries
2. Be HIGHLY SPECIFIC - use real company names, real deals, real data
3. Focus on ${location} when discussing geography, M&A activity, and opportunities
4. Focus on companies in the ${ebitda} EBITDA range
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
Write a detailed 5-6 sentence analysis of the ${selectedIndustry} market, then provide 8-10 comprehensive bullet points.

3. M&A ACTIVITY AND CONSOLIDATION (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence analysis of consolidation trends, then provide 8-10 detailed bullets.

4. BARRIERS TO ENTRY AND DEFENSIBILITY (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence analysis of barriers to entry, then provide 8-10 detailed bullets.

5. FINANCIAL PROFILE AND UNIT ECONOMICS (for ${selectedIndustry} companies)
Write a detailed 5-6 sentence analysis of the financial characteristics, then provide 8-10 detailed bullets.

6. TECHNOLOGY AND INNOVATION TRENDS (for ${selectedIndustry})
Write a detailed 5-6 sentence analysis of technology trends, then provide 8-10 detailed bullets.

7. INVESTMENT OPPORTUNITY AND VALUE CREATION (for ${selectedIndustry} in ${location})
Write a detailed 5-6 sentence investment recommendation, then provide 8-10 detailed bullets.

FINAL INSTRUCTIONS:
- This is a COMPREHENSIVE report - be detailed and specific
- Write ONLY about ${selectedIndustry} in ${location}
- Include specific company names, deal names, and real data points
- Cite EVERY statistic: (Source: Report/Company Name, Year)
- Provide analysis and insights, not just facts
- Think like a senior PE analyst making an investment recommendation
- Use 2024 data wherever possible`;

    console.log('Calling OpenAI API for industry research content...');

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a senior private equity research analyst at a top-tier firm. Write comprehensive, detailed industry research reports with specific data, company names, and actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 8000
    });

      const generatedContent = completion.choices[0]?.message?.content || '';
      console.log('Generated Content Length:', generatedContent.length);

      // Save to file for debugging
      const fs = require('fs');
      const debugFile = `/tmp/ai-content-${Date.now()}.txt`;
      fs.writeFileSync(debugFile, generatedContent);
      console.log('🔍 AI content saved to:', debugFile);
      console.log('=== INDUSTRY RESEARCH CONTENT GENERATION COMPLETE ===');

      return generatedContent;
    } catch (error) {
      console.error('=== ERROR IN generateIndustryResearchContent ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
      console.error('===================================================');
      throw new Error(`Failed to generate industry research content: ${error.message}`);
    }
  }

  /**
   * Parse AI-generated content into structured sections for template replacement
   */
  private parseIndustryContent(
    content: string,
    selectedIndustry: string
  ): IndustryTemplateData {
    console.log('=== PARSING INDUSTRY CONTENT ===');
    console.log('Content preview (first 500 chars):');
    console.log(content.substring(0, 500));
    console.log('...');
    console.log('Searching for section headers...');

    const lines = content.split('\n');
    const sections: Record<string, string[]> = {
      industry: [],
      marketOverview: [],
      industryConsolidation: [],
      entryBarrier: [],
      financialProfile: [],
      technology: [],
      investmentInsight: [],
      sources: []
    };

    let currentSection = '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Detect section headers - support both numbered (1.) and markdown (##) formats
      if (trimmedLine.match(/^(#+\s+|1\.?\s+)?(#\s+)?Home Healthcare Services$/i)) {
        currentSection = 'industry';
        continue;
      } else if (trimmedLine.match(/^(##\s+|2\.?\s+)?MARKET[\s\-]+OVERVIEW/i)) {
        currentSection = 'marketOverview';
        continue;
      } else if (trimmedLine.match(/^(##\s+|3\.?\s+)?(M&A|M\s*&\s*A)[\s\-]+(ACTIVITY|CONSOLIDATION)/i)) {
        currentSection = 'industryConsolidation';
        continue;
      } else if (trimmedLine.match(/^(##\s+|4\.?\s+)?BARRIERS?[\s\-]+TO[\s\-]+ENTRY/i)) {
        currentSection = 'entryBarrier';
        continue;
      } else if (trimmedLine.match(/^(##\s+|5\.?\s+)?FINANCIAL[\s\-]+PROFILE/i)) {
        currentSection = 'financialProfile';
        continue;
      } else if (trimmedLine.match(/^(##\s+|6\.?\s+)?(TECHNOLOGY|INNOVATION|TECHNOLOGY\s+AND\s+INNOVATION)/i)) {
        currentSection = 'technology';
        continue;
      } else if (trimmedLine.match(/^(\*\*)?(\d+\.?\s+)?(##\s+)?(INVESTMENT\s+OPPORTUNITY\s+AND\s+VALUE\s+CREATION|INVESTMENT\s+OPPORTUNITY|INVESTMENT|VALUE\s+CREATION|VALUE)/i)) {
        currentSection = 'investmentInsight';
        continue;
      }

      // Add content to current section
      if (currentSection && trimmedLine) {
        sections[currentSection].push(trimmedLine);
      }
    }

    // Build the structured data
    const parsedData: IndustryTemplateData = {
      industry: selectedIndustry,
      marketOverview: sections.marketOverview.join('\n'),
      industryConsolidation: sections.industryConsolidation.join('\n'),
      entryBarrier: sections.entryBarrier.join('\n'),
      financialProfile: sections.financialProfile.join('\n'),
      technology: sections.technology.join('\n'),
      investmentInsight: sections.investmentInsight.join('\n'),
      sources: sections.sources.join('\n')
    };

    console.log('Parsed sections:');
    console.log('- Industry:', parsedData.industry);
    console.log('- Market Overview length:', parsedData.marketOverview.length);
    console.log('- Consolidation length:', parsedData.industryConsolidation.length);
    console.log('- Entry Barrier length:', parsedData.entryBarrier.length);
    console.log('- Financial Profile length:', parsedData.financialProfile.length);
    console.log('- Technology length:', parsedData.technology.length);
    console.log('- Investment Insight length:', parsedData.investmentInsight.length);
    console.log('- Investment Insight content preview:', parsedData.investmentInsight.substring(0, 200));
    
    // If investment insight is empty, try to find it with a more flexible approach
    if (!parsedData.investmentInsight.trim()) {
      console.log('⚠️ Investment Insight section is empty, attempting fallback parsing...');
      
      // Look for any section that might contain investment-related content
      const investmentKeywords = ['investment', 'opportunity', 'value', 'recommendation', 'outlook', 'potential'];
      let fallbackContent = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (investmentKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
          // Found a line with investment keywords, collect content until next section
          let j = i;
          while (j < lines.length && !lines[j].trim().match(/^(#+\s+|[1-9]\.?\s+)/)) {
            if (lines[j].trim()) {
              fallbackContent += lines[j].trim() + '\n';
            }
            j++;
          }
          break;
        }
      }
      
      if (fallbackContent.trim()) {
        parsedData.investmentInsight = fallbackContent.trim();
        console.log('✅ Found investment content via fallback parsing, length:', parsedData.investmentInsight.length);
      } else {
        console.log('❌ No investment content found even with fallback parsing');
      }
    }
    
    console.log('=== PARSING COMPLETE ===');

    return parsedData;
  }

  /**
   * Generate industry research document with optional template support
   * If template is 'navy', uses the industry_navy_placeholders.docx template
   * Otherwise, uses the basic document generation
   */
  async generateIndustryResearchWithTemplate(
    thesisData: ThesisData,
    selectedIndustry: string,
    template?: string,
    searchFundData?: {
      name?: string;
      website?: string;
      email?: string;
      address?: string;
    }
  ): Promise<Buffer> {
    try {
      console.log('=== GENERATE INDUSTRY RESEARCH WITH TEMPLATE ===');
      console.log('Template parameter received:', template);
      console.log('Template type:', typeof template);
      console.log('Industry:', selectedIndustry);
      console.log('Search fund data:', searchFundData);

      // Generate content using OpenAI
      console.log('Step 1: Generating content with OpenAI...');
      const content = await this.generateIndustryResearchContent(thesisData, selectedIndustry);
      console.log('Content generated successfully, length:', content.length);

      // If navy template is requested, use template replacement
      console.log('Checking template value...');
      console.log('  template value:', template);
      console.log('  template === "navy":', template === 'navy');
      console.log('  template === "industry_navy":', template === 'industry_navy');
      console.log('  template === "personal_navy":', template === 'personal_navy');
      console.log('  typeof template:', typeof template);

      if (template === 'navy' || template === 'industry_navy' || template === 'personal_navy') {
        console.log('✅ USING NAVY TEMPLATE PATH');
        console.log('Step 2a: Parsing content into sections...');

        const parsedData = this.parseIndustryContent(content, selectedIndustry);
        console.log('Step 2b: Content parsed successfully');
        console.log('Parsed data keys:', Object.keys(parsedData));
        console.log('Parsed data sample:', {
          industry: parsedData.industry,
          marketOverviewLength: parsedData.marketOverview?.length || 0,
          consolidationLength: parsedData.industryConsolidation?.length || 0,
        });

        const templateData: IndustryTemplateData = {
          ...parsedData,
          searchFundName: searchFundData?.name,
          searchFundWebsite: searchFundData?.website,
          searchFundEmail: searchFundData?.email,
          searchFundAddress: searchFundData?.address,
        };

        console.log('Step 2c: Template data prepared');
        console.log('Search fund data:', {
          name: searchFundData?.name,
          website: searchFundData?.website,
          email: searchFundData?.email,
          address: searchFundData?.address,
        });

        console.log('Step 2d: Calling editIndustryTemplate...');
        // Choose the correct template based on the template type
        const templateName = template === 'personal_navy' ? 'personal_navy_placeholders' : 'industry_navy_placeholders';
        console.log('Using template:', templateName);
        
        // Use the appropriate template service based on template type
        if (template === 'personal_navy') {
          const result = await templateEditorService.editTemplate(templateName, templateData);
          console.log('✅ PERSONAL NAVY TEMPLATE COMPLETED, buffer size:', result.length);
          return result;
        } else {
          const result = await templateEditorService.editIndustryTemplate(templateName, templateData);
          console.log('✅ INDUSTRY NAVY TEMPLATE COMPLETED, buffer size:', result.length);
          return result;
        }
      }

      // Default: use existing basic document generation
      console.log('⚠️ USING BASIC DOCUMENT (template was:', template, ')');
      return await this.generateBasicDocument(thesisData, selectedIndustry);
    } catch (error) {
      console.error('=== ERROR IN generateIndustryResearchWithTemplate ===');
      console.error('Error:', error);
      console.error('Template:', template);
      console.error('Industry:', selectedIndustry);
      console.error('Stack:', error.stack);
      console.error('===================================================');
      throw error;
    }
  }

}

// Export the service instance
export const onePagerGenerationService = new OnePagerGenerationService(); 
