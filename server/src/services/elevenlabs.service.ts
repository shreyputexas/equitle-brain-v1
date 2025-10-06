// Optional import for elevenlabs-node - will be handled gracefully if not available
let ElevenLabs: any = null;
try {
  ElevenLabs = require('elevenlabs-node');
} catch (error) {
  console.warn('elevenlabs-node not found - voice synthesis features will be disabled');
}
import logger from '../utils/logger';
import { Readable } from 'stream';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface VoiceCloneRequest {
  name: string;
  description?: string;
  audioBuffer: Buffer;
  labels?: Record<string, string>;
}

export interface TTSRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export class ElevenLabsService {
  private apiKey: string;
  private client: any;

  constructor() {
    if (!ElevenLabs) {
      logger.warn('ElevenLabs SDK not available - voice synthesis features disabled');
      this.client = null;
      return;
    }

    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('ELEVENLABS_API_KEY not found - voice synthesis features disabled');
      this.client = null;
      return;
    }

    this.client = new ElevenLabs({
      apiKey: this.apiKey
    });

    logger.info('ElevenLabsService initialized');
  }

  /**
   * Clone a voice from audio sample
   */
  async cloneVoice(name: string, audioBuffer: Buffer, description?: string): Promise<ElevenLabsVoice> {
    if (!this.client) {
      throw new Error('ElevenLabs service not available - SDK not installed or API key not configured');
    }

    try {
      logger.info('Cloning voice with ElevenLabs', { name, audioSize: audioBuffer.length });

      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: this.createFormData(name, audioBuffer, description),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      logger.info('Voice cloned successfully', { voiceId: data.voice_id, name });

      return {
        voice_id: data.voice_id,
        name: name,
        category: 'cloned',
        description: description || 'Custom cloned voice',
        settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      };
    } catch (error) {
      logger.error('Failed to clone voice', error);
      throw new Error(`Failed to clone voice: ${(error as Error).message}`);
    }
  }

  /**
   * Generate speech from text
   */
  async textToSpeech(request: TTSRequest): Promise<Buffer> {
    if (!this.client) {
      throw new Error('ElevenLabs service not available - SDK not installed or API key not configured');
    }

    try {
      logger.info('Generating speech with ElevenLabs', {
        voiceId: request.voice_id,
        textLength: request.text.length
      });

      const voice = ElevenLabs.init({
        apiKey: this.apiKey,
      });

      const response = await voice.textToSpeech({
        voiceId: request.voice_id,
        text: request.text,
        modelId: request.model_id || 'eleven_multilingual_v2',
        voiceSettings: request.voice_settings || {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true
        }
      });

      // Convert response to Buffer
      if (response instanceof Readable) {
        const chunks: Buffer[] = [];
        for await (const chunk of response) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } else if (response instanceof ArrayBuffer) {
        return Buffer.from(response);
      } else if (Buffer.isBuffer(response)) {
        return response;
      } else {
        throw new Error('Unexpected response type from ElevenLabs');
      }
    } catch (error) {
      logger.error('Failed to generate speech', error);
      throw new Error(`Failed to generate speech: ${(error as Error).message}`);
    }
  }

  /**
   * Get all available voices
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.client) {
      throw new Error('ElevenLabs service not available - SDK not installed or API key not configured');
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();

      return data.voices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category || 'premade',
        description: voice.description || '',
        preview_url: voice.preview_url,
        available_for_tiers: voice.available_for_tiers,
        settings: voice.settings ? {
          stability: voice.settings.stability || 0.5,
          similarity_boost: voice.settings.similarity_boost || 0.75,
          style: voice.settings.style || 0.0,
          use_speaker_boost: voice.settings.use_speaker_boost || true
        } : undefined
      }));
    } catch (error) {
      logger.error('Failed to get voices', error);
      return [];
    }
  }

  /**
   * Get specific voice details
   */
  async getVoice(voiceId: string): Promise<ElevenLabsVoice | null> {
    if (!this.client) {
      throw new Error('ElevenLabs service not available - SDK not installed or API key not configured');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const voice = await response.json();

      return {
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category || 'premade',
        description: voice.description || '',
        preview_url: voice.preview_url,
        available_for_tiers: voice.available_for_tiers,
        settings: voice.settings ? {
          stability: voice.settings.stability || 0.5,
          similarity_boost: voice.settings.similarity_boost || 0.75,
          style: voice.settings.style || 0.0,
          use_speaker_boost: voice.settings.use_speaker_boost || true
        } : undefined
      };
    } catch (error) {
      logger.error('Failed to get voice', error);
      return null;
    }
  }

  /**
   * Delete a cloned voice
   */
  async deleteVoice(voiceId: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('ElevenLabs service not available - SDK not installed or API key not configured');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
      });

      if (response.ok) {
        logger.info('Voice deleted successfully', { voiceId });
        return true;
      } else {
        logger.error('Failed to delete voice', { voiceId, status: response.status });
        return false;
      }
    } catch (error) {
      logger.error('Failed to delete voice', error);
      return false;
    }
  }

  /**
   * Edit voice settings
   */
  async editVoice(
    voiceId: string,
    name?: string,
    description?: string,
    settings?: {
      stability: number;
      similarity_boost: number;
      style?: number;
      use_speaker_boost?: boolean;
    }
  ): Promise<ElevenLabsVoice | null> {
    try {
      const body: any = {};

      if (name) body.name = name;
      if (description) body.description = description;
      if (settings) body.settings = settings;

      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}/edit`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const voice = await response.json();

      return {
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category || 'cloned',
        description: voice.description || '',
        settings: voice.settings ? {
          stability: voice.settings.stability || 0.5,
          similarity_boost: voice.settings.similarity_boost || 0.75,
          style: voice.settings.style || 0.0,
          use_speaker_boost: voice.settings.use_speaker_boost || true
        } : undefined
      };
    } catch (error) {
      logger.error('Failed to edit voice', error);
      return null;
    }
  }

  /**
   * Get user subscription info
   */
  async getSubscription(): Promise<any> {
    if (!this.client) {
      throw new Error('ElevenLabs service not available - SDK not installed or API key not configured');
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to get subscription info', error);
      return null;
    }
  }

  /**
   * Test connection to ElevenLabs API
   */
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      logger.warn('ElevenLabs service not available - SDK not installed or API key not configured');
      return false;
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
      });

      if (response.ok) {
        logger.info('ElevenLabs API connection test successful');
        return true;
      } else {
        logger.error('ElevenLabs API connection test failed', { status: response.status });
        return false;
      }
    } catch (error) {
      logger.error('ElevenLabs API connection test failed', error);
      return false;
    }
  }

  /**
   * Create FormData for voice cloning
   */
  private createFormData(name: string, audioBuffer: Buffer, description?: string): FormData {
    const formData = new FormData();

    formData.append('name', name);

    if (description) {
      formData.append('description', description);
    }

    // Create a Blob from the buffer for the audio file
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    formData.append('files', audioBlob, 'voice_sample.wav');

    // Add labels if needed
    const labels = JSON.stringify({
      'use case': 'conversational',
      'accent': 'american'
    });
    formData.append('labels', labels);

    return formData;
  }

  /**
   * Validate audio file for voice cloning
   */
  validateAudioFile(buffer: Buffer): { valid: boolean; error?: string } {
    // Basic validation - check if it's a valid audio file
    if (buffer.length === 0) {
      return { valid: false, error: 'Audio file is empty' };
    }

    if (buffer.length > 25 * 1024 * 1024) { // 25MB limit
      return { valid: false, error: 'Audio file is too large (max 25MB)' };
    }

    // Check for common audio file headers
    const header = buffer.slice(0, 12).toString('hex');
    const isWav = header.startsWith('52494646') && header.includes('57415645');
    const isMp3 = header.startsWith('494433') || header.includes('fffb') || header.includes('fff3');
    const isFlac = header.startsWith('664c6143');
    const isMpeg = header.startsWith('000001ba') || header.startsWith('000001b3');

    if (!isWav && !isMp3 && !isFlac && !isMpeg) {
      return { valid: false, error: 'Unsupported audio format. Please use WAV, MP3, or FLAC' };
    }

    return { valid: true };
  }
}