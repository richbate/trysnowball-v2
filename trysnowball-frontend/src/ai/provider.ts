/**
 * AI Provider Factory - Unified AI Client Interface
 * Creates AI clients with cheap defaults and proper error handling
 * No external SDKs - pure fetch for edge compatibility
 */

import { AIConfig } from '../config/ai';

export type AIUsage = {
  prompt: number;
  completion: number;
  total: number;
};

export type AIChatOptions = {
  messages: any[];
  model?: string;
  maxTokens?: number;
  stream?: boolean;
  json?: boolean;
  timeoutMs?: number;
  temperature?: number;
};

export type AIChatResponse = {
  text: string;
  usage?: AIUsage;
  finishReason?: string;
  model?: string;
};

export interface AIClient {
  chat(options: AIChatOptions): Promise<AIChatResponse>;
  isHealthy(): Promise<boolean>;
  getProvider(): string;
}

/**
 * CENTRALIZED AI CLIENT FACTORY - The Only Way to Create AI Clients
 * Provides unified interface across different AI providers
 */
export function makeAIClient(config: AIConfig): AIClient {
  if (config.AI_PROVIDER === "mock") {
    return new MockAIClient(config);
  }

  return new OpenAIClient(config);
}

/**
 * Mock AI Client - Safe fallback for development/testing
 */
class MockAIClient implements AIClient {
  constructor(private config: AIConfig) {}

  async chat(options: AIChatOptions): Promise<AIChatResponse> {
    // Simulate API delay for realistic testing
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    const mockResponses = [
      "This is a mock AI response for development/testing.",
      "Mock AI: I can help you with debt analysis, but this is just a placeholder response.",
      '{"mock": true, "response": "Mock JSON response for testing"}',
      "Mock AI suggests focusing on high-interest debts first using the snowball method."
    ];

    const text = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    return {
      text,
      usage: {
        prompt: options.messages.reduce((acc, msg) => acc + (msg.content?.length || 0), 0) / 4, // rough estimate
        completion: text.length / 4,
        total: (text.length + options.messages.reduce((acc, msg) => acc + (msg.content?.length || 0), 0)) / 4
      },
      finishReason: 'stop',
      model: 'mock-gpt-4o-mini'
    };
  }

  async isHealthy(): Promise<boolean> {
    return true; // Mock is always healthy
  }

  getProvider(): string {
    return 'mock';
  }
}

/**
 * OpenAI Client - Production AI client using fetch API
 * Edge-compatible, no SDK dependencies
 */
class OpenAIClient implements AIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(private config: AIConfig) {
    this.baseUrl = config.OPENAI_BASE_URL || 'https://api.openai.com';
    this.apiKey = config.OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required for OpenAI provider');
    }
  }

  async chat(options: AIChatOptions): Promise<AIChatResponse> {
    const {
      messages,
      model = this.config.GPT_MODEL_CHAT,
      maxTokens = this.config.GPT_MAX_TOKENS,
      stream = this.config.GPT_STREAMING === "on",
      json = false,
      timeoutMs = this.config.GPT_TIMEOUT_MS,
      temperature = 0.2 // Cheap determinism
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const requestBody = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false, // Keep it simple for now - buffer server-side
        ...(json && { response_format: { type: "json_object" } })
      };

      console.log(`[AI] Starting OpenAI call: model=${model} tokens<=${maxTokens} json=${json}`);
      const startTime = Date.now();

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        const trimmedError = errorBody.slice(0, 200);
        console.error(`[AI] OpenAI error ${response.status}: ${trimmedError}`);
        throw new Error(`OpenAI API error ${response.status}: ${trimmedError}`);
      }

      const result = await response.json();
      const choice = result.choices?.[0];
      
      if (!choice) {
        throw new Error('No choices returned from OpenAI API');
      }

      const text = choice.message?.content || '';
      const usage = result.usage ? {
        prompt: result.usage.prompt_tokens,
        completion: result.usage.completion_tokens,
        total: result.usage.total_tokens
      } : undefined;

      // Log usage for monitoring (never log prompts/responses in production)
      if (usage) {
        console.log(`[AI] Completed: model=${model} ms=${duration} tokens=${JSON.stringify(usage)}`);
      }

      return {
        text,
        usage,
        finishReason: choice.finish_reason,
        model: result.model
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`[AI] Request timed out after ${timeoutMs}ms`);
        throw new Error(`AI request timed out after ${timeoutMs}ms`);
      }
      
      console.error('[AI] Request failed:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check with minimal token usage
      const result = await this.chat({
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 5,
        timeoutMs: 5000
      });
      
      return !!result.text;
    } catch (error) {
      console.warn('[AI] Health check failed:', error);
      return false;
    }
  }

  getProvider(): string {
    return 'openai';
  }
}

/**
 * Utility function to safely parse JSON responses
 */
export function parseAIJSON<T = any>(text: string): { success: boolean; data?: T; error?: string; rawText: string } {
  try {
    const data = JSON.parse(text) as T;
    return { success: true, data, rawText: text };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'JSON parse failed',
      rawText: text 
    };
  }
}

/**
 * Format messages for AI chat with proper roles
 */
export function formatChatMessages(
  systemPrompt: string, 
  userMessage: string,
  context?: Record<string, any>
): any[] {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  if (context) {
    const contextString = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
    messages.push({ role: 'user', content: `Context:\n${contextString}` });
  }

  messages.push({ role: 'user', content: userMessage });

  return messages;
}

export default makeAIClient;