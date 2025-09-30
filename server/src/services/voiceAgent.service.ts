import { RetellService } from './retell.service';
import { ElevenLabsService } from './elevenlabs.service';
import { OpenAIService } from './openai.service';
import { db } from '../lib/firebase';
import logger from '../utils/logger';

export interface CallSession {
  id: string;
  userId: string;
  phoneNumber: string;
  status: 'initiated' | 'connecting' | 'in_progress' | 'completed' | 'failed';
  callType: 'live' | 'voicemail';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  transcript: string[];
  retellCallId?: string;
  voiceId?: string;
  aiPrompt: string;
  metadata?: any;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  elevenLabsVoiceId: string;
  userId: string;
  createdAt: Date;
  isDefault: boolean;
}

export interface CallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

export class VoiceAgentService {
  private retellService: RetellService;
  private elevenLabsService: ElevenLabsService;
  private openaiService: OpenAIService;
  private activeSessions: Map<string, CallSession> = new Map();

  constructor() {
    this.retellService = new RetellService();
    this.elevenLabsService = new ElevenLabsService();
    this.openaiService = new OpenAIService();
  }

  /**
   * Initiate a new voice call
   */
  async initiateCall(
    userId: string,
    phoneNumber: string,
    callType: 'live' | 'voicemail',
    aiPrompt: string,
    voiceId?: string
  ): Promise<CallResult> {
    try {
      logger.info('Initiating voice call', { userId, phoneNumber, callType });

      // Create call session in Firebase
      const callSession: Partial<CallSession> = {
        userId,
        phoneNumber,
        status: 'initiated',
        callType,
        aiPrompt,
        voiceId: voiceId || await this.getDefaultVoiceId(userId),
        transcript: [],
        startTime: new Date(),
        metadata: {
          platform: 'retell',
          model: 'gpt-4o'
        }
      };

      const docRef = await db.collection('voice_calls').add(callSession);
      const callId = docRef.id;

      callSession.id = callId;
      this.activeSessions.set(callId, callSession as CallSession);

      // Update existing agent or create new one
      logger.info('Getting agent ID for call', { 
        hasExistingAgent: !!process.env.RETELL_AGENT_ID, 
        voiceId: callSession.voiceId 
      });
      
      const agentId = process.env.RETELL_AGENT_ID
        ? await this.updateRetellAgent(process.env.RETELL_AGENT_ID, aiPrompt, callSession.voiceId!)
        : await this.getOrCreateRetellAgent(userId, aiPrompt, callSession.voiceId!);
        
      logger.info('Using agent ID for call', { agentId });
      const retellCall = await this.retellService.createCall({
        phoneNumber,
        agentId,
        metadata: { callId, userId }
      });

      // Update call session with Retell call ID
      await db.collection('voice_calls').doc(callId).update({
        retellCallId: retellCall.call_id,
        status: 'connecting'
      });

      this.activeSessions.get(callId)!.retellCallId = retellCall.call_id;
      this.activeSessions.get(callId)!.status = 'connecting';

      logger.info('Voice call initiated successfully', { callId, retellCallId: retellCall.call_id });

      return { success: true, callId };
    } catch (error) {
      logger.error('Failed to initiate voice call', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Handle call status updates from Retell webhooks
   */
  async handleCallUpdate(retellCallId: string, status: string, transcript?: string): Promise<void> {
    try {
      // Find the call session by Retell call ID
      let callSession: CallSession | undefined;
      for (const session of this.activeSessions.values()) {
        if (session.retellCallId === retellCallId) {
          callSession = session;
          break;
        }
      }

      if (!callSession) {
        // Try to find in database
        const snapshot = await db.collection('voice_calls')
          .where('retellCallId', '==', retellCallId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          callSession = { id: doc.id, ...doc.data() } as CallSession;
        } else {
          logger.warn('Call session not found for Retell call ID', { retellCallId });
          return;
        }
      }

      const updates: Partial<CallSession> = {};

      // Update status based on Retell status
      switch (status) {
        case 'ongoing':
          updates.status = 'in_progress';
          break;
        case 'ended':
          updates.status = 'completed';
          updates.endTime = new Date();
          if (callSession.startTime) {
            updates.duration = new Date().getTime() - callSession.startTime.getTime();
          }
          break;
        case 'failed':
          updates.status = 'failed';
          updates.endTime = new Date();
          break;
      }

      // Add transcript update if provided
      if (transcript) {
        updates.transcript = [...(callSession.transcript || []), transcript];
      }

      // Update database
      await db.collection('voice_calls').doc(callSession.id).update(updates);

      // Update active session
      if (this.activeSessions.has(callSession.id)) {
        Object.assign(this.activeSessions.get(callSession.id)!, updates);

        // Remove from active sessions if call ended
        if (status === 'ended' || status === 'failed') {
          this.activeSessions.delete(callSession.id);
        }
      }

      logger.info('Call status updated', { callId: callSession.id, status, transcript: !!transcript });
    } catch (error) {
      logger.error('Failed to handle call update', error);
    }
  }

  /**
   * Get call history for a user
   */
  async getCallHistory(userId: string, limit_count: number = 50): Promise<CallSession[]> {
    try {
      const snapshot = await db.collection('voice_calls')
        .where('userId', '==', userId)
        .orderBy('startTime', 'desc')
        .limit(limit_count)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallSession));
    } catch (error) {
      logger.error('Failed to get call history', error);
      return [];
    }
  }

  /**
   * Get a specific call session
   */
  async getCallSession(callId: string): Promise<CallSession | null> {
    try {
      // Check active sessions first
      if (this.activeSessions.has(callId)) {
        return this.activeSessions.get(callId)!;
      }

      // Query database
      const docSnapshot = await db.collection('voice_calls').doc(callId).get();
      if (docSnapshot.exists) {
        return { id: docSnapshot.id, ...docSnapshot.data() } as CallSession;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get call session', error);
      return null;
    }
  }

  /**
   * Generate conversation response using OpenAI
   */
  async generateResponse(callId: string, userMessage: string): Promise<string> {
    try {
      const callSession = await this.getCallSession(callId);
      if (!callSession) {
        throw new Error('Call session not found');
      }

      const response = await this.openaiService.generateResponse(
        callSession.aiPrompt,
        callSession.transcript,
        userMessage
      );

      // Add to transcript
      await this.updateTranscript(callId, `User: ${userMessage}`, `AI: ${response}`);

      return response;
    } catch (error) {
      logger.error('Failed to generate response', error);
      throw error;
    }
  }

  /**
   * Update call transcript
   */
  async updateTranscript(callId: string, ...messages: string[]): Promise<void> {
    try {
      const callSession = await this.getCallSession(callId);
      if (!callSession) {
        return;
      }

      const updatedTranscript = [...callSession.transcript, ...messages];

      await db.collection('voice_calls').doc(callId).update({
        transcript: updatedTranscript
      });

      if (this.activeSessions.has(callId)) {
        this.activeSessions.get(callId)!.transcript = updatedTranscript;
      }
    } catch (error) {
      logger.error('Failed to update transcript', error);
    }
  }

  /**
   * Update existing Retell agent with new configuration
   */
  private async updateRetellAgent(agentId: string, prompt: string, voiceId: string): Promise<string> {
    try {
      logger.info('Updating Retell agent configuration', { agentId, voiceId });
      logger.info('Using Single Prompt Agent with Retell built-in LLM for reliable voice');

      // Use Single Prompt Agent with Retell's built-in LLM
      const result = await this.retellService.updateAgent(agentId, {
        voice: {
          type: 'retell',
          voice_id: 'Sophia', // Use Retell's built-in voice
        },
        llm: {
          type: 'retell',
        },
        prompt: prompt,
        language: 'en-US',
        response_engine: {
          type: 'retell'
        }
      });

      if (result) {
        logger.info('Agent updated successfully with Retell voice', { agentId, result });
      } else {
        logger.warn('Agent update returned null - this might indicate an issue', { agentId });
      }
      
      return agentId;
    } catch (error) {
      logger.error('Failed to update Retell agent', error);
      // Don't throw error - continue with existing agent
      logger.warn('Continuing with existing agent configuration despite update failure');
      return agentId;
    }
  }

  /**
   * Get or create a Retell agent for the user
   */
  private async getOrCreateRetellAgent(userId: string, prompt: string, voiceId: string): Promise<string> {
    try {
      // For now, create a new agent for each call
      // In production, you might want to reuse agents or cache them
      const agent = await this.retellService.createAgent({
        voice: {
          type: 'retell',
          voice_id: 'Sophia', // Use Retell's built-in voice
        },
        llm: {
          type: 'retell',
        },
        prompt: prompt,
        language: 'en-US',
        response_engine: {
          type: 'retell'
        }
      });

      return agent.agent_id;
    } catch (error) {
      logger.error('Failed to create Retell agent', error);
      throw error;
    }
  }

  /**
   * Get default voice ID for user
   */
  private async getDefaultVoiceId(userId: string): Promise<string> {
    try {
      const snapshot = await db.collection('voice_profiles')
        .where('userId', '==', userId)
        .where('isDefault', '==', true)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const voiceProfile = snapshot.docs[0].data() as VoiceProfile;
        return voiceProfile.elevenLabsVoiceId;
      }

      // Return ElevenLabs default voice if no custom voice found
      return 'EXAVITQu4vr4xnSDxMaL'; // Sarah - a valid ElevenLabs voice
    } catch (error) {
      logger.error('Failed to get default voice ID', error);
      return 'EXAVITQu4vr4xnSDxMaL'; // Sarah - a valid ElevenLabs voice
    }
  }

  /**
   * Create voice profile from voice sample
   */
  async createVoiceProfile(
    userId: string,
    name: string,
    description: string,
    audioBuffer: Buffer,
    isDefault: boolean = false
  ): Promise<VoiceProfile> {
    try {
      // Clone voice using ElevenLabs
      const elevenLabsVoice = await this.elevenLabsService.cloneVoice(name, audioBuffer);

      // If this is set as default, unset other default voices
      if (isDefault) {
        const snapshot = await db.collection('voice_profiles')
          .where('userId', '==', userId)
          .where('isDefault', '==', true)
          .get();
        for (const doc of snapshot.docs) {
          await doc.ref.update({ isDefault: false });
        }
      }

      // Create voice profile in Firebase
      const voiceProfile: Omit<VoiceProfile, 'id'> = {
        name,
        description,
        elevenLabsVoiceId: elevenLabsVoice.voice_id,
        userId,
        createdAt: new Date(),
        isDefault
      };

      const docRef = await db.collection('voice_profiles').add(voiceProfile);

      return { id: docRef.id, ...voiceProfile };
    } catch (error) {
      logger.error('Failed to create voice profile', error);
      throw error;
    }
  }

  /**
   * Get voice profiles for user
   */
  async getVoiceProfiles(userId: string): Promise<VoiceProfile[]> {
    try {
      const snapshot = await db.collection('voice_profiles')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VoiceProfile));
    } catch (error) {
      logger.error('Failed to get voice profiles', error);
      return [];
    }
  }
}