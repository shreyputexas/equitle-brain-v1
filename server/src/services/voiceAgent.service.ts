import { RetellService, RetellCallAnalytics } from './retell.service';
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
  retellAnalytics?: RetellCallAnalytics;
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
      for (const [_, session] of this.activeSessions.entries()) {
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
            const startTimeMs = callSession.startTime instanceof Date ?
              callSession.startTime.getTime() :
              (callSession.startTime as any).toDate().getTime();
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
          // Convert Firestore Timestamps to JavaScript Dates
          const startTime = data.startTime?.toDate ? data.startTime.toDate() : data.startTime;
          const endTime = data.endTime?.toDate ? data.endTime.toDate() : data.endTime;
          
          // Calculate duration if missing but we have both start and end times
          let duration = data.duration;
          if (!duration && startTime && endTime) {
            const startMs = startTime instanceof Date ? startTime.getTime() : new Date(startTime).getTime();
            const endMs = endTime instanceof Date ? endTime.getTime() : new Date(endTime).getTime();
            duration = endMs - startMs;
          }
          
          return {
            id: doc.id,
            ...data,
            startTime,
            endTime,
            duration, // Use calculated duration if original was missing
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

      const systemPrompt = "You are a professional sales assistant conducting voice calls. Be concise, friendly, and focused on the caller's needs.";

      const response = await this.openaiService.generateResponse(
        systemPrompt,
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

      // Use ElevenLabs voice with custom LLM
      const result = await this.retellService.updateAgent(agentId, {
        name: `Updated Agent ${agentId}`,
        voice: {
          type: 'elevenlabs',
          voice_id: voiceId
        },
        llm: {
          type: 'custom-llm',
          custom_llm_url: process.env.LLM_WEBSOCKET_URL || 'ws://localhost:4001/llm'
        },
        prompt: prompt,
        language: 'en-US',
        responseEngine: {
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
        agent_name: `Agent for ${userId}`,
        voice: {
          type: 'elevenlabs',
          voice_id: voiceId, // Use ElevenLabs voice
        },
        llm: {
          type: 'custom-llm',
          custom_llm_url: process.env.LLM_WEBSOCKET_URL || 'ws://localhost:4001/llm'
        },
        prompt: prompt,
        language: 'en-US',
        response_engine: {
          type: 'retell'
        }
      });

      if (!agent || !agent.agent_id) {
        throw new Error('Failed to create agent: Invalid response from Retell API');
      }

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
      logger.info('🔥 Enhanced call session requested', { callId });

      const callSession = await this.getCallSession(callId);
      if (!callSession) {
        logger.warn('Call session not found', { callId });
        return null;
      }

      logger.info('📋 Base call session retrieved', {
        callId,
        hasRetellCallId: !!callSession.retellCallId,
        retellCallId: callSession.retellCallId
      });

      const enhanced: EnhancedCallSession = { ...callSession };

      // Fetch comprehensive data from Retell API if retellCallId exists
      if (callSession.retellCallId) {
        try {
          logger.info('Fetching Retell analytics for call details', { callId, retellCallId: callSession.retellCallId });

          const retellAnalytics = await this.retellService.getCallAnalytics(callSession.retellCallId);
          if (retellAnalytics) {
            logger.info('Successfully fetched Retell analytics for call details', {
              callId,
              hasTranscript: !!retellAnalytics.transcript,
              sentiment: retellAnalytics.user_sentiment,
              summary: retellAnalytics.call_summary,
              successful: retellAnalytics.call_successful
            });

            logger.info('🔍 Processing Retell sentiment data', {
              callId,
              user_sentiment: retellAnalytics.user_sentiment,
              type: typeof retellAnalytics.user_sentiment
            });

            // Use Retell's sentiment analysis directly
            if (retellAnalytics.user_sentiment && typeof retellAnalytics.user_sentiment === 'string') {
              enhanced.sentiment = retellAnalytics.user_sentiment.toLowerCase() as 'positive' | 'neutral' | 'negative';
              logger.info('✅ Set sentiment from Retell', { callId, sentiment: enhanced.sentiment });
            }

            // Use Retell's call summary directly
            if (retellAnalytics.call_summary && typeof retellAnalytics.call_summary === 'string') {
              enhanced.summary = retellAnalytics.call_summary;
            }

            // Set call outcome based on Retell's call_successful flag
            if (retellAnalytics.call_successful !== undefined && retellAnalytics.call_successful !== null) {
              enhanced.outcome = retellAnalytics.call_successful ? 'interested' : 'not_interested';
            }

            // Use Retell's transcript if available and more complete than local transcript
            if (retellAnalytics.transcript && Array.isArray(retellAnalytics.transcript) && retellAnalytics.transcript.length > 0) {
              const retellTranscriptText = retellAnalytics.transcript
                .filter(entry => entry && entry.role && entry.content)
                .map(entry =>
                  `${entry.role === 'agent' ? 'AI' : 'User'}: ${entry.content}`
                );

              // Use Retell transcript if local one is empty or shorter
              if (!enhanced.transcript || enhanced.transcript.length === 0 ||
                  retellTranscriptText.length > enhanced.transcript.length) {
                enhanced.transcript = retellTranscriptText;
                logger.info('Updated transcript from Retell API', {
                  callId,
                  transcriptLength: retellTranscriptText.length
                });
              }
            }

            // Set recording URL from Retell
            if (retellAnalytics.recording_url) {
              enhanced.recordingUrl = retellAnalytics.recording_url;
            }

            // Set call quality based on latency and success
            if (retellAnalytics.latency?.e2e_latency_p50_ms) {
              // Simple quality score: lower latency = higher quality
              const latency = retellAnalytics.latency.e2e_latency_p50_ms;
              enhanced.callQuality = Math.max(1, Math.min(5, 6 - Math.floor(latency / 1000)));
            }

            // Populate retellMetadata with comprehensive data
            enhanced.retellMetadata = {
              recording_url: retellAnalytics.recording_url,
              call_cost: retellAnalytics.call_cost?.total_cost,
              latency: retellAnalytics.latency,
              transcript_object: retellAnalytics.transcript
            };

            // Update duration if Retell has more accurate data
            if (retellAnalytics.duration_ms && retellAnalytics.duration_ms > 0) {
              enhanced.duration = retellAnalytics.duration_ms;
            }

            // Extract analytics from Retell data
            if (retellAnalytics.transcript && Array.isArray(retellAnalytics.transcript) && retellAnalytics.transcript.length > 0) {
              const validTranscript = retellAnalytics.transcript.filter(t => t && t.role && t.content);
              const agentMessages = validTranscript.filter(t => t.role === 'agent');
              const userMessages = validTranscript.filter(t => t.role === 'user');
              const totalMessages = agentMessages.length + userMessages.length;

              enhanced.analytics = {
                talkRatio: totalMessages > 0 ? (userMessages.length / totalMessages * 100) : 0,
                interruptions: 0, // Could be calculated from transcript timing
                avgResponseTime: 0, // Could be calculated from transcript timing
                wordCount: validTranscript.reduce((sum, t) => {
                  try {
                    return sum + (t.content ? t.content.split(' ').length : 0);
                  } catch {
                    return sum;
                  }
                }, 0),
                keywordMatches: [] // Could extract key business terms
              };
            }
          } else {
            logger.warn('No Retell analytics found for call', { callId, retellCallId: callSession.retellCallId });
          }
        } catch (error) {
          logger.error('Failed to fetch Retell analytics for call details', {
            callId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }

      // Only fall back to OpenAI analysis if we don't have Retell data
      if (!enhanced.sentiment && enhanced.transcript && enhanced.transcript.length > 0) {
        try {
          logger.info('Falling back to OpenAI sentiment analysis', { callId });
          const sentimentResult = await this.openaiService.analyzeSentiment(enhanced.transcript);
          enhanced.sentiment = sentimentResult.sentiment;
          enhanced.sentimentScore = sentimentResult.score;
        } catch (error) {
          logger.warn('Failed to analyze sentiment with OpenAI', { callId, error });
        }
      }

      // Only generate OpenAI summary if we don't have Retell summary
      if (!enhanced.summary && enhanced.transcript && enhanced.transcript.length > 0) {
        try {
          logger.info('Falling back to OpenAI summary generation', { callId });
          const summaryResult = await this.openaiService.generateCallSummary(
            enhanced.transcript,
            { callId, duration: enhanced.duration }
          );
          enhanced.summary = summaryResult.summary;
          enhanced.keyPoints = summaryResult.keyPoints;
          enhanced.actionItems = summaryResult.actionItems;
          enhanced.outcome = summaryResult.outcome as any;
        } catch (error) {
          logger.warn('Failed to generate call summary with OpenAI', { callId, error });
        }
      }

      logger.info('Enhanced call session prepared', {
        callId,
        hasSentiment: !!enhanced.sentiment,
        hasSummary: !!enhanced.summary,
        hasTranscript: !!(enhanced.transcript && enhanced.transcript.length > 0),
        hasRecording: !!enhanced.recordingUrl,
        transcriptLength: enhanced.transcript?.length || 0
      });

      return enhanced;
    } catch (error) {
      logger.error('Failed to get enhanced call session', error);
      return null;
    }
  }

  /**
   * Get call analytics for a user with enriched Retell API data
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

      // Enrich calls with Retell API data
      const enrichedCalls = await this.enrichCallsWithRetellData(calls);
      console.log('🔍 Enriched calls with Retell data, sample:', enrichedCalls.length > 0 ? {
        id: enrichedCalls[0].id,
        hasRetellData: !!enrichedCalls[0].retellAnalytics,
        sentiment: enrichedCalls[0].retellAnalytics?.user_sentiment,
        successful: enrichedCalls[0].retellAnalytics?.call_successful,
        duration: enrichedCalls[0].retellAnalytics?.duration_ms
      } : 'No enriched calls');

      const analytics = this.calculateEnhancedAnalytics(enrichedCalls);
      console.log('🔍 Calculated enhanced analytics:', analytics);

      return analytics;
    } catch (error) {
      logger.error('Failed to get call analytics', error);
      throw error;
    }
  }

  /**
   * Enrich calls with Retell API analytics data
   */
  private async enrichCallsWithRetellData(calls: CallSession[]): Promise<CallSession[]> {
    const enrichedCalls: CallSession[] = [];

    for (const call of calls) {
      try {
        let enrichedCall = { ...call };

        // Only try to fetch Retell data if we have a retellCallId
        if (call.retellCallId) {
          console.log('🔍 Fetching Retell analytics for call:', call.id, 'retellCallId:', call.retellCallId);
          const retellAnalytics = await this.retellService.getCallAnalytics(call.retellCallId);

          if (retellAnalytics) {
            enrichedCall.retellAnalytics = retellAnalytics;

            // Update call data with more accurate Retell information if available
            if (retellAnalytics.duration_ms && retellAnalytics.duration_ms > 0) {
              enrichedCall.duration = retellAnalytics.duration_ms;
            }

            if (retellAnalytics.call_status) {
              // Map Retell statuses to our internal statuses
              const statusMapping: Record<string, string> = {
                'ended': 'completed',
                'ongoing': 'initiated',
                'registered': 'connecting'
              };
              const mappedStatus = statusMapping[retellAnalytics.call_status];
              if (mappedStatus) {
                enrichedCall.status = mappedStatus as 'completed' | 'failed' | 'initiated' | 'connecting' | 'in_progress';
              }
            }

            // Use Retell transcript if available and our local one is empty
            if (retellAnalytics.transcript && retellAnalytics.transcript.length > 0) {
              if (!enrichedCall.transcript || enrichedCall.transcript.length === 0) {
                enrichedCall.transcript = retellAnalytics.transcript.map(entry =>
                  `${entry.role === 'agent' ? 'AI' : 'User'}: ${entry.content}`
                );
              }
            }

            console.log('✅ Enriched call with Retell data:', {
              callId: call.id,
              sentiment: retellAnalytics.user_sentiment,
              successful: retellAnalytics.call_successful,
              duration: retellAnalytics.duration_ms,
              transcriptLength: retellAnalytics.transcript?.length || 0
            });
          } else {
            console.log('⚠️ No Retell analytics found for call:', call.id);
          }
        } else {
          console.log('⚠️ No retellCallId for call:', call.id);
        }

        enrichedCalls.push(enrichedCall);
      } catch (error) {
        logger.error('Failed to enrich call with Retell data', { callId: call.id, error });
        // Add the call without enrichment on error
        enrichedCalls.push(call);
      }
    }

    return enrichedCalls;
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
   * Calculate enhanced analytics from enriched call data with Retell API data
   */
  private calculateEnhancedAnalytics(calls: CallSession[]): CallAnalytics {
    const totalCalls = calls.length;

    // Use Retell's call_successful flag when available, otherwise fall back to duration-based success
    const successfulCalls = calls.filter(call => {
      if (call.retellAnalytics?.call_successful !== undefined) {
        return call.retellAnalytics.call_successful;
      }
      // Fallback to original logic
      return call.status === 'completed' && call.duration && call.duration > 30000;
    }).length;

    // Enhanced status tracking using Retell data
    const callsByStatus = calls.reduce((acc, call) => {
      let status = call.status;

      // Use more accurate Retell status when available
      if (call.retellAnalytics?.call_status) {
        const statusMapping: Record<string, string> = {
          'ended': 'completed',
          'ongoing': 'initiated',
          'registered': 'connecting'
        };
        const mappedStatus = statusMapping[call.retellAnalytics.call_status];
        if (mappedStatus) {
          status = mappedStatus as 'completed' | 'failed' | 'initiated' | 'connecting' | 'in_progress';
        }
      }

      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Enhanced duration calculation using Retell data
    const callsWithDuration = calls.filter(call => {
      const duration = call.retellAnalytics?.duration_ms || call.duration;
      return duration && duration > 0;
    });

    const totalDuration = callsWithDuration.reduce((sum, call) => {
      return sum + (call.retellAnalytics?.duration_ms || call.duration || 0);
    }, 0);

    const averageDuration = callsWithDuration.length > 0 ? totalDuration / callsWithDuration.length : 0;

    // Sentiment distribution from Retell analytics
    const sentimentDistribution = calls.reduce((acc, call) => {
      if (call.retellAnalytics?.user_sentiment) {
        const sentiment = call.retellAnalytics.user_sentiment.toLowerCase();
        acc[sentiment] = (acc[sentiment] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Call outcomes - can be enhanced based on call summaries or custom analysis
    const callsByOutcome = calls.reduce((acc, call) => {
      let outcome = 'unknown';

      // Try to determine outcome from Retell data
      if (call.retellAnalytics?.call_successful === true) {
        outcome = 'interested';
      } else if (call.retellAnalytics?.call_successful === false) {
        if (call.retellAnalytics?.disconnection_reason?.includes('no_answer')) {
          outcome = 'no_answer';
        } else {
          outcome = 'not_interested';
        }
      }

      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Voice profile performance from Retell data
    const voiceProfilePerformance = calls.reduce((acc, call) => {
      if (call.voiceId && call.retellAnalytics) {
        let voiceProfile = acc.find(v => v.voiceId === call.voiceId);

        if (!voiceProfile) {
          voiceProfile = {
            voiceId: call.voiceId,
            voiceName: call.voiceId, // Could be enhanced with voice name mapping
            totalCalls: 0,
            successRate: 0,
            avgDuration: 0,
            avgSentiment: 0
          };
          acc.push(voiceProfile);
        }

        voiceProfile.totalCalls++;

        if (call.retellAnalytics.call_successful) {
          voiceProfile.successRate = (voiceProfile.successRate * (voiceProfile.totalCalls - 1) + 100) / voiceProfile.totalCalls;
        } else {
          voiceProfile.successRate = (voiceProfile.successRate * (voiceProfile.totalCalls - 1)) / voiceProfile.totalCalls;
        }

        const duration = call.retellAnalytics.duration_ms || 0;
        voiceProfile.avgDuration = (voiceProfile.avgDuration * (voiceProfile.totalCalls - 1) + duration) / voiceProfile.totalCalls;

        // Sentiment score mapping
        const sentimentScore = call.retellAnalytics.user_sentiment === 'Positive' ? 1 :
                              call.retellAnalytics.user_sentiment === 'Negative' ? -1 : 0;
        voiceProfile.avgSentiment = (voiceProfile.avgSentiment * (voiceProfile.totalCalls - 1) + sentimentScore) / voiceProfile.totalCalls;
      }

      return acc;
    }, [] as Array<{
      voiceId: string;
      voiceName: string;
      totalCalls: number;
      successRate: number;
      avgDuration: number;
      avgSentiment: number;
    }>);

    // Enhanced trends data with Retell timing information
    const callsByDate = calls.reduce((acc, call) => {
      let callDate: Date | undefined;

      // Use Retell start timestamp if available, otherwise fall back to our startTime
      if (call.retellAnalytics?.start_timestamp) {
        callDate = new Date(call.retellAnalytics.start_timestamp);
      } else if (call.startTime) {
        callDate = new Date(call.startTime);
      }

      if (!callDate) return acc;

      const date = callDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, successful: 0, totalDuration: 0 };
      }

      acc[date].total++;

      // Use Retell success indicator
      if (call.retellAnalytics?.call_successful) {
        acc[date].successful++;
      } else if (!call.retellAnalytics && call.status === 'completed' && call.duration && call.duration > 30000) {
        acc[date].successful++;
      }

      const duration = call.retellAnalytics?.duration_ms || call.duration || 0;
      acc[date].totalDuration += duration;

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

    // Enhanced key metrics
    const avgCallsPerDay = trendsData.length > 0 ? totalCalls / trendsData.length : 0;
    const mostCommonOutcome = Object.entries(callsByOutcome).reduce((a, b) =>
      (callsByOutcome[a[0]] || 0) > (callsByOutcome[b[0]] || 0) ? a : b, ['unknown', 0]
    )[0];

    // Calculate additional metrics from Retell data
    const avgLatency = calls.reduce((sum, call) => {
      return sum + (call.retellAnalytics?.latency?.e2e_latency_p50_ms || 0);
    }, 0) / (calls.filter(call => call.retellAnalytics?.latency?.e2e_latency_p50_ms).length || 1);

    const bestPerformingVoice = voiceProfilePerformance.length > 0
      ? voiceProfilePerformance.reduce((best, current) =>
          current.successRate > best.successRate ? current : best
        ).voiceName
      : 'Unknown';

    return {
      totalCalls,
      successfulCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      averageDuration,
      totalDuration,
      callsByStatus,
      callsByOutcome,
      sentimentDistribution,
      voiceProfilePerformance,
      trendsData,
      keyMetrics: {
        avgCallsPerDay,
        mostCommonOutcome,
        bestPerformingVoice,
        peakCallingHour: this.calculatePeakCallingHour(calls)
      }
    };
  }

  /**
   * Calculate peak calling hour from call data
   */
  private calculatePeakCallingHour(calls: CallSession[]): number {
    const hourCounts: Record<number, number> = {};

    calls.forEach(call => {
      let callDate: Date | undefined;

      if (call.retellAnalytics?.start_timestamp) {
        callDate = new Date(call.retellAnalytics.start_timestamp);
      } else if (call.startTime) {
        callDate = new Date(call.startTime);
      }

      if (callDate) {
        const hour = callDate.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    return Object.entries(hourCounts).reduce((peak, [hour, count]) =>
      count > (hourCounts[peak] || 0) ? parseInt(hour) : peak, 14
    );
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