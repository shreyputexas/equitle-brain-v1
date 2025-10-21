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

  /**
   * Normalize placeholders that may be split across multiple <w:t> elements
   * Word sometimes splits text like {searchFundWebsite} across multiple runs
   */
  private normalizePlaceholders(xml: string): string {
    let normalized = xml;

    // Step 1: Merge consecutive <w:t> elements within the same run
    // This fixes split placeholders like <w:t>{search</w:t><w:t>Fund</w:t><w:t>Website}</w:t>
    const mergePattern = /<w:t([^>]*)>([^<]*)<\/w:t>\s*<w:t([^>]*)>([^<]*)<\/w:t>/g;

    let previousLength = 0;
    while (normalized.length !== previousLength) {
      previousLength = normalized.length;
      normalized = normalized.replace(mergePattern, (match, attr1, text1, attr2, text2) => {
        const hasPreserve = attr1.includes('xml:space="preserve"') || attr2.includes('xml:space="preserve"');
        const attrs = hasPreserve ? ' xml:space="preserve"' : attr1 || attr2;
        return `<w:t${attrs}>${text1}${text2}</w:t>`;
      });
    }

    // Step 2: Merge text across runs that might contain placeholder fragments
    // This is trickier - we need to find text that looks like it's split across runs
    // Pattern: <w:t>text1</w:t></w:r><w:r><w:t>text2</w:t> -> merge to <w:t>text1text2</w:t>
    // But we can't just remove tags - we need to merge the content

    // For now, skip this step as it's causing issues - the within-run merging should be enough
    // The issue is that we'd need to track and merge actual text content across runs
    // which is complex. Let's rely on the first normalization step.

    return normalized;
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

      // Perform text replacements
      let modifiedXml = documentXml;

      // First, normalize placeholders that may be split across XML elements
      console.log('Normalizing split placeholders in XML...');
      modifiedXml = this.normalizePlaceholders(modifiedXml);

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

      console.log('=== PERFORMING TEXT REPLACEMENTS ===');
      console.log('Available replacements:', Object.keys(replacements));
      console.log('Data values being used:');
      console.log('- searchFundName:', data.searchFundName);
      console.log('- searchFundWebsite:', data.searchFundWebsite);
      console.log('- searchFundAddress:', data.searchFundAddress);
      console.log('- searchFundEmail:', data.searchFundEmail);

      for (const [placeholder, content] of Object.entries(replacements)) {
        if (content && content.trim()) {
          const escapedContent = escapeXml(content);

          // Check if placeholder exists in the document
          const exists = modifiedXml.includes(placeholder);

          if (exists) {
            // Simple direct replacement (now that placeholders are normalized)
            const beforeLength = modifiedXml.length;
            modifiedXml = modifiedXml.split(placeholder).join(escapedContent);

            if (modifiedXml.length !== beforeLength) {
              console.log(`✅ Successfully replaced: ${placeholder} -> "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
            }
          } else {
            console.log(`⚠️ Placeholder not found in document: ${placeholder}`);
          }
        } else {
          console.log(`⏭️ Skipping empty placeholder: ${placeholder}`);
        }
      }
      console.log('=== TEXT REPLACEMENT COMPLETE ===');


      console.log('Modified document.xml length:', modifiedXml.length);

      // Update the ZIP with the modified document.xml FIRST
      zip.file('word/document.xml', modifiedXml);

      // Handle image replacements (may further modify document.xml for 2nd headshot)
      console.log('Processing image replacements...');
      console.log('Data structure for images:', JSON.stringify(data, null, 2));
      console.log('Searcher profiles for images:', data.searcherProfiles);
      await this.replaceImages(zip, data);

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

  private async replaceImages(zip: any, data: TemplateData): Promise<void> {
    try {
      console.log('=== STARTING IMAGE REPLACEMENT PROCESS ===');
      console.log('Starting image replacement process...');
      
      // Get searcher headshots
      const searcherProfiles = data.searcherProfiles || [];
      console.log(`Found ${searcherProfiles.length} searcher profiles`);
      
      if (searcherProfiles.length === 0) {
        console.log('No searcher profiles found, skipping image replacement');
        return;
      }
      
      // Image mapping logic for navy_blue template:
      // Header: image2.png (rId1) = Logo (TOP)
      // Our Story: image1.png (rId8, used 2x) = First headshot (BOTTOM)
      // Our Story: image3.png (rId13, needs to be added) = Second headshot (BOTTOM)
      // Note: rId9-rId12 already exist in template, so use rId13

      // First, handle the search fund logo (image2.png in header)
      if (data.searchFundLogo) {
        console.log(`Processing search fund logo: ${data.searchFundLogo}`);
        const logoBuffer = await this.downloadImage(data.searchFundLogo);
        if (logoBuffer) {
          zip.file('word/media/image2.png', logoBuffer);
          console.log('Successfully replaced image2.png with search fund logo (header/top)');
        } else {
          console.log('Failed to download search fund logo');
        }
      } else {
        console.log('No search fund logo provided');
      }

      // Then, handle searcher headshots (image1.png and image3.png for bottom section)
      // First headshot goes in image1.png (existing, used 2x in template)
      if (searcherProfiles.length > 0 && searcherProfiles[0].headshotUrl) {
        const searcher = searcherProfiles[0];
        console.log(`Processing image1.png for first searcher: ${searcher.name}`);
        try {
          const imageBuffer = await this.downloadImage(searcher.headshotUrl);
          if (imageBuffer) {
            zip.file('word/media/image1.png', imageBuffer);
            console.log(`Successfully replaced image1.png with headshot for ${searcher.name}`);
          }
        } catch (error) {
          console.error(`Error processing first headshot:`, error);
        }
      }

      // Second headshot needs to go in image3.png AND we need to update the XML to use it
      if (searcherProfiles.length > 1 && searcherProfiles[1].headshotUrl) {
        const searcher = searcherProfiles[1];
        console.log(`Processing image3.png for second searcher: ${searcher.name}`);
        try {
          const imageBuffer = await this.downloadImage(searcher.headshotUrl);
          if (imageBuffer) {
            // Add image3.png to media folder
            zip.file('word/media/image3.png', imageBuffer);
            console.log(`Successfully added image3.png with headshot for ${searcher.name}`);

            // Update document.xml to use rId13 for second instance
            // This will replace the 2nd occurrence of rId8 with rId13
            const documentXml = await zip.file('word/document.xml').async('string');
            let count = 0;
            const updatedXml = documentXml.replace(/r:embed="rId8"/g, (match) => {
              count++;
              if (count === 2) {
                return 'r:embed="rId13"'; // Replace 2nd instance with rId13 (rId9-12 already exist)
              }
              return match;
            });
            zip.file('word/document.xml', updatedXml);

            // Add new relationship for rId13 -> image3.png
            const relsXml = await zip.file('word/_rels/document.xml.rels').async('string');
            const newRel = '<Relationship Id="rId13" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image3.png"/>';
            const updatedRels = relsXml.replace('</Relationships>', newRel + '</Relationships>');
            zip.file('word/_rels/document.xml.rels', updatedRels);

            console.log('Updated document.xml and relationships for second headshot');
          }
        } catch (error) {
          console.error(`Error processing second headshot:`, error);
        }
      }

      console.log('=== IMAGE REPLACEMENT PROCESS COMPLETED ===');
    } catch (error) {
      console.error('=== ERROR IN IMAGE REPLACEMENT ===');
      console.error('Error in replaceImages:', error);
      // Don't throw error - continue with text-only replacement if images fail
    }
  }

  private async downloadImage(imageUrl: string): Promise<Buffer | null> {
    try {
      console.log(`Loading image from: ${imageUrl}`);
      
      // Handle both HTTP URLs and local file paths
      if (imageUrl.startsWith('http')) {
        // HTTP download
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.error(`Failed to download image: ${response.status} ${response.statusText}`);
          return null;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`Image downloaded successfully, size: ${buffer.length} bytes`);
        return buffer;
      } else {
        // Local file system
        const fs = require('fs');
        const path = require('path');
        
        // Convert URL to local file path
        let filePath = imageUrl;
        
        // Handle different URL formats
        if (imageUrl.startsWith('/uploads/')) {
          filePath = path.join(process.cwd(), imageUrl);
        } else if (imageUrl.startsWith('uploads/')) {
          filePath = path.join(process.cwd(), imageUrl);
        } else if (imageUrl.startsWith('http://localhost:4001/uploads/')) {
          // Convert localhost URL to local file path
          const relativePath = imageUrl.replace('http://localhost:4001', '');
          filePath = path.join(process.cwd(), relativePath);
        } else if (imageUrl.startsWith('http://localhost:4001')) {
          // Convert localhost URL to local file path
          const relativePath = imageUrl.replace('http://localhost:4001', '');
          filePath = path.join(process.cwd(), relativePath);
        }
        
        console.log(`Reading local file: ${filePath}`);
      
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          // Try alternative paths
          const altPath = path.join(process.cwd(), 'server', imageUrl);
          console.log(`Trying alternative path: ${altPath}`);
          if (fs.existsSync(altPath)) {
            filePath = altPath;
          } else {
            return null;
          }
        }
        
        const buffer = fs.readFileSync(filePath);
        console.log(`Local image loaded successfully, size: ${buffer.length} bytes`);
        return buffer;
      }
    } catch (error) {
      console.error(`Error loading image: ${error.message}`);
      return null;
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
      whyWorkWithUs: data.content?.whyWorkWithUs || '',
      investmentCriteria: data.content?.investmentCriteria || '',
      industriesWeServe: data.content?.industriesWeServe || '',
      ourStories: data.content?.ourStories || '',
      
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
      whyWorkWithUsText: data.content?.whyWorkWithUs || '',
      investmentCriteriaText: data.content?.investmentCriteria || '',
      industriesWeServeText: data.content?.industriesWeServe || '',
      ourStoriesText: data.content?.ourStories || '',
      
      // Team information
      teamStories: data.content?.ourStories || '',
      teamConnection: data.content?.ourStories || ''
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
