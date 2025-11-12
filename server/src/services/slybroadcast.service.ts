import fs from 'fs';
import logger from '../utils/logger';

export interface SlybroadcastConfig {
  email: string;
  password: string;
}

export interface VoicemailDeliveryRequest {
  phoneNumbers: string[];
  mp3FilePath?: string;
  mp3Url?: string;
  callerIdNumber?: string;
  callerIdName?: string;
  title?: string;
}

export interface IndividualVoicemailRequest {
  phoneNumber: string;
  mp3FilePath?: string;
  mp3Url?: string;
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
   * Send individual voicemail to a single phone number
   */
  async sendIndividualVoicemail(request: IndividualVoicemailRequest): Promise<DeliveryResult> {
    try {
      if (!this.email || !this.password) {
        return {
          success: false,
          error: 'Slybroadcast credentials not configured'
        };
      }

      logger.info('🚀 Sending individual voicemail via Slybroadcast', {
        phoneNumber: request.phoneNumber,
        mp3File: request.mp3FilePath,
        mp3Url: request.mp3Url,
        hasMp3Url: !!request.mp3Url,
        hasMp3FilePath: !!request.mp3FilePath,
        title: request.title
      });

      // Validate phone number
      const { valid: validPhones } = this.validatePhoneNumbers([request.phoneNumber]);
      if (validPhones.length === 0) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      const validPhone = validPhones[0];

      // Create delivery date (immediate delivery)
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

      // Create form data
      const formParams = new URLSearchParams();
      formParams.append('c_uid', this.email);
      formParams.append('c_password', this.password);
      formParams.append('c_phone', validPhone);
      formParams.append('c_date', dateStr);

      // Use external URL if provided (PREFERRED METHOD for Slybroadcast)
      // Slybroadcast API requires publicly accessible URLs, not base64 data
      if (request.mp3Url && request.mp3Url.trim() && request.mp3Url.startsWith('http')) {
        const cleanUrl = request.mp3Url.trim();
        
        // Warn if URL is localhost (won't work for Slybroadcast)
        if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
          logger.error('❌ MP3 URL is localhost - Slybroadcast cannot access it!', {
            mp3Url: cleanUrl,
            phoneNumber: validPhone,
            hint: 'Set BASE_URL or BACKEND_URL environment variable to your production domain'
          });
          return {
            success: false,
            error: `MP3 URL is not publicly accessible (localhost). Please set BASE_URL or BACKEND_URL environment variable. URL: ${cleanUrl}`
          };
        }
        
        formParams.append('c_url', cleanUrl);
        formParams.append('c_audio', 'MP3'); // Required: specify file type
        logger.info('📡 Using MP3 URL for delivery (preferred method)', { 
          mp3Url: cleanUrl,
          urlLength: cleanUrl.length
        });
      } else if (request.mp3FilePath) {
        // Fallback to base64 only if URL is not available
        // NOTE: Base64 method is less reliable - prefer URL method
        logger.warn('⚠️ Using base64 file upload (URL method preferred)', {
          mp3FilePath: request.mp3FilePath,
          reason: 'mp3Url not provided'
        });
        
        if (!fs.existsSync(request.mp3FilePath)) {
          return {
            success: false,
            error: 'MP3 file not found'
          };
        }
        const audioBuffer = fs.readFileSync(request.mp3FilePath);
        const audioBase64 = audioBuffer.toString('base64');
        formParams.append('c_record_audio', audioBase64);
        logger.info('📡 Using MP3 file upload (base64) for delivery', { 
          mp3FilePath: request.mp3FilePath, 
          fileSize: audioBuffer.length 
        });
      } else {
        logger.error('❌ No MP3 URL or file path provided');
        return {
          success: false,
          error: 'Either MP3 URL or MP3 file path is required for Slybroadcast delivery'
        };
      }

      // Caller ID is required by Slybroadcast
      if (!request.callerIdNumber) {
        return {
          success: false,
          error: 'Caller ID number is required for Slybroadcast delivery'
        };
      }
      formParams.append('c_callerID', request.callerIdNumber);

      logger.info('📤 Sending individual voicemail request to Slybroadcast', {
        phoneNumber: validPhone,
        date: dateStr,
        callerID: request.callerIdNumber || 'none'
      });

      // Send request to Slybroadcast
      const response = await fetch(`${this.baseUrl}/gateway/vmb.php`, {
        method: 'POST',
        body: formParams.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Equitle-VoicemailService/1.0'
        }
      });

      const responseText = await response.text();

      logger.info('📡 Slybroadcast individual response received', {
        status: response.status,
        response: responseText.substring(0, 200),
        phoneNumber: validPhone
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Slybroadcast API error: ${response.status} - ${responseText}`
        };
      }

      // Parse response according to Slybroadcast format: "OK session_id=XXXXXXXXX number of phone=X"
      if (responseText.startsWith('OK')) {
        const sessionIdMatch = responseText.match(/session_id=(\w+)/i);
        const sessionId = sessionIdMatch ? sessionIdMatch[1] : undefined;
        const phoneCountMatch = responseText.match(/number of phone=(\d+)/i);
        const phoneCount = phoneCountMatch ? phoneCountMatch[1] : '1';

        logger.info('✅ Individual voicemail sent successfully', {
          sessionId,
          phoneNumber: validPhone,
          phoneCount
        });

        return {
          success: true,
          broadcastId: sessionId,
          message: `Voicemail sent successfully. Session ID: ${sessionId}`
        };
      } else {
        // Check for specific error messages
        let errorMessage = responseText;
        if (responseText.includes('ERROR')) {
          errorMessage = `Slybroadcast API error: ${responseText}`;
        } else if (responseText.includes('Bad Audio')) {
          errorMessage = `Audio file error: ${responseText}. Check that your MP3 file is publicly accessible and > 5 seconds long.`;
        } else if (responseText.includes('Invalid')) {
          errorMessage = `Invalid request: ${responseText}. Check credentials and parameters.`;
        }

        logger.error('❌ Slybroadcast delivery failed', {
          phoneNumber: validPhone,
          response: responseText
        });

        return {
          success: false,
          error: errorMessage
        };
      }

    } catch (error) {
      logger.error('❌ Failed to send individual voicemail', error);
      return {
        success: false,
        error: `Failed to send voicemail: ${(error as Error).message}`
      };
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
        mp3Url: request.mp3Url,
        title: request.title
      });

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

      // Create URL-encoded form data (as expected by their API)
      const formParams = new URLSearchParams();
      formParams.append('c_uid', this.email);
      formParams.append('c_password', this.password);
      formParams.append('c_phone', request.phoneNumbers.join(','));
      formParams.append('c_date', dateStr);

      // Use public URL if provided (preferred method for Slybroadcast)
      if (request.mp3Url) {
        formParams.append('c_url', request.mp3Url);
        formParams.append('c_audio', 'MP3'); // Required: specify file type
        logger.info('📡 Using MP3 URL for bulk delivery', { mp3Url: request.mp3Url });
      } else if (request.mp3FilePath) {
        // Fallback to file upload if URL not provided
        if (!fs.existsSync(request.mp3FilePath)) {
          return {
            success: false,
            error: 'MP3 file not found'
          };
        }
        // Read the audio file as base64
        const audioBuffer = fs.readFileSync(request.mp3FilePath);
        const audioBase64 = audioBuffer.toString('base64');
        formParams.append('c_record_audio', audioBase64);
        logger.info('📡 Using MP3 file upload for bulk delivery', { mp3FilePath: request.mp3FilePath, fileSize: audioBuffer.length });
      } else {
        return {
          success: false,
          error: 'Either MP3 URL or MP3 file path is required for Slybroadcast delivery'
        };
      }

      // Caller ID is required
      if (!request.callerIdNumber) {
        return {
          success: false,
          error: 'Caller ID number is required for Slybroadcast delivery'
        };
      }
      formParams.append('c_callerID', request.callerIdNumber);

      // Debug log the form data
      logger.info('📤 Sending URL-encoded form data to Slybroadcast', {
        email: this.email,
        phoneNumbers: request.phoneNumbers.join(','),
        date: dateStr,
        callerID: request.callerIdNumber || 'none',
        mp3Url: request.mp3Url,
        mp3FilePath: request.mp3FilePath
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

      // Parse response according to Slybroadcast format: "OK session_id=XXXXXXXXX number of phone=X"
      if (responseText.startsWith('OK')) {
        const sessionIdMatch = responseText.match(/session_id=(\w+)/i);
        const sessionId = sessionIdMatch ? sessionIdMatch[1] : undefined;
        const phoneCountMatch = responseText.match(/number of phone=(\d+)/i);
        const phoneCount = phoneCountMatch ? phoneCountMatch[1] : request.phoneNumbers.length.toString();

        logger.info('✅ Slybroadcast voicemail campaign sent successfully', {
          sessionId,
          phoneCount
        });

        return {
          success: true,
          broadcastId: sessionId,
          message: `Voicemail campaign sent successfully. Session ID: ${sessionId}, Phones: ${phoneCount}`
        };
      } else {
        let errorMessage = responseText;
        if (responseText.includes('ERROR')) {
          errorMessage = `Slybroadcast API error: ${responseText}`;
        } else if (responseText.includes('Bad Audio')) {
          errorMessage = `Audio file error: ${responseText}. Check that your MP3 file is publicly accessible and > 5 seconds long.`;
        }

        return {
          success: false,
          error: errorMessage
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

  /**
   * Send personalized voicemails to multiple contacts
   */
  async sendPersonalizedVoicemails(requests: IndividualVoicemailRequest[]): Promise<{
    successful: Array<{ phoneNumber: string; broadcastId?: string }>;
    failed: Array<{ phoneNumber: string; error: string }>;
  }> {
    const successful: Array<{ phoneNumber: string; broadcastId?: string }> = [];
    const failed: Array<{ phoneNumber: string; error: string }> = [];

    logger.info('🚀 Starting batch personalized voicemail delivery', {
      totalRequests: requests.length
    });

    for (const request of requests) {
      try {
        const result = await this.sendIndividualVoicemail(request);

        if (result.success) {
          successful.push({
            phoneNumber: request.phoneNumber,
            broadcastId: result.broadcastId
          });
          logger.info('✅ Voicemail sent successfully', {
            phoneNumber: request.phoneNumber,
            broadcastId: result.broadcastId
          });
        } else {
          failed.push({
            phoneNumber: request.phoneNumber,
            error: result.error || 'Unknown error'
          });
          logger.error('❌ Voicemail failed', {
            phoneNumber: request.phoneNumber,
            error: result.error
          });
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failed.push({
          phoneNumber: request.phoneNumber,
          error: (error as Error).message
        });
        logger.error('❌ Voicemail request failed with exception', {
          phoneNumber: request.phoneNumber,
          error: (error as Error).message
        });
      }
    }

    logger.info('🏁 Batch voicemail delivery completed', {
      successful: successful.length,
      failed: failed.length,
      total: requests.length
    });

    return { successful, failed };
  }
}