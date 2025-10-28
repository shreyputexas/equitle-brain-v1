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
  dynamicVariables?: {
    contact_name?: string;
    company_name?: string;
    deal_type?: string;
    investment_range?: string;
    industry_focus?: string;
    custom_instructions?: string;
    caller_name?: string;
    call_objective?: string;
    referral_source?: string;
    calling_company?: string;
  };
  metadata?: any;
}

export interface EnhancedCallSession extends CallSession {
  recordingUrl?: string;
  callQuality?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  outcome?: 'interested' | 'not_interested' | 'callback_requested' | 'more_info_needed' | 'completed' | 'no_answer';
  keyPoints?: string[];
  actionItems?: string[];
  summary?: string;
  retellMetadata?: {
    call_cost?: number;
    latency?: any;
    recording_url?: string;
    transcript_object?: Array<{
      role: 'agent' | 'user';
      content: string;
      timestamp: number;
    }>;
  };
  analytics?: {
    talkRatio?: number; // Percentage of time user vs agent spoke
    interruptions?: number;
    avgResponseTime?: number;
    wordCount?: number;
    keywordMatches?: string[];
  };
}

export interface CallAnalytics {
  totalCalls: number;
  successfulCalls: number;
  successRate: number;
  averageDuration: number;
  totalDuration: number;
  callsByStatus: Record<string, number>;
  callsByOutcome: Record<string, number>;
  sentimentDistribution: Record<string, number>;
  voiceProfilePerformance: Array<{
    voiceId: string;
    voiceName: string;
    totalCalls: number;
    successRate: number;
    avgDuration: number;
    avgSentiment: number;
  }>;
  trendsData: Array<{
    date: string;
    totalCalls: number;
    successfulCalls: number;
    avgDuration: number;
  }>;
  keyMetrics: {
    bestPerformingVoice?: string;
    avgCallsPerDay: number;
    peakCallingHour?: number;
    mostCommonOutcome: string;
  };
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
    dynamicVariables: Record<string, string>,
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
        dynamicVariables,
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

      // Use pre-configured agent with dynamic variables
      const agentId = process.env.RETELL_AGENT_ID;

      if (!agentId) {
        throw new Error('RETELL_AGENT_ID not configured in environment variables');
      }

      logger.info('Using configured agent with dynamic variables', {
        agentId,
        voiceId: callSession.voiceId,
        dynamicVariables
      });

      const retellCall = await this.retellService.createCall({
        phoneNumber,
        agentId,
        dynamicVariables,
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
            // Handle both JavaScript Date and Firestore Timestamp objects
            const startTimeMs = callSession.startTime.getTime ?
              callSession.startTime.getTime() :
              callSession.startTime.toDate().getTime();
            updates.duration = new Date().getTime() - startTimeMs;
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
      // Get all calls for the user first (without orderBy to avoid index requirement)
      const snapshot = await db.collection('voice_calls')
        .where('userId', '==', userId)
        .limit(limit_count * 2) // Get more to account for sorting
        .get();

      // Sort and limit in memory
      const calls = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore Timestamps to JavaScript Dates
            startTime: data.startTime?.toDate ? data.startTime.toDate() : data.startTime,
            endTime: data.endTime?.toDate ? data.endTime.toDate() : data.endTime,
          } as CallSession;
        })
        .sort((a, b) => {
          const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
          const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
          return bTime - aTime; // desc order
        })
        .slice(0, limit_count);

      return calls;
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
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          // Convert Firestore Timestamps to JavaScript Dates
          startTime: data?.startTime?.toDate ? data.startTime.toDate() : data?.startTime,
          endTime: data?.endTime?.toDate ? data.endTime.toDate() : data?.endTime,
        } as CallSession;
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
      logger.info('Updating Retell agent configuration', {
        agentId,
        voiceId,
        promptPreview: prompt.substring(0, 100) + '...',
        promptLength: prompt.length
      });
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

  /**
   * Get enhanced call session with analytics data
   */
  async getEnhancedCallSession(callId: string): Promise<EnhancedCallSession | null> {
    try {
      const callSession = await this.getCallSession(callId);
      if (!callSession) {
        return null;
      }

      const enhanced: EnhancedCallSession = { ...callSession };

      // Fetch additional data from Retell if retellCallId exists
      if (callSession.retellCallId) {
        try {
          const retellCall = await this.retellService.getCall(callSession.retellCallId);
          if (retellCall) {
            enhanced.retellMetadata = {
              recording_url: retellCall.metadata?.recording_url,
              call_cost: retellCall.metadata?.call_cost,
              latency: retellCall.metadata?.latency
            };
            enhanced.recordingUrl = retellCall.metadata?.recording_url;
          }
        } catch (error) {
          logger.warn('Failed to fetch Retell data for call', { callId, error });
        }
      }

      // Generate sentiment analysis if transcript exists
      if (callSession.transcript && callSession.transcript.length > 0) {
        try {
          const sentimentResult = await this.openaiService.analyzeSentiment(callSession.transcript);
          enhanced.sentiment = sentimentResult.sentiment;
          enhanced.sentimentScore = sentimentResult.score;
        } catch (error) {
          logger.warn('Failed to analyze sentiment for call', { callId, error });
        }
      }

      // Generate call summary if not already exists
      if (!enhanced.summary && callSession.transcript && callSession.transcript.length > 0) {
        try {
          const summaryResult = await this.openaiService.generateCallSummary(
            callSession.transcript,
            { callId, duration: callSession.duration }
          );
          enhanced.summary = summaryResult.summary;
          enhanced.keyPoints = summaryResult.keyPoints;
          enhanced.actionItems = summaryResult.actionItems;
          enhanced.outcome = summaryResult.outcome as any;
        } catch (error) {
          logger.warn('Failed to generate call summary', { callId, error });
        }
      }

      return enhanced;
    } catch (error) {
      logger.error('Failed to get enhanced call session', error);
      return null;
    }
  }

  /**
   * Get call analytics for a user
   */
  async getCallAnalytics(userId: string, dateRange?: { start: Date; end: Date }): Promise<CallAnalytics> {
    try {
      let query = db.collection('voice_calls').where('userId', '==', userId);

      if (dateRange) {
        query = query.where('startTime', '>=', dateRange.start)
                     .where('startTime', '<=', dateRange.end);
      }

      console.log('🔍 Querying voice_calls collection for userId:', userId);
      const snapshot = await query.get();
      console.log('🔍 Found', snapshot.docs.length, 'voice calls in database');

      const calls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate ? doc.data().startTime.toDate() : doc.data().startTime,
        endTime: doc.data().endTime?.toDate ? doc.data().endTime.toDate() : doc.data().endTime,
      })) as CallSession[];

      console.log('🔍 Mapped calls:', calls.length > 0 ? calls[0] : 'No calls found');

      const analytics = this.calculateAnalytics(calls);
      console.log('🔍 Calculated analytics:', analytics);

      return analytics;
    } catch (error) {
      logger.error('Failed to get call analytics', error);
      throw error;
    }
  }

  /**
   * Calculate analytics from call data
   */
  private calculateAnalytics(calls: CallSession[]): CallAnalytics {
    const totalCalls = calls.length;
    const successfulCalls = calls.filter(call =>
      call.status === 'completed' && call.duration && call.duration > 30000 // 30 seconds minimum
    ).length;

    const callsByStatus = calls.reduce((acc, call) => {
      acc[call.status] = (acc[call.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedCalls = calls.filter(call => call.status === 'completed');
    const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const averageDuration = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0;

    // Group calls by date for trends
    const callsByDate = calls.reduce((acc, call) => {
      if (!call.startTime) return acc;
      const date = new Date(call.startTime).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, successful: 0, totalDuration: 0 };
      }
      acc[date].total++;
      if (call.status === 'completed' && call.duration && call.duration > 30000) {
        acc[date].successful++;
      }
      acc[date].totalDuration += call.duration || 0;
      return acc;
    }, {} as Record<string, { total: number; successful: number; totalDuration: number }>);

    const trendsData = Object.entries(callsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        totalCalls: data.total,
        successfulCalls: data.successful,
        avgDuration: data.total > 0 ? data.totalDuration / data.total : 0
      }));

    return {
      totalCalls,
      successfulCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      averageDuration,
      totalDuration,
      callsByStatus,
      callsByOutcome: {}, // Will be populated when outcome data is available
      sentimentDistribution: {}, // Will be populated when sentiment data is available
      voiceProfilePerformance: [], // Will be populated when voice profile data is available
      trendsData,
      keyMetrics: {
        avgCallsPerDay: trendsData.length > 0 ? totalCalls / trendsData.length : 0,
        mostCommonOutcome: Object.entries(callsByStatus).reduce((a, b) =>
          callsByStatus[a[0]] > callsByStatus[b[0]] ? a : b, ['', 0]
        )[0]
      }
    };
  }

  /**
   * Batch analyze calls for sentiment and outcomes
   */
  async batchAnalyzeCalls(userId: string, limit: number = 50): Promise<void> {
    try {
      // Get calls that need analysis
      const snapshot = await db.collection('voice_calls')
        .where('userId', '==', userId)
        .where('status', '==', 'completed')
        .limit(limit)
        .get();

      const callsToAnalyze = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as CallSession))
        .filter(call => call.transcript && call.transcript.length > 0);

      logger.info(`Batch analyzing ${callsToAnalyze.length} calls for user ${userId}`);

      // Analyze each call
      for (const call of callsToAnalyze) {
        try {
          const updates: Partial<EnhancedCallSession> = {};

          // Sentiment analysis
          const sentimentResult = await this.openaiService.analyzeSentiment(call.transcript);
          updates.sentiment = sentimentResult.sentiment;
          updates.sentimentScore = sentimentResult.score;

          // Call summary
          const summaryResult = await this.openaiService.generateCallSummary(
            call.transcript,
            { callId: call.id, duration: call.duration }
          );
          updates.summary = summaryResult.summary;
          updates.keyPoints = summaryResult.keyPoints;
          updates.actionItems = summaryResult.actionItems;
          updates.outcome = summaryResult.outcome as any;

          // Update the call in database
          await db.collection('voice_calls').doc(call.id).update(updates);

          logger.info(`Analyzed call ${call.id}`, {
            sentiment: updates.sentiment,
            outcome: updates.outcome
          });

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          logger.error(`Failed to analyze call ${call.id}`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to batch analyze calls', error);
      throw error;
    }
  }
}