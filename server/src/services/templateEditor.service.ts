import { createReport } from 'docx-templates';
import fs from 'fs';
import path from 'path';
import { OnePagerContent } from './onePagerGeneration.service';
const JSZip = require('jszip');

export interface TemplateData {
  searchFundName: string;
  searchFundWebsite: string;
  searchFundLogo?: string;
  searchFundAddress?: string;
  searchFundEmail?: string;
  searcherProfiles: Array<{
    name: string;
    title: string;
    headshotUrl?: string;
  }>;
  content: OnePagerContent;
}

export class TemplateEditorService {
  private templatesPath: string;

  constructor() {
    // Use process.cwd() for more reliable path resolution
    const projectRoot = process.cwd();
    this.templatesPath = path.join(projectRoot, 'equitle-brain-v1/one_pager_templates');

    console.log('TemplateEditorService initialized');
    console.log('process.cwd():', projectRoot);
    console.log('templatesPath:', this.templatesPath);
    console.log('templatesPath exists:', fs.existsSync(this.templatesPath));

    // If not found, try alternative paths
    if (!fs.existsSync(this.templatesPath)) {
      const altPath = path.join(__dirname, '../../../equitle-brain-v1/one_pager_templates');
      console.log('Trying alternative path:', altPath);
      if (fs.existsSync(altPath)) {
        this.templatesPath = altPath;
        console.log('Using alternative path');
      }
    }
  }

  async editTemplate(templateName: string, data: TemplateData): Promise<Buffer> {
    const templatePath = path.join(this.templatesPath, `${templateName}.docx`);

    console.log('editTemplate called with templateName:', templateName);
    console.log('Full template path:', templatePath);
    console.log('Template file exists:', fs.existsSync(templatePath));
    console.log('Data structure:', JSON.stringify(data, null, 2));

    if (!fs.existsSync(templatePath)) {
      console.error(`Template file not found: ${templatePath}`);
      try {
        console.error(`Templates directory contents:`, fs.readdirSync(this.templatesPath));
      } catch (e) {
        console.error(`Could not read templates directory:`, e.message);
      }
      throw new Error(`Template ${templateName} not found at ${templatePath}. Please ensure the template file exists.`);
    }

    try {
      console.log('Reading template file...');
      // Read the template file
      const templateBuffer = fs.readFileSync(templatePath);
      console.log('Template file read successfully, size:', templateBuffer.length);

      // Use direct text replacement in DOCX XML
      console.log('Performing direct text replacement in DOCX...');
      const modifiedBuffer = await this.replaceTextInDocx(templateBuffer, data);
      console.log('Text replacement completed successfully');

      return modifiedBuffer;
    } catch (error) {
      console.error('=== TEMPLATE EDITING ERROR ===');
      console.error('Template name:', templateName);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error details:', error);
      console.error('==============================');
      throw new Error(`Failed to edit template ${templateName}: ${error.message}`);
    }
  }

  private async replaceTextInDocx(templateBuffer: Buffer, data: any): Promise<Buffer> {
    try {
      // Load the DOCX file as a ZIP
      const zip = await JSZip.loadAsync(templateBuffer);

      // Get the document.xml file which contains the main content
      const documentXml = await zip.file('word/document.xml')?.async('string');
      if (!documentXml) {
        throw new Error('Could not find document.xml in template');
      }

      console.log('Original document.xml length:', documentXml.length);
      
      // Debug: Extract and log some text content to see what's in the template
      const textContent = documentXml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log('Template text content (first 500 chars):', textContent.substring(0, 500));
      
      // Look for common placeholders in the template
      const placeholderPatterns = [
        /\[[A-Z_]+\]/g,
        /SEARCH_FUND_NAME/gi,
        /WEBSITE/gi,
        /EMAIL/gi,
        /ADDRESS/gi,
        /SEARCHER/gi,
        /Why Work With Us/gi,
        /Investment Criteria/gi,
        /Industries We Serve/gi,
        /Our Stories?/gi
      ];
      
      for (const pattern of placeholderPatterns) {
        const matches = documentXml.match(pattern);
        if (matches && matches.length > 0) {
          console.log(`Found placeholders matching ${pattern}:`, matches.slice(0, 10));
        }
      }

      // Perform text replacements
      let modifiedXml = documentXml;

      // Helper to escape XML special characters
      const escapeXml = (text: string): string => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      // Helper to create a text run in Word XML format
      const createTextRun = (text: string): string => {
        const lines = text.split('\n');
        return lines.map((line, index) => {
          const escapedLine = escapeXml(line);
          if (index < lines.length - 1) {
            return `<w:r><w:t xml:space="preserve">${escapedLine}</w:t></w:r><w:r><w:br/></w:r>`;
          }
          return `<w:r><w:t xml:space="preserve">${escapedLine}</w:t></w:r>`;
        }).join('');
      };

      // Perform direct text replacements for the actual placeholders in the template
      const replacements: Record<string, string> = {
        // Search fund information - using the actual placeholders from the template
        '{searchFundName}': data.searchFundName || 'Search Fund',
        '{searchFundWebsite}': data.searchFundWebsite || '',
        '{searchFundEmail}': data.searchFundEmail || '',
        '{searchFundAddress}': data.searchFundAddress || '',
        
        // Content sections - using the actual placeholders from the template
        '{whyWorkWithUs}': data.content?.whyWorkWithUs || '',
        '{investmentCriteria}': data.content?.investmentCriteria || '',
        '{industriesWeServe}': data.content?.industriesWeServe || '',
        '{ourStories}': data.content?.ourStories || '',
        '{ourStory}': data.content?.ourStories || '',
        
        // Searcher information - these might not be in the template but good to have
        '{searcher1Name}': data.searcherProfiles?.[0]?.name || '',
        '{searcher2Name}': data.searcherProfiles?.[1]?.name || '',
        '{searcher1Title}': data.searcherProfiles?.[0]?.title || '',
        '{searcher2Title}': data.searcherProfiles?.[1]?.title || '',
      };

      console.log('Performing text replacements...');
      console.log('Available replacements:', Object.keys(replacements));
      for (const [placeholder, content] of Object.entries(replacements)) {
        console.log(`Processing placeholder: ${placeholder}, content: ${content ? content.substring(0, 50) : 'undefined'}`);
        if (content && content.trim()) {
          const escapedContent = escapeXml(content);
          
          // Simple direct replacement
          const beforeLength = modifiedXml.length;
          modifiedXml = modifiedXml.split(placeholder).join(escapedContent);
          
          if (modifiedXml.length !== beforeLength) {
            console.log(`Replaced placeholder: ${placeholder} with: ${content.substring(0, 50)}...`);
          }
        }
      }


      console.log('Modified document.xml length:', modifiedXml.length);

      // Update the ZIP with the modified document.xml
      zip.file('word/document.xml', modifiedXml);

      // Generate the modified DOCX buffer
      const modifiedBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE'
      });

      return modifiedBuffer;
    } catch (error) {
      console.error('Error in replaceTextInDocx:', error);
      throw error;
    }
  }

  private prepareTemplateData(data: TemplateData): any {
    return {
      // Search Fund Information - common placeholders
      searchFundName: data.searchFundName || 'Search Fund',
      searchFundWebsite: data.searchFundWebsite || '',
      searchFundAddress: data.searchFundAddress || '',
      searchFundEmail: data.searchFundEmail || '',
      
      // Content sections - common placeholders
      whyWorkWithUs: data.content.whyWorkWithUs || '',
      investmentCriteria: data.content.investmentCriteria || '',
      industriesWeServe: data.content.industriesWeServe || '',
      ourStories: data.content.ourStories || '',
      
      // Searcher profiles - for multiple searchers
      searchers: data.searcherProfiles.map((searcher, index) => ({
        name: searcher.name,
        title: searcher.title,
        headshotUrl: searcher.headshotUrl,
        headshot: this.getImageData(searcher.headshotUrl),
        index: index + 1
      })),
      
      // Individual searcher data (for templates that expect single searcher)
      searcherName: data.searcherProfiles[0]?.name || '',
      searcherTitle: data.searcherProfiles[0]?.title || '',
      searcherHeadshot: data.searcherProfiles[0]?.headshotUrl || '',
      searcherHeadshotData: this.getImageData(data.searcherProfiles[0]?.headshotUrl),
      
      // Search fund logo
      searchFundLogo: data.searchFundLogo || '',
      searchFundLogoData: this.getImageData(data.searchFundLogo),
      
      // Contact information for footer
      contactInfo: this.buildContactInfo(data),
      
      // Helper functions for template
      hasMultipleSearchers: data.searcherProfiles.length > 1,
      searcherCount: data.searcherProfiles.length,
      
      // Additional common placeholders that might be in templates
      companyName: data.searchFundName || 'Search Fund',
      website: data.searchFundWebsite || '',
      email: data.searchFundEmail || '',
      address: data.searchFundAddress || '',
      
      // Content placeholders with different naming conventions
      whyWorkWithUsText: data.content.whyWorkWithUs || '',
      investmentCriteriaText: data.content.investmentCriteria || '',
      industriesWeServeText: data.content.industriesWeServe || '',
      ourStoriesText: data.content.ourStories || '',
      
      // Team information
      teamStories: data.content.ourStories || '',
      teamConnection: data.content.ourStories || ''
    };
  }

  private getImageData(imageUrl?: string): any {
    if (!imageUrl) return null;
    
    try {
      // Convert URL to file path if it's a local URL
      let filePath = imageUrl;
      if (imageUrl.startsWith('http://localhost:4001')) {
        filePath = imageUrl.replace('http://localhost:4001', path.join(__dirname, '../uploads'));
      }
      
      if (fs.existsSync(filePath)) {
        const imageBuffer = fs.readFileSync(filePath);
        return {
          width: 100,
          height: 100,
          data: imageBuffer,
          type: 'png' // or determine from file extension
        };
      }
    } catch (error) {
      console.warn('Could not load image:', imageUrl, error);
    }
    
    return null;
  }

  private buildContactInfo(data: TemplateData): string {
    const contactParts: string[] = [];
    
    if (data.searchFundWebsite) {
      contactParts.push(`Website: ${data.searchFundWebsite}`);
    }
    if (data.searchFundEmail) {
      contactParts.push(`Email: ${data.searchFundEmail}`);
    }
    if (data.searchFundAddress) {
      contactParts.push(`Address: ${data.searchFundAddress}`);
    }
    
    return contactParts.join(' | ');
  }

}

export const templateEditorService = new TemplateEditorService();
