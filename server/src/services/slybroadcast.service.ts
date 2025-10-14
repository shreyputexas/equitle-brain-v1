import FormData from 'form-data';
import fs from 'fs';
import logger from '../utils/logger';

export interface SlybroadcastConfig {
  email: string;
  password: string;
}

export interface VoicemailDeliveryRequest {
  phoneNumbers: string[];
  mp3FilePath: string;
  callerIdNumber?: string;
  callerIdName?: string;
  title?: string;
}

export interface DeliveryResult {
  success: boolean;
  broadcastId?: string;
  message?: string;
  error?: string;
}

export class SlybroadcastService {
  private email: string;
  private password: string;
  private baseUrl = 'https://www.slybroadcast.com';

  constructor() {
    this.email = process.env.SLYBROADCAST_EMAIL || '';
    this.password = process.env.SLYBROADCAST_PASSWORD || '';

    if (!this.email || !this.password) {
      logger.warn('Slybroadcast credentials not configured. Set SLYBROADCAST_EMAIL and SLYBROADCAST_PASSWORD environment variables.');
    } else {
      logger.info('SlybroadcastService initialized');
    }
  }

  /**
   * Send voicemail campaign to multiple phone numbers
   */
  async sendVoicemailCampaign(request: VoicemailDeliveryRequest): Promise<DeliveryResult> {
    try {
      if (!this.email || !this.password) {
        return {
          success: false,
          error: 'Slybroadcast credentials not configured'
        };
      }

      logger.info('🚀 Starting Slybroadcast voicemail delivery', {
        phoneCount: request.phoneNumbers.length,
        mp3File: request.mp3FilePath,
        title: request.title
      });

      // Check if MP3 file exists
      if (!fs.existsSync(request.mp3FilePath)) {
        return {
          success: false,
          error: 'MP3 file not found'
        };
      }

      // Create form data for Slybroadcast API
      const formData = new FormData();

      // Authentication
      formData.append('c_email', this.email);
      formData.append('c_password', this.password);

      // Campaign details
      formData.append('c_title', request.title || 'Voice Campaign');
      formData.append('c_phone', request.phoneNumbers.join(','));

      // Caller ID (optional)
      if (request.callerIdNumber) {
        formData.append('c_callerid', request.callerIdNumber);
      }
      if (request.callerIdName) {
        formData.append('c_callerid_name', request.callerIdName);
      }

      // Audio file
      formData.append('c_audio', fs.createReadStream(request.mp3FilePath));

      // Send request to Slybroadcast
      const response = await fetch(`${this.baseUrl}/slynew/campaign/voicebroadcast.php`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const responseText = await response.text();

      logger.info('📡 Slybroadcast response received', {
        status: response.status,
        response: responseText.substring(0, 200)
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Slybroadcast API error: ${response.status} - ${responseText}`
        };
      }

      // Parse response (Slybroadcast returns success/error messages in text)
      if (responseText.includes('success') || responseText.includes('Success')) {
        // Extract broadcast ID if available
        const broadcastIdMatch = responseText.match(/broadcast[_\s]*id[:\s]*(\d+)/i);
        const broadcastId = broadcastIdMatch ? broadcastIdMatch[1] : undefined;

        logger.info('✅ Slybroadcast voicemail campaign sent successfully', {
          broadcastId,
          phoneCount: request.phoneNumbers.length
        });

        return {
          success: true,
          broadcastId,
          message: 'Voicemail campaign sent successfully'
        };
      } else {
        return {
          success: false,
          error: `Slybroadcast error: ${responseText}`
        };
      }

    } catch (error) {
      logger.error('❌ Failed to send Slybroadcast voicemail campaign', error);
      return {
        success: false,
        error: `Failed to send voicemail: ${(error as Error).message}`
      };
    }
  }

  /**
   * Test Slybroadcast connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.email || !this.password) {
        logger.warn('Cannot test Slybroadcast - credentials not configured');
        return false;
      }

      // Simple test request to verify credentials
      const formData = new FormData();
      formData.append('c_email', this.email);
      formData.append('c_password', this.password);

      const response = await fetch(`${this.baseUrl}/slynew/campaign/test.php`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      if (response.ok) {
        logger.info('✅ Slybroadcast connection test successful');
        return true;
      } else {
        logger.error('❌ Slybroadcast connection test failed', { status: response.status });
        return false;
      }
    } catch (error) {
      logger.error('❌ Slybroadcast connection test failed', error);
      return false;
    }
  }

  /**
   * Format phone number for Slybroadcast (they expect US format)
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // If it's 11 digits and starts with 1, remove the 1
    if (digits.length === 11 && digits.startsWith('1')) {
      return digits.substring(1);
    }

    // If it's 10 digits, return as-is
    if (digits.length === 10) {
      return digits;
    }

    // Return original if we can't format it
    return phone;
  }

  /**
   * Validate phone numbers for Slybroadcast
   */
  validatePhoneNumbers(phoneNumbers: string[]): { valid: string[], invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    phoneNumbers.forEach(phone => {
      const formatted = this.formatPhoneNumber(phone);
      if (formatted.length === 10 && /^\d{10}$/.test(formatted)) {
        valid.push(formatted);
      } else {
        invalid.push(phone);
      }
    });

    return { valid, invalid };
  }
}