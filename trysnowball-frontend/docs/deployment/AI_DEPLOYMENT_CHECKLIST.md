# 🤖 AI System Deployment Checklist

## ✅ **Development Complete**

### **Infrastructure Created:**
- [x] `src/config/ai.ts` - Single source of truth for AI config with Zod validation
- [x] `src/ai/provider.ts` - Edge-compatible AI client factory (no SDK dependencies)
- [x] `cloudflare-workers/routes/ai.ts` - Secure Worker endpoints (`/ai/chat`, `/ai/health`, `/ai/ingest-debts`)
- [x] `cloudflare-workers/migrations/0003_create_ai_usage.sql` - D1 table for token budget tracking
- [x] `src/hooks/useGPTAgent.js` - Updated to route through Worker (eliminates client-side API keys)

### **Configuration Updated:**
- [x] `wrangler.toml` - Added AI variables and production overrides
- [x] `.env` - Added client-safe AI environment variables
- [x] **No API keys exposed to client** - All secrets stay server-side

### **Cost Controls Implemented:**
- [x] **Daily token budget:** 250k dev / 100k prod (configurable via `GPT_DAILY_TOKEN_BUDGET`)
- [x] **Cheap defaults:** gpt-4o-mini, 512 max tokens, temperature 0.2
- [x] **Request timeouts:** 15s dev / 10s prod
- [x] **Usage tracking:** All requests logged to D1 `ai_usage` table
- [x] **Automatic fallbacks:** Mock provider for missing API keys in development

---

## 🚀 **Deployment Steps**

### **1. Deploy Worker Infrastructure**
```bash
# Navigate to workers directory
cd cloudflare-workers/

# Run database migration
wrangler d1 execute auth_db --file=migrations/0003_create_ai_usage.sql

# Add OpenAI API key to Worker secrets
wrangler secret put OPENAI_API_KEY

# Deploy to staging first
wrangler deploy --env staging

# Test health endpoint
curl https://staging-trysnowball.pages.dev/ai/health
```

### **2. Test AI Endpoints**
```bash
# Test chat endpoint
curl -X POST https://staging-trysnowball.pages.dev/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt":"You are a debt coach","userMessage":"Help me pay off debt"}'

# Test ingestion endpoint
curl -X POST https://staging-trysnowball.pages.dev/ai/ingest-debts \
  -H "Content-Type: application/json" \
  -d '{"text":"Credit card £1200 at 19% APR, Car loan £5000 at 4.9%"}'

# Test health check
curl https://staging-trysnowball.pages.dev/ai/health
```

### **3. Verify Budget Controls**
```bash
# Check D1 usage table
wrangler d1 execute auth_db --command "SELECT * FROM ai_usage WHERE date = date('now')"

# Verify budget enforcement (should return 429 when exceeded)
# Run multiple requests to test rate limiting
```

### **4. Frontend Deployment**
```bash
# Update environment variables for production
# Ensure REACT_APP_AI_ENABLED=true
# Ensure REACT_APP_WORKER_URL points to correct Worker

# Deploy frontend
npm run build
# Deploy build/ to hosting platform
```

### **5. Production Deployment**
```bash
# Deploy to production only after staging tests pass
wrangler deploy --env production

# Verify production health
curl https://trysnowball.co.uk/ai/health
```

---

## 🔍 **Testing Checklist**

### **Client-Side AI Integration:**
- [ ] **DebtPasteInput**: AI parsing works without "AI parsing not available" warning
- [ ] **AI Coach**: Chat responses work through Worker endpoint  
- [ ] **AI Report**: Report generation works without client-side API calls
- [ ] **Share Messages**: AI-generated social posts work

### **Error Handling:**
- [ ] **Budget exceeded**: Graceful fallback when daily token limit hit
- [ ] **API key missing**: Falls back to mock provider in development
- [ ] **Network timeout**: User-friendly error messages
- [ ] **Rate limiting**: Clear messaging about temporary limits

### **Performance:**
- [ ] **Response times**: < 5 seconds for chat, < 10 seconds for ingestion  
- [ ] **Fallback speed**: < 100ms for fallback responses
- [ ] **Bundle size**: No increase from removing direct OpenAI SDK calls

---

## 📊 **Monitoring & Maintenance**

### **Daily Monitoring:**
- Check D1 `ai_usage` table for token consumption trends
- Monitor Worker logs for error patterns
- Verify budget controls are working (no runaway costs)

### **Weekly Review:**
- Analyze popular AI use cases and adjust token budgets
- Review fallback usage rates (high rates indicate availability issues)
- Check response quality and adjust prompts if needed

### **Cost Optimization:**
- **Current target:** <$10/month for moderate usage
- **Budget alerts:** Set up monitoring for >80% daily budget usage
- **Model optimization:** Consider gpt-4o-mini vs gpt-4o based on usage patterns

---

## 🛠️ **Environment Variables Reference**

### **Worker (Cloudflare Secrets):**
```
OPENAI_API_KEY          # Secret: OpenAI API key
```

### **Worker (wrangler.toml vars):**
```
AI_PROVIDER             # "openai" or "mock"
GPT_MODEL_CHAT          # "gpt-4o-mini" (default)
GPT_MODEL_INGEST        # "gpt-4o-mini" (default)  
GPT_TIMEOUT_MS          # 15000 (dev) / 10000 (prod)
GPT_MAX_TOKENS          # 512 (default)
GPT_STREAMING           # "on" (dev) / "off" (prod)
GPT_DAILY_TOKEN_BUDGET  # 250000 (dev) / 100000 (prod)
GPT_ENABLED             # "true"
```

### **Client (.env):**
```
REACT_APP_AI_ENABLED    # "true" (controls UI availability)
REACT_APP_WORKER_URL    # Worker endpoint URL
```

---

## ✅ **Success Criteria**

1. **No more "AI parsing not available" warnings** in DebtPasteInput
2. **All AI features work** through secure Worker endpoints
3. **Zero API keys exposed** to client-side code  
4. **Daily costs under $10** with budget controls active
5. **Graceful fallbacks** when AI unavailable
6. **Sub-5s response times** for typical AI requests

---

## 🆘 **Rollback Plan**

If issues occur:

1. **Disable AI client-side:** Set `REACT_APP_AI_ENABLED=false`
2. **Disable Worker AI:** Set `GPT_ENABLED=false` in wrangler.toml
3. **Emergency fallback:** All components have fallback responses built-in

The system is designed to **fail gracefully** - users can always use manual debt entry and get static coaching advice even if AI is completely unavailable.