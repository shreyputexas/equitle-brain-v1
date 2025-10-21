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
      const parsed = this.parseContent(content, request);
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
}

export const onePagerGenerationService = new OnePagerGenerationService();
