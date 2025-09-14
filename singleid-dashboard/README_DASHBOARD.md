# Singleid API Dashboard

A React TypeScript dashboard for testing and interacting with the Singleid API.

## Features

- **API Testing Interface**: Test various Singleid API endpoints with a user-friendly interface
- **Authentication Management**: Handle publisher credentials and OAuth access tokens
- **Real-time Results**: View API responses and errors in real-time with proper formatting
- **Responsive Design**: Works on desktop and mobile devices

## API Integration

### Publisher Credentials
- **Username**: `swipii#publisher`
- **Token**: `GctbDqNbMhvVDZUEh2cq4aPMQAYxBULf`

### Supported Endpoints
- `POST /user/register` - Register new users
- `POST /oauth/access_token` - Get OAuth access tokens
- `GET /user/profile` - Get user profile (requires access token)
- `GET /user/balance` - Get user balance (requires access token)

### Authentication Methods
1. **Basic Authentication**: Used for publisher endpoints
2. **OAuth2 Password Flow**: Used for user-specific operations

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd singleid-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard

## Usage

### Testing User Registration
1. Click "Test User Registration" to register a new user with sample data
2. The system will automatically generate a unique email address
3. View the response in the results section

### Getting Access Tokens
1. Click "Test Access Token" to authenticate with existing user credentials
2. The token will be automatically stored for subsequent API calls
3. Token status is displayed in the header

### Testing Protected Endpoints
1. First obtain an access token using the "Test Access Token" button
2. Use "Test User Profile" or "Test User Balance" buttons to test protected endpoints
3. These buttons are disabled until you have a valid access token

### Viewing Results
- All API responses are displayed in formatted cards
- Success responses show in green with formatted JSON
- Error responses show in red with error details
- Loading states are indicated with animated spinners
- Timestamps help track when requests were made

## Project Structure

```
singleid-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx       # Main dashboard component
│   │   └── Dashboard.css       # Dashboard styles
│   ├── services/
│   │   └── singleidApi.ts      # API service layer
│   ├── App.tsx                 # Main app with routing
│   └── App.css                 # Global styles
├── package.json
└── README_DASHBOARD.md
```

## API Service

The `singleidApi.ts` service provides:
- Axios-based HTTP client with interceptors
- Automatic authentication header management
- TypeScript interfaces for API data
- Error handling and logging
- Generic methods for custom endpoints

### Key Methods
- `setPublisherAuth()` - Set publisher credentials
- `registerUser()` - Register new users
- `getAccessToken()` - Get OAuth tokens
- `get()`, `post()`, `put()`, `delete()` - Generic HTTP methods

## Development

### Adding New Endpoints
1. Add TypeScript interfaces to `singleidApi.ts`
2. Create specific methods or use generic HTTP methods
3. Add test buttons to `Dashboard.tsx`
4. Update this README with new functionality

### Styling
- Component-specific styles in `Dashboard.css`
- Global styles in `App.css`
- Responsive design with mobile-first approach

## Environment

- **Base URL**: `https://staging.single.id`
- **Client ID**: `swipii`
- **Environment**: Staging

## Security Notes

- Publisher credentials are hardcoded for demo purposes
- In production, use environment variables
- Access tokens are stored in memory only
- No sensitive data is persisted

## Troubleshooting

### CORS Issues
If you encounter CORS errors, the API server needs to allow requests from your domain.

### Authentication Errors
- Verify publisher credentials are correct
- Check that user credentials exist before requesting access tokens
- Ensure access token is valid and not expired

### Network Errors
- Verify the API base URL is accessible
- Check network connectivity
- Review browser developer tools for detailed error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for demonstration purposes and uses the Singleid API under their terms of service.