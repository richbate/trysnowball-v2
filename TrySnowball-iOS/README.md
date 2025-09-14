# TrySnowball RSS Update Fix

## Problem
GitHub Actions was failing with RSS parsing error:
```
Error parsing RSS: Error: Unencoded <
Line: 0
Column: 767
Char: =
```

## Solution
Created a robust RSS parser (`update-articles.js`) that handles malformed XML by:

1. **Pre-cleaning XML**: Sanitizes malformed characters before parsing
2. **Graceful fallback**: Multiple parsing attempts with increasingly lenient settings
3. **CDATA handling**: Properly processes CDATA sections from Substack
4. **Error resilience**: Creates fallback empty file instead of failing build

## Files Created
- `update-articles.js` - Robust RSS parser with error handling
- `.github/workflows/update-articles.yml` - GitHub Actions workflow
- `package.json` - Dependencies for xml2js
- `test-rss.js` - Local testing script

## Testing
```bash
npm install
node test-rss.js
```

The parser now successfully processes the Substack RSS feed and produces clean JSON output with proper error handling.

## GitHub Actions Workflow
- Runs every 6 hours
- Can be triggered manually
- Only commits if articles have changed
- Won't fail the build if RSS is temporarily unavailable