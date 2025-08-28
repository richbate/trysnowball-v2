# TrySnowball - AI System Documentation

**Version**: 3.0.0  
**Last Updated**: August 2025  
**AI Provider**: OpenAI (gpt-4o-mini primary)  
**Architecture**: Unified Cloudflare Worker with KV quota system  
**Privacy Model**: Zero Data Retention  
**Usage Model**: 40 messages/day with 700 token limit  

## 🤖 AI System Overview

TrySnowball's AI Coach "Yuki" provides UK-focused debt coaching through a server-controlled unified worker architecture. The system uses OpenAI's gpt-4o-mini model with rate limiting, cost controls, and UK-specific debt prioritization guidance. All API keys are server-side managed for security.

## 🎯 AI Feature Tiers & Usage Limits

### Current Implementation (August 2025)

| Component | Details |
|-----------|---------|
| **Model** | gpt-4o-mini (cost-optimized) |
| **Daily Limit** | 40 messages per user per day |
| **Token Limit** | 700 tokens per response |
| **Rate Limiting** | KV storage with daily reset at UTC midnight |
| **Auth Required** | JWT Bearer token required |
| **Endpoint** | `/api/ai/chat` via unified worker |
| **Error Handling** | 402 for quota exceeded, fallback UI support |

### Usage Limit Implementation

```javascript
const AI_USAGE_LIMITS = {
  free: { 
    ai_coach: { dailyRequests: 5, dailyTokens: 20000 }, 
    ai_report: { dailyRequests: 0, dailyTokens: 0 },
    ai_parsing: { dailyRequests: 2, dailyTokens: 5000 }
  },
  pro: { 
    ai_coach: { dailyRequests: 50, dailyTokens: 100000 }, 
    ai_report: { dailyRequests: 5, dailyTokens: 50000 },
    ai_parsing: { dailyRequests: 20, dailyTokens: 20000 }
  },
  founders: { 
    ai_coach: { dailyRequests: 100, dailyTokens: 200000 }, 
    ai_report: { dailyRequests: 10, dailyTokens: 100000 },
    ai_parsing: { dailyRequests: 50, dailyTokens: 50000 }
  }
};

// Usage resets at UTC midnight, tracked in PostHog + GA4
// Events: user_tier, model_used, tokens_used, feature_name
```

### Marketing Language Updates

**Pro Tier**: "Generous daily AI access – 50 chats/day, 100k tokens"  
**Founders Tier**: "Extended daily AI access – 100 chats/day, 200k tokens"

*Note: Removed all "unlimited" language for realistic expectations*

## 🏗️ AI Architecture

### System Components
```
┌─────────────────────┐    ┌───────────────────────┐    ┌──────────────────────┐
│   React Frontend    │    │  AI Service Layer     │    │    OpenAI API        │
│                     │    │  (Cloudflare Worker)  │    │                      │
│  - AI Coach Chat    │◄──►│                       │◄──►│  - GPT-4 Model       │
│  - Report Generator │    │  - Prompt Engineering │    │  - Context Processing │
│  - Smart Insights   │    │  - Context Building   │    │  - Response Generation│
│  - Data Anonymizer  │    │  - Response Parsing   │    │  - No Data Retention │
└─────────────────────┘    └───────────────────────┘    └──────────────────────┘
```

### Privacy-First Design
```javascript
// Data anonymization before AI processing
const anonymizeFinancialData = (debts) => {
  return debts.map((debt, index) => ({
    id: `debt_${index + 1}`, // Remove real IDs
    name: `Debt ${index + 1}`, // Generic names only
    balance: Math.round(debt.balance),
    minPayment: Math.round(debt.minPayment),
    interestRate: debt.interestRate,
    type: debt.type
    // Remove: user IDs, real names, account numbers
  }));
};
```

## 🇬🇧 Confident UK Debt Coach Persona

### Core Personality & Approach
- **Communication Style**: Clear, concise, British English with no jargon
- **Expertise**: Fluent in both Snowball and Avalanche debt methods
- **Focus**: Prioritises actionable steps and mathematical accuracy
- **Context**: Recognises UK-specific financial landscape and terminology

### UK Financial Expertise
- **Interest Rates**: Always refers to APR (Annual Percentage Rate)
- **Priority Debts**: Understands council tax, rent arrears, secured loans hierarchy
- **Consumer Rights**: Aware of Section 75 protection, FCA regulations
- **UK Debt Types**: Overdrafts, hire purchase, guarantor loans, payday loans
- **Regulatory Awareness**: Provides educational guidance only, never regulated financial advice

### Response Structure Template
All AI responses follow this consistent format:
1. **Snapshot**: Brief situation summary
2. **Maths**: Clear calculations and projections
3. **Actions**: Specific next steps to take
4. **Risks/Checks**: Important considerations or warnings
5. **Next Milestone**: Clear progress target and timeframe

### Educational Compliance
```
Standard Disclaimer: "This is educational information only and is not regulated 
financial advice. Consider speaking with a qualified debt adviser or financial 
counsellor for your specific circumstances."
```

## 🎯 AI Features & Components

### 1. AI Debt Coach (Pro Feature)

#### Interactive Chat Interface
```javascript
// src/components/ai/AICoach.jsx
import { useState, useEffect } from 'react';
import { useAI } from '../hooks/useAI';
import { anonymizeDebts } from '../utils/dataAnonymizer';

const AICoach = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, debts } = useDataManager();
  const { askCoach, hasAIAccess } = useAI();
  
  // Pro feature gate
  if (!hasAIAccess) {
    return <ProFeatureGate feature="AI Coach" />;
  }
  
  const handleUserQuestion = async (question) => {
    setLoading(true);
    
    try {
      // Anonymize debt data before sending
      const anonymizedDebts = anonymizeDebts(debts);
      
      const response = await askCoach(question, {
        debts: anonymizedDebts,
        totalBalance: debts.reduce((sum, d) => sum + d.balance, 0),
        monthlyMinimums: debts.reduce((sum, d) => sum + d.minPayment, 0)
      });
      
      setMessages(prev => [
        ...prev,
        { type: 'user', content: question },
        { type: 'coach', content: response.answer }
      ]);
      
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { type: 'error', content: 'Sorry, I had trouble processing that. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="ai-coach">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </div>
      
      <ChatInput onSubmit={handleUserQuestion} loading={loading} />
    </div>
  );
};
```

#### Smart Greeting System
```javascript
// src/utils/smartGreetings.js
export const generateSmartGreeting = (userContext) => {
  const { debts, recentActivity, timeOfDay } = userContext;
  
  const greetings = {
    morning: [
      "Good morning! Ready to tackle your debt journey today?",
      "Morning! Let's start your day with some debt-busting motivation."
    ],
    afternoon: [
      "Good afternoon! How's your debt progress going today?",
      "Afternoon check-in! Any questions about your payment strategy?"
    ],
    evening: [
      "Evening! Perfect time to review your debt elimination plan.",
      "Good evening! Let's talk about optimizing your debt strategy."
    ]
  };
  
  const contextPrompts = {
    newUser: "I see you're just getting started. What would you like to know about the debt snowball method?",
    recentPayment: "Great job on your recent payment! Want to explore how to accelerate your progress?",
    milestone: "Congratulations on your milestone! Ready to tackle the next phase?"
  };
  
  return {
    greeting: greetings[timeOfDay][Math.floor(Math.random() * greetings[timeOfDay].length)],
    contextPrompt: contextPrompts[recentActivity] || contextPrompts.newUser
  };
};
```

### 2. AI Report Generator (Pro Feature)

#### Comprehensive Debt Analysis
```javascript
// src/utils/aiReportGenerator.js
export const generateDebtReport = async (debts, userGoals) => {
  const reportData = {
    debts: anonymizeDebts(debts),
    totalBalance: debts.reduce((sum, d) => sum + d.balance, 0),
    averageInterest: debts.reduce((sum, d) => sum + d.interestRate, 0) / debts.length,
    payoffTimeline: calculatePayoffTimeline(debts),
    userGoals: {
      targetDate: userGoals.targetDate,
      extraPayment: userGoals.extraPayment
    }
  };
  
  const prompt = `
    Analyze this debt portfolio and provide a comprehensive report:
    ${JSON.stringify(reportData, null, 2)}
    
    Generate a detailed report covering:
    1. Current situation summary
    2. Optimization opportunities
    3. Strategy recommendations
    4. Timeline projections
    5. Motivation and next steps
    
    Format as markdown with clear sections and actionable insights.
  `;
  
  const response = await callOpenAI(prompt, 'gpt-4');
  return parseReportResponse(response);
};
```

#### Report Templates & Formatting
```javascript
// AI report structure
const REPORT_SECTIONS = {
  executive_summary: {
    title: "Executive Summary",
    prompt: "Provide a 2-3 sentence overview of the debt situation and key opportunities.",
    icon: "📊"
  },
  
  current_analysis: {
    title: "Current Debt Analysis",
    prompt: "Analyze the current debt portfolio, highlighting the biggest challenges and opportunities.",
    icon: "🔍"
  },
  
  strategy_recommendations: {
    title: "Strategy Recommendations",
    prompt: "Provide specific, actionable recommendations for optimizing the debt payoff strategy.",
    icon: "🎯"
  },
  
  timeline_projections: {
    title: "Timeline & Projections",
    prompt: "Analyze the payoff timeline and suggest ways to accelerate progress.",
    icon: "⏰"
  },
  
  motivation_insights: {
    title: "Motivation & Next Steps",
    prompt: "Provide encouraging insights and clear next steps to maintain momentum.",
    icon: "🚀"
  }
};
```

### 3. Smart Debt Parser (AI-Enhanced)

#### Intelligent Data Extraction
```javascript
// src/utils/gptDebtParser.js
export const parseDebtDataWithAI = async (userInput) => {
  const prompt = `
    Extract debt information from the following text and return as JSON:
    "${userInput}"
    
    Return an array of debts with this structure:
    [
      {
        "name": "Credit Card Name or identifier",
        "balance": number (amount owed),
        "minPayment": number (minimum monthly payment),
        "interestRate": number (annual percentage rate),
        "type": "credit_card|loan|overdraft|other"
      }
    ]
    
    Guidelines:
    - If minimum payment isn't provided, calculate 2-3% of balance
    - If interest rate isn't provided, use typical rates for debt type
    - Be conservative with estimates
    - Return only valid JSON, no explanatory text
  `;
  
  try {
    const response = await callOpenAI(prompt, 'gpt-3.5-turbo');
    const parsedDebts = JSON.parse(response);
    
    // Validate and sanitize the response
    return parsedDebts
      .filter(debt => debt.balance > 0)
      .map((debt, index) => ({
        ...debt,
        id: generateId(),
        order: index + 1,
        createdAt: new Date().toISOString(),
        aiParsed: true
      }));
      
  } catch (error) {
    console.error('AI parsing failed, falling back to rule-based parser:', error);
    return fallbackRuleBasedParser(userInput);
  }
};
```

#### Smart Validation & Suggestions
```javascript
// Validate AI-parsed debt data
export const validateParsedDebts = (debts) => {
  const validatedDebts = debts.map(debt => {
    const suggestions = [];
    
    // Interest rate validation
    if (debt.interestRate > 35) {
      suggestions.push({
        field: 'interestRate',
        message: 'This interest rate seems unusually high. Please verify.',
        suggestedValue: 25
      });
    }
    
    // Minimum payment validation  
    const expectedMinPayment = Math.max(25, debt.balance * 0.02);
    if (debt.minPayment < expectedMinPayment * 0.5 || debt.minPayment > expectedMinPayment * 3) {
      suggestions.push({
        field: 'minPayment',
        message: 'This minimum payment seems unusual for the balance.',
        suggestedValue: Math.round(expectedMinPayment)
      });
    }
    
    return {
      ...debt,
      suggestions,
      confidence: calculateConfidenceScore(debt)
    };
  });
  
  return validatedDebts;
};
```

## 🔐 Privacy & Security Implementation

### Zero Data Retention Policy

#### OpenAI API Configuration
```javascript
// src/utils/aiApi.js
export const callOpenAI = async (prompt, model = 'gpt-4') => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      prompt: prompt,
      model: model,
      // Privacy settings
      max_tokens: 2000,
      temperature: 0.7,
      // Ensure no training data usage
      user: 'anonymous', // Never send user IDs
    })
  });
  
  if (!response.ok) {
    throw new Error('AI service unavailable');
  }
  
  return await response.json();
};
```

#### Backend AI Service (Cloudflare Worker)
```javascript
// cloudflare-workers/ai-service.js
import OpenAI from 'openai';

export default {
  async fetch(request, env) {
    // Verify user has Pro access
    const authHeader = request.headers.get('Authorization');
    const user = await verifyProUser(authHeader, env.DB);
    
    if (!user) {
      return Response.json({ error: 'Pro subscription required' }, { status: 403 });
    }
    
    const { prompt, model } = await request.json();
    
    // Initialize OpenAI with strict privacy settings
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      organization: null, // No organization tracking
    });
    
    try {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPTS.debtCoach
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        // Privacy settings
        user: 'anonymous', // Never send identifying information
        stream: false
      });
      
      const response = completion.choices[0].message.content;
      
      // Track usage without sensitive data
      await trackAIUsage(user.id, model, completion.usage.total_tokens, env.DB);
      
      return Response.json({ 
        response: response,
        usage: completion.usage 
      });
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      return Response.json({ 
        error: 'AI service temporarily unavailable' 
      }, { status: 500 });
    }
  }
};
```

### Data Anonymization Pipeline

#### Multi-Layer Anonymization
```javascript
// src/utils/dataAnonymizer.js
export const anonymizeForAI = (userData) => {
  const anonymized = {
    // Financial data (numbers only, no identifiers)
    debts: userData.debts.map((debt, index) => ({
      balance: Math.round(debt.balance),
      minPayment: Math.round(debt.minPayment), 
      interestRate: debt.interestRate,
      type: debt.type,
      order: debt.order
      // Removed: names, IDs, account numbers
    })),
    
    // Aggregated context only
    summary: {
      totalBalance: Math.round(userData.totalBalance),
      totalMinPayments: Math.round(userData.totalMinPayments),
      averageInterest: Math.round(userData.averageInterest * 10) / 10,
      debtCount: userData.debts.length
    },
    
    // No personal identifiers
    context: {
      hasExtraPaymentCapacity: userData.extraPayment > 0,
      timeframe: userData.targetTimeframe || 'not_specified'
    }
  };
  
  // Verify no sensitive data leakage
  const serialized = JSON.stringify(anonymized);
  if (containsSensitiveData(serialized)) {
    throw new Error('Sensitive data detected in anonymized payload');
  }
  
  return anonymized;
};

const containsSensitiveData = (data) => {
  const sensitivePatterns = [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
    /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, // SSNs
    /@|email|user_|customer_/, // Identifiers
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(data));
};
```

## 💡 Prompt Engineering System

### System Prompts Library

#### Base UK Debt Coach Persona
```javascript
const SYSTEM_PROMPTS = {
  baseCoach: `
    You are a confident UK debt management coach specialising in the debt snowball method. 
    You provide clear, practical advice using British English and UK financial terminology.

    Core Expertise:
    - Snowball and Avalanche debt elimination methods
    - UK financial landscape (APR, priority debts, consumer rights)
    - Mathematical accuracy in all calculations
    - Educational guidance (never regulated financial advice)
    
    Communication Style:
    - Clear, concise British English
    - No financial jargon - plain speaking
    - Structured responses: Snapshot → Maths → Actions → Risks → Milestone
    - Encouraging but realistic tone
    
    UK Context:
    - Use APR (not interest rate)
    - Recognise priority debts (council tax, rent, secured loans)
    - Reference Section 75 protection where relevant
    - Understand overdrafts, hire purchase, guarantor loans
    
    Privacy & Compliance:
    - All data is anonymised (no personal identifiers)
    - Always include educational disclaimer
    - Never provide regulated financial advice
    
    Standard disclaimer: "This is educational information only and is not regulated 
    financial advice. Consider speaking with a qualified debt adviser for your specific circumstances."
  `,
  
  // Tier-specific prompt appendices
  freeTierAppendix: `
    TIER: FREE/DEMO USER
    - Keep responses brief (max 150 words)
    - Provide basic advice only, no deep projections
    - After 2-3 responses, gently suggest upgrading for advanced features
    - No complex scenario analysis
    - Focus on immediate next steps
    
    Upgrade prompt: "For detailed payoff projections and personalised strategies, 
    consider upgrading to Pro access."
  `,
  
  proTierAppendix: `
    TIER: PRO SUBSCRIBER
    - Provide comprehensive responses with full payoff timelines
    - Include scenario analysis (extra payments, strategy changes)
    - Reference user's full debt history for context
    - Offer specific monthly targets and projections
    - Generate detailed milestone plans
  `,
  
  foundersTierAppendix: `
    TIER: FOUNDERS ACCESS
    - Provide extensive multi-year projections
    - Include budget integration advice
    - Offer comprehensive debt strategy reviews
    - Generate detailed PDF-ready reports
    - Provide advanced "what-if" scenario modelling
    - Include post-debt financial planning suggestions
  `,
  
  reportGenerator: `
    You are a UK financial analyst specialising in debt elimination strategies. 
    Generate comprehensive, professional reports using British English and UK financial terminology.

    Report Structure:
    1. Executive Summary (key insights and opportunities)
    2. Current Situation Analysis (debt composition, patterns, UK context)
    3. Strategic Recommendations (specific action items with UK regulations in mind)
    4. Timeline Analysis (projections and scenarios using APR calculations)
    5. Next Steps & Milestones (encouragement and momentum with UK resources)
    
    UK Analysis Focus:
    - Identify priority vs non-priority debts
    - Consider UK consumer protection rights
    - Reference relevant UK debt support organisations
    - Use APR for all interest rate calculations
    - Consider UK-specific debt types (overdrafts, hire purchase, etc.)
    
    Format as markdown with clear sections, bullet points, and actionable insights.
    Always include educational disclaimer about regulated financial advice.
  `,
  
  dataParser: `
    You are a data extraction specialist. Parse user input to extract debt information with high accuracy.

    Guidelines:
    - Extract debt name, balance, minimum payment, interest rate, and type
    - Make reasonable assumptions for missing data
    - Use conservative estimates
    - Return only valid JSON structure
    - Do not include explanatory text
    
    Default Assumptions:
    - Credit cards: 18-22% interest, 2-3% minimum payment
    - Personal loans: 8-15% interest, fixed payments
    - Student loans: 4-8% interest, fixed payments
    - Overdrafts: 15-25% interest, variable payments
    
    Always prioritize accuracy over completeness.
  `
};
```

### Dynamic Context Building

#### Smart Context Assembly
```javascript
// src/utils/contextBuilder.js
export const buildAIContext = (user, debts, conversationHistory = []) => {
  const context = {
    // Anonymous financial snapshot
    debtPortfolio: anonymizeDebts(debts),
    
    // Calculated insights
    insights: {
      totalBalance: debts.reduce((sum, d) => sum + d.balance, 0),
      highestInterest: Math.max(...debts.map(d => d.interestRate)),
      lowestBalance: Math.min(...debts.map(d => d.balance)),
      monthlyMinimums: debts.reduce((sum, d) => sum + d.minPayment, 0),
      snowballOrder: debts.sort((a, b) => a.balance - b.balance)
    },
    
    // Strategic context
    strategy: {
      currentApproach: determineCurrentStrategy(debts),
      potentialSavings: calculatePotentialSavings(debts),
      payoffTimeframe: estimatePayoffTime(debts),
      quickWins: identifyQuickWins(debts)
    },
    
    // Conversation continuity
    recentTopics: extractRecentTopics(conversationHistory),
    userConcerns: identifyUserConcerns(conversationHistory)
  };
  
  return context;
};

const determineCurrentStrategy = (debts) => {
  const sortedByBalance = [...debts].sort((a, b) => a.balance - b.balance);
  const sortedByInterest = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  
  // Check if user is following snowball method
  const isSnowball = debts.every((debt, index) => {
    return debt.order === sortedByBalance.findIndex(d => d.id === debt.id) + 1;
  });
  
  const isAvalanche = debts.every((debt, index) => {
    return debt.order === sortedByInterest.findIndex(d => d.id === debt.id) + 1;
  });
  
  return {
    method: isSnowball ? 'snowball' : isAvalanche ? 'avalanche' : 'custom',
    alignment: isSnowball ? 'optimal' : 'needs_review'
  };
};
```

## 📊 AI Usage Analytics & Monitoring

### Usage Tracking Implementation

#### AI Feature Analytics
```javascript
// Track AI feature usage
export const trackAIUsage = async (userId, feature, tokensUsed, db) => {
  await db
    .prepare(`
      INSERT INTO ai_usage_log (
        user_id, feature, tokens_used, cost_estimate, 
        timestamp, model_used
      ) VALUES (?, ?, ?, ?, datetime('now'), ?)
    `)
    .run(
      userId, 
      feature, 
      tokensUsed, 
      estimateTokenCost(tokensUsed), 
      'gpt-4'
    );
    
  // Track in analytics
  track('ai_feature_used', {
    feature: feature,
    tokens_used: tokensUsed,
    user_tier: 'pro' // Only pro users have AI access
  });
};

const estimateTokenCost = (tokens) => {
  // GPT-4 pricing as of 2025
  const costPer1000Tokens = 0.03; // $0.03 per 1K tokens
  return (tokens / 1000) * costPer1000Tokens;
};
```

#### Performance Monitoring
```javascript
// Monitor AI response times and quality
export const monitorAIPerformance = {
  trackResponseTime: (feature, startTime) => {
    const duration = Date.now() - startTime;
    track('ai_response_time', {
      feature: feature,
      duration_ms: duration,
      performance_tier: duration < 3000 ? 'fast' : duration < 8000 ? 'normal' : 'slow'
    });
  },
  
  trackUserSatisfaction: (feature, rating) => {
    track('ai_satisfaction', {
      feature: feature,
      rating: rating, // 1-5 scale
      timestamp: new Date().toISOString()
    });
  },
  
  trackErrorRate: (feature, errorType) => {
    track('ai_error', {
      feature: feature,
      error_type: errorType,
      timestamp: new Date().toISOString()
    });
  }
};
```

### Cost Management & Optimization

#### Token Usage Optimization
```javascript
// Optimize prompts for token efficiency
export const optimizePrompt = (basePrompt, context) => {
  // Remove redundant information
  const essentialContext = extractEssentialContext(context);
  
  // Use abbreviated format for debt data
  const compactDebts = context.debts.map(d => 
    `${d.balance}/${d.minPayment}/${d.interestRate}%`
  ).join('|');
  
  const optimizedPrompt = `
    ${basePrompt}
    
    Debts (balance/minPayment/rate): ${compactDebts}
    Total: ${context.summary.totalBalance}
    Context: ${essentialContext}
  `;
  
  return optimizedPrompt;
};

// Enhanced rate limiting with tier-based limits
export const rateLimitAI = async (userId, feature, userTier = 'free') => {
  const today = new Date().toISOString().split('T')[0];
  
  const usage = await db
    .prepare(`
      SELECT COUNT(*) as count, SUM(tokens_used) as tokens
      FROM ai_usage_log 
      WHERE user_id = ? AND feature = ? AND DATE(timestamp) = ?
    `)
    .first(userId, feature, today);
  
  // Get tier-specific limits
  const tierLimits = AI_USAGE_LIMITS[userTier] || AI_USAGE_LIMITS.free;
  const featureLimits = tierLimits[feature];
  
  if (!featureLimits) {
    throw new Error(`Feature ${feature} not available for ${userTier} tier`);
  }
  
  const { dailyRequests, dailyTokens } = featureLimits;
  
  if (usage.count >= dailyRequests) {
    throw new Error(`Daily request limit reached (${dailyRequests} for ${userTier})`);
  }
  
  if (usage.tokens >= dailyTokens) {
    throw new Error(`Daily token limit reached (${dailyTokens} for ${userTier})`);
  }
  
  // Return remaining quota for user feedback
  return {
    remainingRequests: dailyRequests - usage.count,
    remainingTokens: dailyTokens - (usage.tokens || 0),
    resetTime: 'UTC midnight'
  };
};
```

## 🔧 AI System Maintenance

### Model Management & Updates

#### Version Control
```javascript
// AI model configuration by tier
const AI_MODELS = {
  free: {
    coach: 'gpt-3.5-turbo',
    reports: null, // Not available
    parser: 'gpt-3.5-turbo'
  },
  
  pro: {
    coach: 'gpt-4',
    reports: 'gpt-4',
    parser: 'gpt-3.5-turbo'
  },
  
  founders: {
    coach: 'gpt-4-turbo',
    reports: 'gpt-4',
    parser: 'gpt-3.5-turbo'
  },
  
  fallback: {
    coach: 'gpt-3.5-turbo',
    reports: 'gpt-3.5-turbo',
    parser: 'gpt-3.5-turbo'
  }
};

export const getModelForFeature = (feature, userTier = 'free') => {
  const envModel = process.env.REACT_APP_AI_MODEL_OVERRIDE;
  if (envModel) return envModel;
  
  const tierModels = AI_MODELS[userTier] || AI_MODELS.free;
  return tierModels[feature] || AI_MODELS.fallback[feature];
};
```

#### Health Checks & Fallbacks
```javascript
// AI service health monitoring
export const checkAIHealth = async () => {
  try {
    const testPrompt = "Respond with 'OK' if this system is working correctly.";
    const response = await callOpenAI(testPrompt, 'gpt-3.5-turbo');
    
    return {
      status: response.includes('OK') ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Graceful degradation
export const handleAIFailure = (feature, error) => {
  console.error(`AI service failed for ${feature}:`, error);
  
  const fallbackResponses = {
    ai_coach: "I'm temporarily unavailable. Try the debt calculator or review your payment strategy in the meantime.",
    ai_report: "Report generation is temporarily unavailable. You can view your debt timeline and progress charts instead.",
    parser: "Smart parsing is unavailable. Please enter your debt information manually."
  };
  
  return {
    success: false,
    fallbackMessage: fallbackResponses[feature],
    retryAfter: 300 // 5 minutes
  };
};
```

## 🔗 Related Documentation

- **[Technical Architecture](./TECH_ARCHITECTURE.md)** - AI service integration and privacy controls
- **[Data Model](./DATA_MODEL.md)** - AI usage tracking and data anonymization
- **[Subscriptions](./SUBSCRIPTIONS.md)** - **CRITICAL**: Tier definitions and feature gating (must stay in sync)
- **[Analytics](./ANALYTICS.md)** - AI usage analytics and performance tracking
- **[Operations](./OPERATIONS.md)** - AI service monitoring and maintenance
- **[Content Style Guide](./CONTENT_STYLE_GUIDE.md)** - UK terminology and compliance standards

## 📋 Implementation Checklist

### Frontend Updates Required
- [ ] Update AI feature gating to use new tier limits
- [ ] Add usage quota display in AI Coach interface
- [ ] Implement tier-specific prompt selection
- [ ] Add upgrade prompts for Free tier users
- [ ] Update marketing copy to remove "unlimited" language

### Backend Updates Required
- [ ] Implement enhanced `rateLimitAI` function
- [ ] Update model selection logic with tier awareness
- [ ] Add usage quota API endpoints
- [ ] Configure tier-specific prompt appendices
- [ ] Update analytics tracking for tier-based usage

### Documentation Sync
- [ ] Ensure SUBSCRIPTIONS.md tier table matches AI capabilities
- [ ] Update FEATURE_SUMMARY.md with realistic AI usage language
- [ ] Verify CONTENT_STYLE_GUIDE.md compliance in AI responses

---

*This enhanced AI system provides tiered debt management assistance with realistic usage limits, UK-focused expertise, and comprehensive privacy protection while maintaining clear upgrade incentives.*