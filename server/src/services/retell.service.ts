import Retell from 'retell-sdk';
import logger from '../utils/logger';

export interface CallData {
  call_id: string;
  status: string;
  phone_number: string;
  agent_id: string;
  metadata?: Record<string, any>;
}

export interface CallSession {
  call_id: string;
  status: string;
  phoneNumber: string;
  agentId: string;
  fromNumber?: string;
  toNumber?: string;
  direction?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  cost?: number;
  recordingUrl?: string;
  metadata?: Record<string, any>;
}

export interface CallAnalytics {
  total_calls: number;
  success_rate: number;
  avg_duration: number;
  total_cost: number;
  calls_by_day: Array<{ date: string; count: number }>;
  top_agents: Array<{ agent_id: string; calls: number }>;
}

export interface RetellCallAnalytics {
  call_id: string;
  call_status: string;
  call_type: 'phone_call' | 'web_call';
  agent_id: string;
  duration_ms?: number;
  disconnection_reason?: string;
  from_number?: string;
  to_number?: string;
  direction?: string;
  call_analysis?: {
    call_summary?: string;
    in_voicemail?: boolean;
    user_sentiment?: string;
    call_successful?: boolean;
  };
  // Plain text transcript string
  transcript_text?: string;
  
  // Structured transcript array with timestamps and word-level data
  transcript?: Array<{
    role: 'agent' | 'user';
    content: string;
    timestamp?: number;
    words?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
  
  // Transcript with tool call invocations weaved in
  transcript_with_tool_calls?: Array<{
    role: 'agent' | 'user' | 'tool';
    content: string;
    timestamp?: number;
    words?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
    tool_calls?: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
    tool_results?: Array<{
      tool_call_id: string;
      content: string;
    }>;
  }>;
  
  // Scrubbed transcript without PII
  scrubbed_transcript_with_tool_calls?: Array<{
    role: 'agent' | 'user' | 'tool';
    content: string;
    timestamp?: number;
    words?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
    tool_calls?: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
    tool_results?: Array<{
      tool_call_id: string;
      content: string;
    }>;
  }>;
  recording_url?: string;
  recording_url_scrubbed?: string;
  public_log_url?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  metadata?: Record<string, any>;
  retell_llm_dynamic_variables?: Record<string, any>;
  opt_out_sensitive_data_storage?: boolean;
  latency?: {
    e2e_latency_p50_ms?: number;
    e2e_latency_p90_ms?: number;
    e2e_latency_p95_ms?: number;
    e2e_latency_p99_ms?: number;
    llm_latency_p50_ms?: number;
    llm_latency_p90_ms?: number;
    llm_latency_p95_ms?: number;
    llm_latency_p99_ms?: number;
    tts_latency_p50_ms?: number;
    tts_latency_p90_ms?: number;
    tts_latency_p95_ms?: number;
    tts_latency_p99_ms?: number;
  };
  call_cost?: {
    total_cost?: number;
    llm_cost?: number;
    tts_cost?: number;
    stt_cost?: number;
    call_cost?: number;
  };
  user_sentiment?: string;
  call_successful?: boolean;
  call_summary?: string;
}

export interface AgentCreateRequest {
  agent_name: string;
  voice: {
    type: 'retell' | 'elevenlabs';
    voice_id: string;
  };
  llm: {
    type: 'retell' | 'custom-llm';
    custom_llm_url?: string;
    llm_id?: string;
  };
  prompt: string;
  language?: string;
  response_engine?: {
    type: string;
  };
}

export interface AgentConfig {
  name: string;
  voice?: {
    type: 'retell' | 'elevenlabs';
    voice_id: string;
  };
  llm?: {
    type: 'retell' | 'custom-llm';
    custom_llm_url?: string;
    llm_id?: string;
  };
  prompt?: string;
  language?: string;
  responseEngine?: {
    type: string;
  };
}

export interface AgentData {
  agent_id: string;
  name: string;
  voice?: string;
  llm?: string;
  prompt: string;
  language?: string;
}

export interface PhoneNumber {
  phone_number: string;
  phone_number_pretty: string;
  inbound_agent_id?: string;
  outbound_agent_id?: string;
}

export class RetellService {
  private client: Retell;

  constructor() {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      throw new Error('RETELL_API_KEY environment variable is required');
    }

    try {
      this.client = new Retell({
        apiKey: apiKey
      });

      logger.info('RetellService initialized');
      logger.info('Retell client properties', {
        ...Object.getOwnPropertyNames(this.client)
      });
    } catch (error) {
      logger.error('Failed to initialize Retell client', error);
      throw error;
    }
  }

  /**
   * Normalize Retell webhook payloads into a consistent shape
   */
  parseWebhookEvent(body: any): {
    event: string;
    call_id: string;
    agent_id: string;
    call_status?: string;
    transcript?: any[] | string;
    metadata?: Record<string, any>;
  } {
    const event = body.event || body.type || body.name || 'unknown';
    const call_id = body.call_id || body.call?.call_id || body.data?.call_id || '';
    const agent_id = body.agent_id || body.call?.agent_id || body.data?.agent_id || '';
    const call_status = body.call_status || body.call?.call_status || body.data?.call_status;
    const transcript = body.transcript || body.transcript_object || body.call?.transcript || body.call?.transcript_object || [];
    const metadata = body.metadata || body.call?.metadata || body.data?.metadata;

    return { event, call_id, agent_id, call_status, transcript, metadata };
  }

  /**
   * Test the connection to Retell API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.agent.list({ limit: 1 });
      logger.info('Retell API connection successful');
      return true;
    } catch (error) {
      logger.error('Retell API connection failed', error);
      return false;
    }
  }

  /**
   * Create a new agent
   */
  async createAgent(request: AgentCreateRequest): Promise<AgentData | null> {
    try {
      logger.info('Creating Retell agent', {
        name: request.agent_name,
        voiceId: request.voice?.voice_id,
        hasPrompt: !!request.prompt
      });

      const agentConfig = {
        agent_name: request.agent_name,
        voice: {
          voice_id: request.voice.voice_id
        },
        llm_websocket_url: request.llm.type === 'custom-llm' ? request.llm.custom_llm_url : undefined,
        llm_id: request.llm.type === 'retell' ? request.llm.llm_id : undefined,
        prompt: request.prompt,
        language: request.language as any,
        response_engine: {
          type: (request.response_engine as any).type
        } as any,
        interruption_sensitivity: 1,
        enable_backchannel: true,
        backchannel_frequency: 0.9,
        ambient_sound: 'coffee-shop' as any
      };

      const response = await this.client.agent.create(agentConfig as any);

      logger.info('Retell agent created successfully', {
        agentId: response.agent_id,
        name: request.agent_name
      });

      return {
        agent_id: response.agent_id,
        name: response.agent_name || '',
        voice: (response as any).voice,
        llm: (response as any).llm_websocket_url,
        prompt: (response as any).prompt || '',
        language: response.language || 'en-US'
      };
    } catch (error) {
      logger.error('Failed to create Retell agent', error);
      return null;
    }
  }

  /**
   * Get basic call information from Retell
   */
  async getCall(callId: string): Promise<CallData | null> {
    try {
      const response = await this.client.call.retrieve(callId);

      return {
        call_id: response.call_id,
        status: response.call_status || 'unknown',
        phone_number: (response as any).to_number || '',
        agent_id: response.agent_id || '',
        metadata: response.metadata as any
      };
    } catch (error) {
      logger.error('Failed to get Retell call', error);
      return null;
    }
  }

  /**
   * Get calls from Retell with pagination
   */
  async getCalls(limit: number = 10, startTime?: Date): Promise<CallSession[]> {
    try {
      const params: any = {
        limit: limit,
        sort_order: 'desc'
      };

      if (startTime) {
        (params as any).after = startTime.toISOString();
      }

      const response = await this.client.call.list(params);

      return (response as any).data?.map((call: any) => ({
        call_id: call.call_id,
        status: call.call_status || 'unknown',
        phoneNumber: call.to_number || '',
        agentId: call.agent_id || '',
        startTime: call.start_timestamp ? new Date(call.start_timestamp * 1000) : undefined,
        endTime: call.end_timestamp ? new Date(call.end_timestamp * 1000) : undefined,
        duration: call.duration_ms,
        recordingUrl: call.recording_url,
        metadata: call.metadata
      })) || [];
    } catch (error) {
      logger.error('Failed to get Retell calls', error);
      return [];
    }
  }

  /**
   * Get agent configuration
   */
  async getAgent(agentId: string): Promise<AgentData | null> {
    try {
      const response = await this.client.agent.retrieve(agentId);

      return {
        agent_id: response.agent_id,
        name: response.agent_name || '',
        voice: (response as any).voice,
        llm: (response as any).llm_websocket_url,
        prompt: (response as any).prompt || '',
        language: response.language || 'en-US'
      };
    } catch (error) {
      logger.error('Failed to get Retell agent', error);
      return null;
    }
  }

  /**
   * List all agents
   */
  async listAgents(): Promise<AgentData[]> {
    try {
      const response = await this.client.agent.list();

      return (response as any).data?.map((agent: any) => ({
        agent_id: agent.agent_id,
        name: agent.agent_name || '',
        voice: (agent as any).voice,
        llm: (agent as any).llm_websocket_url,
        prompt: (agent as any).prompt || '',
        language: agent.language || 'en-US'
      })) || [];
    } catch (error) {
      logger.error('Failed to list Retell agents', error);
      return [];
    }
  }

  /**
   * Update agent configuration
   */
  async updateAgent(agentId: string, config: AgentConfig): Promise<AgentData | null> {
    try {
      logger.info('Updating Retell agent', { agentId, config });

      const updateConfig: any = {};

      if (config.name) {
        updateConfig.agent_name = config.name;
      }

      if (config.voice?.voice_id) {
        updateConfig.voice = {
          voice_id: config.voice.voice_id
        };
      }

      if (config.llm?.type === 'custom-llm' && config.llm.custom_llm_url) {
        updateConfig.llm_websocket_url = config.llm.custom_llm_url;
      }

      if (config.llm?.type === 'retell' && config.llm.llm_id) {
        updateConfig.llm_id = config.llm.llm_id;
      }

      if (config.prompt !== undefined) {
        updateConfig.prompt = config.prompt;
      }

      if (config.language) {
        updateConfig.language = config.language;
      }

      if (config.responseEngine?.type) {
        updateConfig.response_engine = {
          type: config.responseEngine.type
        };
      }

      const response = await this.client.agent.update(agentId, updateConfig);

      logger.info('Retell agent updated successfully', { agentId });

      return {
        agent_id: response.agent_id,
        name: response.agent_name || '',
        voice: (response as any).voice,
        llm: (response as any).llm_websocket_url,
        prompt: (response as any).prompt || '',
        language: response.language || 'en-US'
      };
    } catch (error) {
      logger.error('Failed to update Retell agent', error);
      return null;
    }
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      await this.client.agent.delete(agentId);
      logger.info('Retell agent deleted successfully', { agentId });
      return true;
    } catch (error) {
      logger.error('Failed to delete Retell agent', error);
      return false;
    }
  }

  /**
   * Get phone numbers
   */
  async getPhoneNumbers(): Promise<PhoneNumber[]> {
    try {
      const response = await this.client.phoneNumber.list();

      return (response as any).data?.map((phone: any) => ({
        phone_number: phone.phone_number,
        phone_number_pretty: phone.phone_number_pretty || phone.phone_number,
        inbound_agent_id: phone.inbound_agent_id,
        outbound_agent_id: phone.outbound_agent_id
      })) || [];
    } catch (error) {
      logger.error('Failed to get Retell phone numbers', error);
      return [];
    }
  }

  /**
   * Create a phone call
   */
  async createPhoneCall(
    fromNumber: string,
    toNumber: string,
    agentId: string,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    try {
      logger.info('Creating Retell phone call', { fromNumber, toNumber, agentId });

      const response = await this.client.call.createPhoneCall({
        from_number: fromNumber,
        to_number: toNumber,
        override_agent_id: agentId,
        metadata: metadata || {}
      });

      logger.info('Retell phone call created', { callId: response.call_id });
      return response.call_id;
    } catch (error) {
      logger.error('Failed to create Retell phone call', error);
      return null;
    }
  }

  /**
   * Create a call with dynamic variables
   */
  async createCall({
    phoneNumber,
    agentId,
    dynamicVariables,
    metadata
  }: {
    phoneNumber: string;
    agentId: string;
    dynamicVariables?: Record<string, string>;
    metadata?: Record<string, any>;
  }): Promise<{ call_id: string; call_status: string; agent_id: string; [key: string]: any }> {
    try {
      // Validate phone number format (E.164)
      if (!this.isValidE164PhoneNumber(phoneNumber)) {
        throw new Error(`Invalid phone number format: ${phoneNumber}. Must be in E.164 format (e.g., +1234567890)`);
      }

      logger.info('Creating Retell call', { agentId, phoneNumber });
      logger.info('Available call methods', {
        ...Object.getOwnPropertyNames(this.client.call)
      });

      const fromNumber = process.env.RETELL_FROM_NUMBER || '+15122012521';

      logger.info('Call details', {
        agent: agentId,
        from: fromNumber,
        to: phoneNumber
      });

      // Add dynamic variables to call metadata
      if (dynamicVariables) {
        logger.info('Adding dynamic variables to call', { dynamicVariables });
      }

      const callParams: any = {
        from_number: fromNumber,
        to_number: phoneNumber,
        override_agent_id: agentId,
        metadata: metadata || {},
      };

      // Add dynamic variables if provided
      if (dynamicVariables) {
        callParams.retell_llm_dynamic_variables = dynamicVariables;
      }

      const response = await this.client.call.createPhoneCall(callParams);

      logger.info('Retell API response', response);
      logger.info('Retell call created successfully', { callId: response.call_id });

      return {
        ...response,
        call_id: response.call_id,
        call_status: response.call_status || 'registered',
        agent_id: response.agent_id || agentId
      };
    } catch (error: any) {
      logger.error('Failed to create Retell call', {
        error: error.message || error,
        status: error.status || 'unknown',
        headers: error.headers || {},
        stack: error.stack
      });
      throw new Error(`Failed to create call: ${error.message || error}`);
    }
  }

  /**
   * Validate E.164 phone number format
   */
  private isValidE164PhoneNumber(phoneNumber: string): boolean {
    // E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Get comprehensive call analytics from Retell API
   */
  async getCallAnalytics(callId: string): Promise<RetellCallAnalytics | null> {
    try {
      logger.info('Fetching detailed call analytics from Retell API', { callId });

      const call = await this.client.call.retrieve(callId);

      if (!call) {
        logger.warn('Call not found in Retell API', { callId });
        return null;
      }

      // Extract transcript data - handle both string and object formats
      // Handle null/undefined safely - avoid any errors that could break call loading
      let transcriptText: string | undefined;
      let transcriptObject: Array<any> | undefined;

      try {
        if (call.transcript) {
          if (typeof call.transcript === 'string') {
            transcriptText = call.transcript;
          } else if (Array.isArray(call.transcript)) {
            transcriptObject = call.transcript;
          }
        }
      } catch (e) {
        logger.warn('Error extracting transcript', { callId, error: e });
      }

      // Try to get transcript_object if transcript wasn't an array
      if (!transcriptObject && Array.isArray((call as any).transcript_object)) {
        transcriptObject = (call as any).transcript_object;
      }
      
      logger.info('Retell API response received', {
        callId,
        status: call.call_status,
        hasTranscriptText: !!transcriptText,
        hasTranscriptObject: !!transcriptObject,
        hasTranscriptWithToolCalls: !!(call as any).transcript_with_tool_calls,
        hasScrubbedTranscript: !!(call as any).scrubbed_transcript_with_tool_calls,
        hasLatency: !!(call as any).latency
      });

      // Build analytics object with all available data
      const analytics: RetellCallAnalytics = {
        call_id: call.call_id,
        call_status: call.call_status,
        call_type: call.call_type,
        agent_id: call.agent_id,
        duration_ms: call.duration_ms,
        disconnection_reason: call.disconnection_reason,
        from_number: (call as any).from_number,
        to_number: (call as any).to_number,
        direction: (call as any).direction,
        start_timestamp: call.start_timestamp,
        end_timestamp: call.end_timestamp,
        
        // Extract all transcript formats
        transcript_text: transcriptText,
        // Always ensure transcript is an array for backward compatibility
        // Convert string to array format if needed, or return empty array if none exists
        transcript: transcriptObject || (transcriptText ? 
          transcriptText.split('\n')
            .filter(line => line.trim())
            .map(line => {
              // Try to parse "Role: content" format
              const match = line.match(/^(Agent|User|AI):\s*(.+)$/i);
              if (match) {
                return {
                  role: match[1].toLowerCase() === 'agent' || match[1].toLowerCase() === 'ai' ? 'agent' : 'user',
                  content: match[2].trim()
                };
              }
              // Fallback: treat as user message
              return {
                role: 'user' as const,
                content: line.trim()
              };
            }) : []),
        transcript_with_tool_calls: (call as any).transcript_with_tool_calls,
        scrubbed_transcript_with_tool_calls: (call as any).scrubbed_transcript_with_tool_calls,
        metadata: call.metadata as any,
        retell_llm_dynamic_variables: (call as any).retell_llm_dynamic_variables,
        opt_out_sensitive_data_storage: (call as any).opt_out_sensitive_data_storage,
        latency: call.latency ? {
          e2e_latency_p50_ms: (call.latency as any).e2e_latency_p50_ms,
          e2e_latency_p90_ms: (call.latency as any).e2e_latency_p90_ms,
          e2e_latency_p95_ms: (call.latency as any).e2e_latency_p95_ms,
          e2e_latency_p99_ms: (call.latency as any).e2e_latency_p99_ms,
          llm_latency_p50_ms: (call.latency as any).llm_latency_p50_ms,
          llm_latency_p90_ms: (call.latency as any).llm_latency_p90_ms,
          llm_latency_p95_ms: (call.latency as any).llm_latency_p95_ms,
          llm_latency_p99_ms: (call.latency as any).llm_latency_p99_ms,
          tts_latency_p50_ms: (call.latency as any).tts_latency_p50_ms,
          tts_latency_p90_ms: (call.latency as any).tts_latency_p90_ms,
          tts_latency_p95_ms: (call.latency as any).tts_latency_p95_ms,
          tts_latency_p99_ms: (call.latency as any).tts_latency_p99_ms,
        } : undefined,
        call_cost: call.call_cost ? {
          total_cost: (call.call_cost as any).total_cost,
          llm_cost: (call.call_cost as any).llm_cost,
          tts_cost: (call.call_cost as any).tts_cost,
          stt_cost: (call.call_cost as any).stt_cost,
          call_cost: (call.call_cost as any).call_cost,
        } : undefined,
        recording_url: call.recording_url || (call as any).recording_multi_channel_url,
        recording_url_scrubbed: (call as any).recording_url_scrubbed,
        public_log_url: call.public_log_url,

        // Call analysis data (includes sentiment, summary, success)
        call_analysis: call.call_analysis,

        // Direct access to key analysis fields for convenience
        user_sentiment: (call as any).call_analysis?.user_sentiment as any,
        call_successful: (call as any).call_analysis?.call_successful as any,
        call_summary: (call as any).call_analysis?.call_summary as any,
      };

      logger.info('Call analytics processed successfully', {
        callId,
        duration: analytics.duration_ms,
        cost: analytics.call_cost?.total_cost || 0,
        hasTranscriptText: !!analytics.transcript_text,
        hasTranscriptObject: !!analytics.transcript,
        hasTranscriptWithToolCalls: !!analytics.transcript_with_tool_calls,
        transcriptTextLength: analytics.transcript_text?.length || 0,
        transcriptObjectLength: analytics.transcript?.length || 0
      });

      return analytics;
    } catch (error) {
      logger.error('Failed to get call analytics', { callId, error });
      return null;
    }
  }

  /**
   * Get call analytics for multiple calls
   */
  async getCallsAnalytics(callIds: string[]): Promise<RetellCallAnalytics[]> {
    try {
      const analytics = await Promise.all(
        callIds.map(async (callId) => {
          try {
            return await this.getCallAnalytics(callId);
          } catch (error) {
            logger.error('Failed to get analytics for call', { callId, error });
            return null;
          }
        })
      );

      return analytics.filter((result): result is RetellCallAnalytics => result !== null);
    } catch (error) {
      logger.error('Failed to get calls analytics', error);
      return [];
    }
  }

  /**
   * Get aggregated analytics for a time period
   */
  async getAggregatedAnalytics(
    startDate: Date,
    endDate: Date,
    agentId?: string
  ): Promise<CallAnalytics> {
    try {
      const calls = await this.getCalls(100, startDate);

      // Filter calls by date range and optionally by agent
      const filteredCalls = calls.filter(call => {
        const callDate = call.startTime;
        if (!callDate) return false;

        const inDateRange = callDate >= startDate && callDate <= endDate;
        const matchesAgent = !agentId || call.agentId === agentId;

        return inDateRange && matchesAgent;
      });

      // Calculate aggregated metrics
      const totalCalls = filteredCalls.length;
      const successfulCalls = filteredCalls.filter(call => call.status === 'completed').length;
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      const avgDuration = filteredCalls.reduce((sum, call) => {
        return sum + (call.duration || 0);
      }, 0) / (totalCalls || 1);

      // Group calls by day
      const callsByDay: Record<string, number> = {};
      filteredCalls.forEach(call => {
        if (call.startTime) {
          const dateKey = call.startTime.toISOString().split('T')[0];
          callsByDay[dateKey] = (callsByDay[dateKey] || 0) + 1;
        }
      });

      // Get top agents by call count
      const agentCounts: Record<string, number> = {};
      filteredCalls.forEach(call => {
        if (call.agentId) {
          agentCounts[call.agentId] = (agentCounts[call.agentId] || 0) + 1;
        }
      });

      const topAgents = Object.entries(agentCounts)
        .map(([agentId, calls]) => ({ agent_id: agentId, calls }))
        .sort((a, b) => b.calls - a.calls)
        .slice(0, 10);

      return {
        total_calls: totalCalls,
        success_rate: successRate,
        avg_duration: avgDuration,
        total_cost: 0, // Would need to fetch cost data separately
        calls_by_day: Object.entries(callsByDay).map(([date, count]) => ({ date, count })),
        top_agents: topAgents
      };
    } catch (error) {
      logger.error('Failed to get aggregated analytics', error);
      return {
        total_calls: 0,
        success_rate: 0,
        avg_duration: 0,
        total_cost: 0,
        calls_by_day: [],
        top_agents: []
      };
    }
  }
}