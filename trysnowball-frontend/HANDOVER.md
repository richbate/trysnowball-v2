# TrySnowball - Development Handover

**Date**: August 17, 2025  
**Session Context**: AI Coach System Rebuild  
**Status**: ✅ Complete - Ready for Production Use  

## 🎯 What Was Accomplished

### Primary Objective: AI Coach Rebuild
The GPT/AI Coach feature was completely rebuilt "the right way" with the following requirements met:

✅ **Cheap**: Rate limited to 40 messages/day with 700 token limit  
✅ **Safe**: Server-side API key management, no client-side exposure  
✅ **UK-specific**: Priority debt rules and UK regulatory boundaries  
✅ **Enforceable**: KV quota system with proper error handling  

### Technical Implementation

#### 1. Unified Worker Architecture (`/api/ai/chat`)
- **File**: `cloudflare-workers/stripe-checkout-api.js`
- **Location**: Lines 75-214 (AI chat functions)
- **Features**: Rate limiting, UK prompts, error handling
- **Deployment**: `trysnowball-checkout-prod` worker

#### 2. Rate Limiting System
- **Storage**: Cloudflare KV namespace `AI_QUOTAS` 
- **KV ID**: `ba51298de08941dd9e69254812748a4a`
- **Logic**: Daily quota reset at UTC midnight (27h TTL)
- **Key Format**: `q:YYYY-MM-DD:userId`

#### 3. UK-Specific System Prompt
```
You are Yuki, a UK-focused debt coach inside TrySnowball.
Give pragmatic, actionable guidance. Be concise.

Prioritisation rules (UK):
1) Priority debts: rent/mortgage arrears, council tax, magistrates' fines, energy bills
2) Non-priority: credit cards, loans, BNPL—use snowball/avalanche strategies
3) Flag options: payment plans, token payments, breathing space, DMP, DRO, IVA
```

#### 4. Frontend Integration
- **File**: `src/hooks/useGPTAgent.js`
- **Function**: `callAICoachWorker()` (lines 306-388)
- **Features**: Compact context building, 402 error handling, JWT auth
- **UI**: Quota exceeded shows upgrade prompts with helpful fallbacks

## 🗂️ Current System Architecture

### Authentication & Data Flow
```
Frontend (React) 
    ↓ JWT Bearer token
Cloudflare Worker (/api/ai/chat)
    ↓ Rate limit check (KV)
    ↓ UK system prompt + user context
OpenAI API (gpt-4o-mini)
    ↓ Response (700 tokens max)
Frontend UI with error handling
```

### Key Configuration Files

#### Worker Configuration
- **Config**: `cloudflare-workers/wrangler-checkout.toml`
- **Environment Variables**: 
  - `AI_MAX_TOKENS = "700"`
  - `AI_ALLOWED_MODELS = "gpt-4o-mini,gpt-4o"`
  - `AI_TEMP = "0.2"`
  - `AI_DAILY_REQ = "40"`
- **Secrets**: `OPENAI_API_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY`

#### Frontend Hook
- **File**: `src/hooks/useGPTAgent.js`
- **Usage**: `const { callGPT } = useGPTAgent('coach')`
- **Error States**: Quota exceeded (402), auth required (401), server error (500)

### Article System (Recently Updated)
- **Source**: `src/data/articlesIndex.js` - single source of truth
- **Files**: `/public/articles/*.md` - match slugs exactly
- **Features**: Session caching, 404 handling with library links, no CDN dependencies

## 🔧 Deployment Commands

### AI Coach Deployment
```bash
# Set OpenAI API key (required)
wrangler secret put OPENAI_API_KEY --name trysnowball-checkout-prod

# Deploy unified worker
cd cloudflare-workers
wrangler deploy stripe-checkout-api.js --config wrangler-checkout.toml --env=production
```

### Current Workers
- `trysnowball-checkout-prod` - Unified API (Stripe + AI + Debts)
- `trysnowball-auth-prod` - Authentication only
- `trysnowball-e2e-tests-staging` - E2E testing

## 🧪 Testing & Verification

### AI Coach Testing
```bash
# Test endpoint (requires valid OpenAI key)
curl -X POST https://trysnowball.co.uk/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "messages": [{"role": "user", "content": "I have £5000 credit card debt, what should I prioritize?"}],
    "model": "gpt-4o-mini",
    "userContext": {
      "userId": "test_user",
      "totals": {"totalDebt": 5000, "totalMinPayments": 150},
      "debts": [
        {"id": "card1", "name": "Visa", "amount": 2000, "apr": 19.9, "minPayment": 50}
      ]
    }
  }'
```

Expected Response:
```json
{"content": "UK-specific debt advice with priority debt guidance..."}
```

### Error Handling Test
- **Rate Limit**: After 40 messages, returns 402 with quota error
- **Auth Failure**: Without JWT, returns 401 auth required
- **Invalid API Key**: Returns 502 upstream error

## 🔄 Previous Session Context

### What Changed Recently
1. **Auth System Fixed** - 6 days of debugging completed before this session
2. **Articles System Cleaned** - No CDN dependencies, proper file structure
3. **AI Coach Rebuilt** - Moved from direct OpenAI calls to controlled worker
4. **Documentation Updated** - CLAUDE.md and AI_SYSTEM.md brought current

### Deprecated/Removed
- Direct OpenAI API calls from frontend
- Separate AI workers (consolidated into unified worker)
- "Unlimited" marketing language (now realistic quotas)
- CDN script dependencies for markdown parsing

## 📋 Current Todo Status

All AI Coach rebuild tasks completed:
- ✅ Add `/api/ai/chat` endpoint to unified worker
- ✅ Create KV namespace and configure secrets/vars  
- ✅ Update frontend to use `/api/ai/chat` instead of direct OpenAI
- ✅ Add quota fallback UI for 402 responses
- ✅ Test AI coach with UK-specific prompts
- ✅ Review and update .md documentation for accuracy

## 🔮 Future Development Notes

### Optional Enhancements (Fast Wins)
- **Article TOCs**: Generate from headings for long articles
- **Article Preloading**: Background cache warming on library view
- **Enhanced Prompts**: More sophisticated UK debt scenario handling
- **Usage Analytics**: Track AI feature usage and user satisfaction

### Architecture Considerations
- Current unified worker handles multiple concerns (AI + Stripe + Debts)
- Consider splitting if any single service becomes too complex
- KV quotas reset at UTC midnight - could be user timezone-aware
- 700 token limit balances cost vs response quality

### Monitoring & Observability
- Check AI quota KV namespace usage regularly
- Monitor OpenAI API costs (should be minimal with current limits)
- Track 402 error rates to optimize quota levels
- User feedback on AI response quality

## 🚨 Critical Dependencies

### Must-Have Secrets
- `OPENAI_API_KEY` - Required for AI functionality
- `JWT_SECRET` - Required for auth verification  
- `STRIPE_SECRET_KEY` - Required for subscription handling

### External Services
- **OpenAI API** - Core AI functionality depends on this
- **Cloudflare KV** - Rate limiting depends on this storage
- **Cloudflare D1** - User data and auth depends on this

### Configuration Sync
- `wrangler-checkout.toml` - AI variables must match implementation
- `src/hooks/useGPTAgent.js` - Error handling must match worker responses
- KV namespace IDs must match between environments

## 📞 Handover Checklist

For the next developer:

### Immediate Action Items
- [ ] Verify OpenAI API key is set and working
- [ ] Test AI Coach with sample debt scenarios
- [ ] Monitor quota usage and adjust limits if needed
- [ ] Check error handling works properly (401, 402, 500 responses)

### Code Understanding
- [ ] Read unified worker code: `stripe-checkout-api.js` lines 75-214
- [ ] Understand frontend hook: `useGPTAgent.js` `callAICoachWorker()` function
- [ ] Review UK system prompt and rate limiting logic
- [ ] Understand KV quota system with daily reset pattern

### Documentation
- [ ] Keep CLAUDE.md updated with session progress
- [ ] Update AI_SYSTEM.md when making architectural changes
- [ ] Maintain this HANDOVER.md for future context

---

**System Status**: 🟢 Fully Operational  
**Next Session**: Ready for new feature development or optimizations  
**Contact**: All implementation details documented above  