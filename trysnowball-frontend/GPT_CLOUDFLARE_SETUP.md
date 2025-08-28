# GPT API Configuration for Cloudflare Pages

## Overview
The application requires GPT API configuration to enable AI-powered debt parsing and coaching features. Without these environment variables, the app falls back to basic pattern matching with a "AI parsing is not available" banner.

## Required Environment Variables

Add these environment variables in the Cloudflare Pages dashboard:

### 1. GPT API Endpoint
```
REACT_APP_GPT_ENDPOINT=https://api.openai.com/v1/chat/completions
```

### 2. GPT API Key
```
REACT_APP_GPT_API_KEY=sk-proj-your-actual-openai-api-key-here
```

### 3. Optional Debug Flag
```
REACT_APP_GPT_DEBUG=false
```

## How to Set Environment Variables in Cloudflare Pages

1. **Go to Cloudflare Pages Dashboard**
   - Navigate to your TrySnowball project in Cloudflare Pages

2. **Access Settings**
   - Click on the "Settings" tab
   - Scroll to "Environment Variables" section

3. **Add Production Variables**
   - Click "Add variable"
   - Set `Variable name`: `REACT_APP_GPT_ENDPOINT`
   - Set `Value`: `https://api.openai.com/v1/chat/completions`
   - Select `Production` environment
   - Click "Save"

4. **Add API Key Variable**
   - Click "Add variable" again
   - Set `Variable name`: `REACT_APP_GPT_API_KEY`
   - Set `Value`: Your actual OpenAI API key (starts with `sk-proj-`)
   - Select `Production` environment
   - Click "Save"

## Getting OpenAI API Key

1. **Go to OpenAI Platform**
   - Visit https://platform.openai.com/api-keys

2. **Create New Key**
   - Click "Create new secret key"
   - Name it "TrySnowball Production"
   - Copy the key (it starts with `sk-proj-`)

3. **Set Usage Limits** (Recommended)
   - Set monthly usage limits to control costs
   - GPT-4o costs approximately $0.005 per 1K input tokens and $0.010 per 1K output tokens

## Verification

After setting the environment variables:

1. **Trigger a new deployment** in Cloudflare Pages
2. **Test the debt paste feature** on the live site
3. **Verify no "AI parsing is not available" banner appears**

## Files Affected

- `src/config/gptConfig.js` - Configuration and validation
- `src/components/DebtPasteInput.jsx` - Shows fallback banner when missing
- `src/hooks/useGPTAgent.js` - Handles API calls
- `src/utils/gptDebtParser.js` - Parsing logic
- `src/utils/gptShareMessages.js` - Social sharing messages

## Cost Considerations

- **GPT-4o Model**: More expensive but better at parsing complex debt tables
- **Token Limits**: Set per agent type in `gptConfig.js`
- **Usage Monitoring**: Consider implementing usage tracking in production

## Troubleshooting

### Still seeing "AI parsing is not available"?
1. Check environment variables are set in Cloudflare Pages
2. Trigger a new deployment after adding variables
3. Check browser console for validation errors
4. Verify API key is valid and has credits

### API Key Not Working?
1. Ensure key starts with `sk-proj-` (new format)
2. Check OpenAI account has sufficient credits
3. Verify no rate limiting or usage caps exceeded

## Security Notes

- **Never commit API keys to git**
- **Use production keys only in production environment**
- **Consider setting usage limits to prevent unexpected charges**
- **Rotate keys periodically for security**