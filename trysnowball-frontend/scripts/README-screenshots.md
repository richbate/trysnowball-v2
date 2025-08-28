# TrySnowball Screenshot Generator

Automatically generates a comprehensive slide deck of your app by capturing screenshots of all pages, including authentication-gated content.

## Quick Start

```bash
# Production screenshots (requires magic-link email access)
npm run screenshots

# Local development screenshots  
npm run screenshots:local

# Custom configuration
node scripts/generate-screenshots.js --base=https://staging.example.com --email=your@email.com
```

## Features

✅ **Magic Link Authentication** - Automatically handles your auth flow  
✅ **Full Coverage** - Screenshots all public + protected routes  
✅ **High Quality** - Retina screenshots optimized for presentations  
✅ **Auto PDF Generation** - Combines screenshots into a slide deck  
✅ **Configurable** - Custom URLs, emails, and output options  

## Authentication Flow

The script will:
1. Request a magic link for the specified email
2. Pause and wait for you to click the link in your email
3. Continue with authenticated screenshots once logged in
4. Gracefully handle auth failures (public pages only)

## Output

Screenshots are saved to `screenshots/` directory:
- `01-home.png`, `02-how-it-works.png`, etc.
- `trysnowball-slides.pdf` (if ImageMagick is installed)

## Requirements

### Required
- Node.js + npm
- Puppeteer (installed automatically)

### Optional
- **ImageMagick** for PDF generation:
  ```bash
  # macOS
  brew install imagemagick
  
  # Ubuntu/Debian  
  sudo apt-get install imagemagick
  
  # Windows
  winget install ImageMagick.ImageMagick
  ```

## Configuration

### Environment Variables
```bash
SCREENSHOT_BASE_URL=https://staging.example.com
SCREENSHOT_EMAIL=demo@example.com
```

### Command Line Options
```bash
--base=URL     # Base URL override
--email=EMAIL  # Email for authentication
--help         # Show help
```

## Pages Captured

### Public Pages
- Homepage
- How It Works
- Knowledge Library  
- Login Page
- Upgrade Plans
- Security & Privacy

### Protected Pages (requires auth)
- My Debt Plan (all tabs)
  - Debts Management
  - Payment Strategy  
  - Debt-Free Forecast
  - Financial Goals
- AI Debt Coach
- Profile Settings

## Troubleshooting

### "Magic link timeout"
- Check your email for the magic link
- Click it within 5 minutes
- Ensure you're using a valid email address

### "PDF generation failed"  
- Install ImageMagick (see requirements above)
- Or manually import PNG files into your slide tool

### "Screenshots look wrong"
- Try `--base=http://localhost:3000` for local dev
- Check that all routes exist and are accessible
- Ensure the app is running if using local URL

## Usage in CI/CD

```yaml
# GitHub Actions example
- name: Generate Screenshots
  run: |
    npm run build
    npm start &
    sleep 5
    npm run screenshots:local
  env:
    SCREENSHOT_EMAIL: ${{ secrets.DEMO_EMAIL }}

- name: Upload Screenshots
  uses: actions/upload-artifact@v4  
  with:
    name: app-screenshots
    path: screenshots/
```

## Next Steps

1. **Import to Slide Tool**: Drag PNG files into Keynote, PowerPoint, or Google Slides
2. **Add Annotations**: Include titles, callouts, and explanations  
3. **Create Flow**: Arrange slides to show user journey
4. **Export**: Generate final presentation PDF/PPTX

Perfect for pitch decks, feature documentation, and user onboarding materials!