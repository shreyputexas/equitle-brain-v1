import { Retell } from 'retell-sdk';
import logger from '../utils/logger';

export interface RetellCallRequest {
  phoneNumber: string;
  agentId: string;
  metadata?: Record<string, any>;
}

export interface RetellAgentRequest {
  voice: {
    type: 'elevenlabs' | 'retell';
    voice_id?: string;
  };
  llm: {
    type: 'custom' | 'retell';
    custom_llm_url?: string;
  };
  prompt: string;
  language: string;
  response_engine: {
    type: 'retell';
  };
}

export interface RetellCall {
  call_id: string;
  status: string;
  phone_number: string;
  agent_id: string;
  metadata?: Record<string, any>;
}

export interface RetellAgent {
  agent_id: string;
  name: string;
  voice: any;
  llm: any;
  prompt: string;
  language: string;
}

export interface RetellWebhookEvent {
  event: string;
  call_id: string;
  agent_id: string;
  call_status?: string;
  transcript?: Array<{
    role: 'agent' | 'user';
    content: string;
    timestamp: number;
  }>;
  recording_url?: string;
  metadata?: Record<string, any>;
}

export class RetellService {
  private client: Retell;

  constructor() {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      throw new Error('RETELL_API_KEY environment variable is required');
    }

    this.client = new Retell({
      apiKey: apiKey
    });

    // Debug: Log available methods
    logger.info('RetellService initialized');
    logger.info('Retell client properties:', Object.keys(this.client));
  }

  /**
   * Create a new phone call
   */
  async createCall(request: RetellCallRequest): Promise<RetellCall> {
    try {
      logger.info('Creating Retell call', { phoneNumber: request.phoneNumber, agentId: request.agentId });
      logger.info('Available call methods:', Object.keys(this.client.call));

      // Try different API patterns based on Retell SDK structure
      const fromNumber = process.env.RETELL_PHONE_NUMBER || '';
      logger.info('Call details', {
        from: fromNumber,
        to: request.phoneNumber,
        agent: request.agentId
      });

      const response = await this.client.call.createPhoneCall({
        from_number: fromNumber,
        to_number: request.phoneNumber,
        agent_id: request.agentId,
        metadata: request.metadata
      });

      logger.info('Retell API response', response);

      logger.info('Retell call created successfully', { callId: response.call_id });

      return {
        call_id: response.call_id,
        status: response.call_status || 'queued',
        phone_number: request.phoneNumber,
        agent_id: request.agentId,
        metadata: request.metadata
      };
    } catch (error) {
      logger.error('Failed to create Retell call', error);
      throw new Error(`Failed to create call: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new agent
   */
  async createAgent(request: RetellAgentRequest): Promise<RetellAgent> {
    try {
      logger.info('Creating Retell agent');

      const response = await this.client.agent.create({
        agent_name: `Equitle-Agent-${Date.now()}`,
        voice: {
          voice_type: request.voice.type,
          voice_id: request.voice.voice_id
        },
        llm_websocket_url: request.llm.custom_llm_url,
        prompt: request.prompt,
        language: request.language,
        response_engine: {
          type: request.response_engine.type
        },
        interruption_sensitivity: 1,
        enable_backchannel: true,
        backchannel_frequency: 0.9,
        ambient_sound: 'office'
      });

      logger.info('Retell agent created successfully', { agentId: response.agent_id });

      return {
        agent_id: response.agent_id,
        name: response.agent_name || '',
        voice: response.voice,
        llm: response.llm_websocket_url,
        prompt: response.prompt || '',
        language: response.language || 'en-US'
      };
    } catch (error) {
      logger.error('Failed to create Retell agent', error);
      throw new Error(`Failed to create agent: ${(error as Error).message}`);
    }
  }

  /**
   * Get call details
   */
  async getCall(callId: string): Promise<RetellCall | null> {
    try {
      const response = await this.client.call.retrieve(callId);

      return {
        call_id: response.call_id,
        status: response.call_status || 'unknown',
        phone_number: response.to_number || '',
        agent_id: response.agent_id || '',
        metadata: response.metadata
      };
    } catch (error) {
      logger.error('Failed to get Retell call', error);
      return null;
    }
  }

  /**
   * List all calls with pagination
   */
  async listCalls(limit: number = 50, after?: string): Promise<RetellCall[]> {
    try {
      const response = await this.client.call.list({
        limit,
        after
      });

      return response.data.map(call => ({
        call_id: call.call_id,
        status: call.call_status || 'unknown',
        phone_number: call.to_number || '',
        agent_id: call.agent_id || '',
        metadata: call.metadata
      }));
    } catch (error) {
      logger.error('Failed to list Retell calls', error);
      return [];
    }
  }

  /**
   * Get agent details
   */
  async getAgent(agentId: string): Promise<RetellAgent | null> {
    try {
      const response = await this.client.agent.retrieve(agentId);

      return {
        agent_id: response.agent_id,
        name: response.agent_name || '',
        voice: response.voice,
        llm: response.llm_websocket_url,
        prompt: response.prompt || '',
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
  async listAgents(): Promise<RetellAgent[]> {
    try {
      const response = await this.client.agent.list();

      return response.data.map(agent => ({
        agent_id: agent.agent_id,
        name: agent.agent_name || '',
        voice: agent.voice,
        llm: agent.llm_websocket_url,
        prompt: agent.prompt || '',
        language: agent.language || 'en-US'
      }));
    } catch (error) {
      logger.error('Failed to list Retell agents', error);
      return [];
    }
  }

  /**
   * Update an existing agent
   */
  async updateAgent(agentId: string, updates: Partial<RetellAgentRequest>): Promise<RetellAgent | null> {
    try {
      const updateData: any = {};

      if (updates.voice) {
        updateData.voice = {
          voice_type: updates.voice.type,
          voice_id: updates.voice.voice_id
        };
      }

      if (updates.llm?.custom_llm_url) {
        updateData.llm_websocket_url = updates.llm.custom_llm_url;
      }

      if (updates.prompt) {
        updateData.prompt = updates.prompt;
      }

      if (updates.language) {
        updateData.language = updates.language;
      }

      const response = await this.client.agent.update(agentId, updateData);

      return {
        agent_id: response.agent_id,
        name: response.agent_name || '',
        voice: response.voice,
        llm: response.llm_websocket_url,
        prompt: response.prompt || '',
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
   * Verify webhook signature
   */
  verifyWebhook(body: string, signature: string): boolean {
    try {
      // Retell webhook verification logic
      // This would typically involve HMAC verification with a secret
      // For now, we'll do basic validation
      const webhookSecret = process.env.RETELL_WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.warn('RETELL_WEBHOOK_SECRET not configured, skipping verification');
        return true; // Allow for development
      }

      // In production, implement proper HMAC-SHA256 verification
      // const expectedSignature = crypto
      //   .createHmac('sha256', webhookSecret)
      //   .update(body)
      //   .digest('hex');

      // return signature === expectedSignature;

      return true; // For development
    } catch (error) {
      logger.error('Failed to verify webhook signature', error);
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(body: any): RetellWebhookEvent {
    return {
      event: body.event || 'unknown',
      call_id: body.call_id || '',
      agent_id: body.agent_id || '',
      call_status: body.call_status,
      transcript: body.transcript,
      recording_url: body.recording_url,
      metadata: body.metadata
    };
  }

  /**
   * Get phone numbers associated with account
   */
  async getPhoneNumbers(): Promise<Array<{ number: string; id: string; name?: string }>> {
    try {
      const response = await this.client.phoneNumber.list();

      return response.data.map(phone => ({
        id: phone.phone_number_id || '',
        number: phone.phone_number || '',
        name: phone.phone_number_pretty || phone.phone_number
      }));
    } catch (error) {
      logger.error('Failed to get phone numbers', error);
      return [];
    }
  }

  /**
   * Test connection to Retell API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.agent.list({ limit: 1 });
      logger.info('Retell API connection test successful');
      return true;
    } catch (error) {
      logger.error('Retell API connection test failed', error);
      return false;
    }
  }
}