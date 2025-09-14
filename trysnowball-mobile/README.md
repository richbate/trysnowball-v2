# TrySnowball Mobile App

A React Native iOS app for tracking your debt-free journey using the debt snowball method.

## 🚀 Features

- **Magic Link Authentication** - Secure login via email (no passwords)
- **Debt Management** - Add, edit, and track all your debts
- **Progress Visualization** - Interactive timeline showing your debt-free journey
- **Milestone Celebrations** - Share achievements with friends
- **Referral System** - Invite friends and earn rewards
- **Cloud Sync** - Data syncs across all devices
- **Demo Mode** - Try the app without signing up
- **Dark Mode** - Beautiful UI that adapts to system preferences

## 📱 Screenshots

<!-- Add screenshots here when available -->

## 🏗️ Architecture

### Data Flow
```
Mobile App ↔ TrySnowball Cloud API ↔ Cloudflare D1 Database
     ↕
Local AsyncStorage (cache & offline)
```

### Tech Stack
- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6
- **State Management**: Zustand with persistence
- **UI Components**: Custom components with themed design system  
- **Charts**: React Native SVG for timeline visualization
- **Authentication**: JWT tokens via magic link
- **Storage**: Expo SecureStore + AsyncStorage fallback
- **API**: Axios with automatic token management

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- Xcode (for iOS development)
- Expo CLI (`npm install -g @expo/cli`)

### Install Dependencies
```bash
cd trysnowball-mobile
npm install
```

### Environment Setup
The app connects to the production TrySnowball API at `https://trysnowball.com`

### Run Development
```bash
# iOS Simulator
npx expo start --ios

# Physical device via Expo Go
npx expo start
# Scan QR code with Expo Go app
```

## 📦 Building for Production

### Development Build
```bash
eas build --profile development --platform ios
```

### TestFlight (Preview)
```bash
eas build --profile preview --platform ios
```

### App Store Release
```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios
```

## 🔐 Authentication Flow

1. **Magic Link Request** - User enters email, app calls `/auth/request-link`
2. **Email Sent** - Cloudflare Worker sends magic link via SendGrid
3. **Link Clicked** - Opens app with verification token
4. **Token Verification** - App calls `/auth/verify` and stores JWT
5. **Authenticated State** - All API calls include `Bearer {jwt}` header

## 💾 Data Management

### Local Storage Strategy
- **Primary**: Cloud API (Cloudflare D1 database)
- **Cache**: AsyncStorage for offline access
- **Sync**: Automatic background sync every 30 seconds
- **Conflict Resolution**: Server wins, with optimistic updates

### Demo Mode
- Loads sample debts for unauthenticated users
- Local-only storage (doesn't sync to cloud)
- Seamlessly upgrades to cloud sync on login

## 🎨 Design System

### Colors
- Matches web app branding
- Automatic light/dark mode support
- WCAG AA compliant contrast ratios

### Typography
- System fonts (San Francisco on iOS)
- Consistent sizing scale
- Optimized for readability

### Components
- Reusable component library
- Consistent spacing and styling
- Native platform conventions

## 📊 Features Deep Dive

### Debt Snowball Method
- Sorts debts by balance (smallest first)
- Calculates payoff timeline
- Shows interest savings vs minimum payments
- Tracks progress milestones (25%, 50%, 75%, debt-free)

### Timeline Visualization  
- SVG-based chart showing progress over time
- Interactive milestone markers
- "Burn-up" style showing amount paid vs remaining

### Social Features
- Share milestones to social media
- Referral codes with tracking
- Native iOS share sheet integration

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks  
├── lib/                # API client and utilities
├── navigation/         # Navigation configuration
├── screens/           # Screen components
└── theme/             # Design system (colors, fonts, spacing)
```

### Key Hooks
- `useAuth()` - Authentication state and methods
- `useDebts()` - Debt data management with cloud sync  
- `useTheme()` - Theme colors and dark mode detection

### API Integration
- Automatic JWT token management
- Request/response interceptors
- Error handling with retry logic
- Optimistic updates with rollback

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Magic link authentication flow
- [ ] Add/edit/delete debts
- [ ] Offline mode and sync recovery
- [ ] Timeline chart rendering
- [ ] Share functionality
- [ ] Dark mode switching
- [ ] App backgrounding/foregrounding

### Automated Testing (TODO)
- Unit tests for business logic
- Integration tests for API calls  
- E2E tests for critical user flows

## 📱 Deployment

### App Store Metadata
- **App Name**: TrySnowball - Debt Tracker
- **Category**: Finance
- **Age Rating**: 4+ (no sensitive content)
- **Keywords**: debt, snowball, finance, budget, payoff
- **Description**: Track your debt-free journey with the proven snowball method

### Release Process
1. Test on device and simulator
2. Build with `eas build --profile production`
3. Upload to TestFlight for internal testing
4. Submit for App Store review
5. Monitor crash reports and user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary to TrySnowball.

## 📞 Support

For technical issues or questions:
- Create an issue in this repository
- Email: support@trysnowball.com

---

**Built with ❤️ for the debt-free community**