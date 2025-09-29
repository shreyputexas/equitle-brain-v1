import OpenAI from 'openai';
import logger from '../utils/logger';

export interface ConversationContext {
  systemPrompt: string;
  conversationHistory: string[];
  userMessage: string;
  metadata?: {
    callId?: string;
    userId?: string;
    phoneNumber?: string;
    callType?: 'live' | 'voicemail';
  };
}

export interface AIResponse {
  message: string;
  confidence: number;
  shouldEndCall: boolean;
  nextAction?: 'continue' | 'transfer' | 'schedule_callback' | 'end_call';
  metadata?: Record<string, any>;
}

export class OpenAIService {
  private client: OpenAI;
  private defaultModel: string = 'gpt-4o';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: apiKey
    });

    logger.info('OpenAIService initialized');
  }

  /**
   * Generate conversation response using GPT-4o
   */
  async generateResponse(
    systemPrompt: string,
    conversationHistory: string[],
    userMessage: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      logger.info('Generating AI response', {
        historyLength: conversationHistory.length,
        messageLength: userMessage.length,
        hasMetadata: !!metadata
      });

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.buildSystemPrompt(systemPrompt, metadata)
        }
      ];

      // Add conversation history
      conversationHistory.forEach(entry => {
        if (entry.startsWith('User: ')) {
          messages.push({
            role: 'user',
            content: entry.substring(6) // Remove "User: " prefix
          });
        } else if (entry.startsWith('AI: ')) {
          messages.push({
            role: 'assistant',
            content: entry.substring(4) // Remove "AI: " prefix
          });
        }
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        stream: false
      });

      const aiResponse = response.choices[0]?.message?.content || 'I apologize, but I need to think about that for a moment.';

      logger.info('AI response generated successfully', {
        responseLength: aiResponse.length,
        tokensUsed: response.usage?.total_tokens
      });

      return aiResponse;
    } catch (error) {
      logger.error('Failed to generate AI response', error);

      // Return a fallback response
      return "I apologize, but I'm experiencing some technical difficulties. Let me connect you with someone who can help you better.";
    }
  }

  /**
   * Generate advanced response with action analysis
   */
  async generateAdvancedResponse(context: ConversationContext): Promise<AIResponse> {
    try {
      logger.info('Generating advanced AI response', {
        historyLength: context.conversationHistory.length,
        hasMetadata: !!context.metadata
      });

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.buildAdvancedSystemPrompt(context.systemPrompt, context.metadata)
        }
      ];

      // Add conversation history
      context.conversationHistory.forEach(entry => {
        if (entry.startsWith('User: ')) {
          messages.push({
            role: 'user',
            content: entry.substring(6)
          });
        } else if (entry.startsWith('AI: ')) {
          messages.push({
            role: 'assistant',
            content: entry.substring(4)
          });
        }
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: context.userMessage
      });

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: messages,
        max_tokens: 600,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        functions: [
          {
            name: 'analyze_conversation',
            description: 'Analyze conversation and determine next action',
            parameters: {
              type: 'object',
              properties: {
                response_message: {
                  type: 'string',
                  description: 'The response message to the user'
                },
                confidence_level: {
                  type: 'number',
                  description: 'Confidence level from 0.0 to 1.0'
                },
                should_end_call: {
                  type: 'boolean',
                  description: 'Whether the call should be ended'
                },
                next_action: {
                  type: 'string',
                  enum: ['continue', 'transfer', 'schedule_callback', 'end_call'],
                  description: 'Next recommended action'
                },
                intent_detected: {
                  type: 'string',
                  description: 'Detected user intent'
                },
                sentiment: {
                  type: 'string',
                  enum: ['positive', 'neutral', 'negative'],
                  description: 'User sentiment'
                }
              },
              required: ['response_message', 'confidence_level', 'should_end_call', 'next_action']
            }
          }
        ],
        function_call: { name: 'analyze_conversation' }
      });

      const functionCall = response.choices[0]?.message?.function_call;
      if (functionCall?.arguments) {
        const analysis = JSON.parse(functionCall.arguments);

        return {
          message: analysis.response_message || 'Thank you for your time.',
          confidence: analysis.confidence_level || 0.5,
          shouldEndCall: analysis.should_end_call || false,
          nextAction: analysis.next_action || 'continue',
          metadata: {
            intent: analysis.intent_detected,
            sentiment: analysis.sentiment,
            tokensUsed: response.usage?.total_tokens
          }
        };
      }

      // Fallback if function call fails
      const messageContent = response.choices[0]?.message?.content || 'Thank you for your time.';
      return {
        message: messageContent,
        confidence: 0.7,
        shouldEndCall: false,
        nextAction: 'continue'
      };

    } catch (error) {
      logger.error('Failed to generate advanced AI response', error);

      return {
        message: "I apologize, but I'm experiencing some technical difficulties. Let me connect you with someone who can help you better.",
        confidence: 0.3,
        shouldEndCall: true,
        nextAction: 'transfer'
      };
    }
  }

  /**
   * Analyze conversation sentiment and intent
   */
  async analyzeConversation(conversationHistory: string[]): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    intent: string;
    keyTopics: string[];
    shouldContinue: boolean;
  }> {
    try {
      const conversation = conversationHistory.join('\n');

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation and provide:
1. Overall sentiment (positive/neutral/negative)
2. Primary user intent
3. Key topics discussed
4. Whether the conversation should continue

Respond in JSON format only.`
          },
          {
            role: 'user',
            content: conversation
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        sentiment: analysis.sentiment || 'neutral',
        intent: analysis.intent || 'general_inquiry',
        keyTopics: analysis.key_topics || [],
        shouldContinue: analysis.should_continue !== false
      };
    } catch (error) {
      logger.error('Failed to analyze conversation', error);
      return {
        sentiment: 'neutral',
        intent: 'general_inquiry',
        keyTopics: [],
        shouldContinue: true
      };
    }
  }

  /**
   * Generate call summary
   */
  async generateCallSummary(
    conversationHistory: string[],
    callMetadata?: Record<string, any>
  ): Promise<{
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    outcome: string;
    duration?: number;
  }> {
    try {
      const conversation = conversationHistory.join('\n');

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: `Analyze this sales call conversation and provide a comprehensive summary including:
1. Brief overall summary
2. Key discussion points
3. Action items or next steps
4. Call outcome (interested/not_interested/callback_requested/more_info_needed)

Format your response as JSON with fields: summary, key_points, action_items, outcome.`
          },
          {
            role: 'user',
            content: `Call conversation:\n${conversation}\n\nCall metadata: ${JSON.stringify(callMetadata || {})}`
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        summary: analysis.summary || 'Call completed',
        keyPoints: analysis.key_points || [],
        actionItems: analysis.action_items || [],
        outcome: analysis.outcome || 'completed',
        duration: callMetadata?.duration
      };
    } catch (error) {
      logger.error('Failed to generate call summary', error);
      return {
        summary: 'Call completed - summary generation failed',
        keyPoints: [],
        actionItems: [],
        outcome: 'completed'
      };
    }
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(basePrompt: string, metadata?: Record<string, any>): string {
    let systemPrompt = basePrompt;

    // Add general voice call instructions
    systemPrompt += `\n\nGeneral instructions:
- You are conducting a voice call, so keep responses conversational and natural
- Avoid using formatting like bullet points or numbered lists in speech
- Keep responses concise but engaging
- Ask follow-up questions to maintain conversation flow
- Be empathetic and professional
- If you don't understand something, politely ask for clarification`;

    // Add metadata context if available
    if (metadata) {
      if (metadata.callType === 'voicemail') {
        systemPrompt += `\n\nNote: This is a voicemail, so keep your message brief and include a clear call-to-action.`;
      }

      if (metadata.phoneNumber) {
        systemPrompt += `\n\nContact phone number: ${metadata.phoneNumber}`;
      }
    }

    return systemPrompt;
  }

  /**
   * Build advanced system prompt for function calling
   */
  private buildAdvancedSystemPrompt(basePrompt: string, metadata?: Record<string, any>): string {
    let systemPrompt = this.buildSystemPrompt(basePrompt, metadata);

    systemPrompt += `\n\nAdvanced instructions:
- Analyze user responses for intent and sentiment
- Determine if the call should continue based on user engagement
- Suggest appropriate next actions (continue, transfer, callback, end)
- Provide confidence levels for your responses
- Detect when a user wants to end the call or is not interested`;

    return systemPrompt;
  }

  /**
   * Test OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });

      if (response.choices[0]?.message?.content) {
        logger.info('OpenAI API connection test successful');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('OpenAI API connection test failed', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort();
    } catch (error) {
      logger.error('Failed to get OpenAI models', error);
      return [this.defaultModel];
    }
  }
}