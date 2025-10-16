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
  private baseUrl = 'https://www.mobile-sphere.com';

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

      // Required date parameter (immediate delivery)
      const now = new Date();
      const easternTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(now);

      const dateStr = `${easternTime.find(p => p.type === 'month')?.value}/${easternTime.find(p => p.type === 'day')?.value}/${easternTime.find(p => p.type === 'year')?.value} ${easternTime.find(p => p.type === 'hour')?.value}:${easternTime.find(p => p.type === 'minute')?.value}`;

      // Read the audio file as base64
      const audioBuffer = fs.readFileSync(request.mp3FilePath);
      const audioBase64 = audioBuffer.toString('base64');

      // Create URL-encoded form data (as expected by their API)
      const formParams = new URLSearchParams();
      formParams.append('c_uid', this.email);
      formParams.append('c_password', this.password);
      formParams.append('c_phone', request.phoneNumbers.join(','));
      formParams.append('c_date', dateStr);

      // Try using c_record_audio with base64 data instead of c_url
      formParams.append('c_record_audio', audioBase64);

      if (request.callerIdNumber) {
        formParams.append('c_callerID', request.callerIdNumber);
      }

      // Debug log the form data
      logger.info('📤 Sending URL-encoded form data to Slybroadcast', {
        email: this.email,
        phoneNumbers: request.phoneNumbers.join(','),
        date: dateStr,
        callerID: request.callerIdNumber || 'none',
        audioFile: request.mp3FilePath,
        audioSize: audioBuffer.length,
        base64Length: audioBase64.length
      });

      // Send request to Slybroadcast with URL-encoded form data
      const response = await fetch(`${this.baseUrl}/gateway/vmb.php`, {
        method: 'POST',
        body: formParams.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Equitle-VoicemailService/1.0'
        }
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

      // Slybroadcast doesn't have a dedicated test endpoint
      // We'll just check if credentials are configured
      logger.info('✅ Slybroadcast credentials are configured and ready');
      return true;
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