# GPT API Setup Guide for TrySnowball

## 🔑 Getting Your OpenAI API Key

1. **Create OpenAI Account**
   - Go to https://platform.openai.com/
   - Sign up or log in with your account

2. **Generate API Key**
   - Navigate to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Name it something like "TrySnowball Production"
   - **Copy the key immediately** - you won't see it again!

3. **Add Payment Method**
   - Go to https://platform.openai.com/account/billing
   - Add a payment method to enable API access
   - Set usage limits if desired (recommended: $10-20/month)

## ⚙️ Configuration Setup

1. **Environment Variables**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Edit .env.local with your API key
   REACT_APP_GPT_ENDPOINT=https://api.openai.com/v1/chat/completions
   REACT_APP_GPT_API_KEY=sk-proj-your-actual-api-key-here
   ```

2. **Verify Setup**
   - Start your development server: `npm start`
   - Go to `/ai/coach` page
   - Header should show "Your AI debt coach" (not "Limited offline mode")
   - Try asking Yuki a question

## 💰 Cost Control Features

**Built-in Limits:**
- **Model**: GPT-3.5-turbo-1106 (cheapest option ~$0.0015/1K tokens)
- **Token Limits by Feature**:
  - Coach Chat: 600 tokens max per response
  - Debt Import: 700 tokens max
  - Share Messages: 150 tokens max

**Cost Estimation:**
- Typical chat message: ~$0.002-0.005
- Heavy usage (100 messages/day): ~$15-25/month
- Light usage (20 messages/day): ~$3-8/month

## 🛠️ Advanced Configuration

**Custom Model (Optional):**
```javascript
// In src/config/gptConfig.js
export const GPT_CONFIG = {
  model: "gpt-4o-mini", // More expensive but higher quality
  max_tokens: {
    coach: 800,  // Increase for longer responses
    // ...
  }
};
```

**Usage Monitoring:**
- Check usage at https://platform.openai.com/usage
- Set up billing alerts in OpenAI dashboard
- Monitor via browser console (development mode shows token estimates)

## 🚨 Troubleshooting

**"Limited offline mode" shown:**
- Check `.env.local` file exists and has correct API key
- Verify API key starts with `sk-proj-` or `sk-`
- Restart development server after adding env vars

**API calls failing:**
- Check OpenAI billing dashboard for payment issues
- Verify API key hasn't expired
- Check browser console for specific error messages

**High costs:**
- Review token limits in `gptConfig.js`
- Monitor usage patterns in OpenAI dashboard
- Consider reducing `max_tokens` limits

## 🔒 Security Notes

- **Never commit `.env.local` to git** (already in .gitignore)
- Use separate API keys for development/production
- Rotate keys periodically
- Set usage limits in OpenAI dashboard

## 📊 Usage Analytics

The app tracks:
- Number of GPT calls per agent type
- Token usage estimates (development mode)
- Fallback usage when offline
- Response success/failure rates

Check browser console for detailed GPT usage logs during development.

---

**Need Help?** 
- OpenAI API Docs: https://platform.openai.com/docs/
- TrySnowball GPT Config: `src/config/gptConfig.js`
- Usage Monitor: Browser Console → "GPT" logs