import React, { useState, useEffect } from 'react';
import singleidApi, { UserRegistrationData, AccessTokenResponse, LocationsResponse, OffersResponse } from '../services/singleidApi';
import OffersDisplay from './OffersDisplay';
import './Dashboard.css';

interface DashboardProps {}

interface ApiTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
  timestamp?: string;
}

const Dashboard: React.FC<DashboardProps> = () => {
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'api-tests' | 'offers'>('api-tests');
  const [userCreated, setUserCreated] = useState<boolean>(false);

  // Sample user registration data
  const sampleUserData: UserRegistrationData = {
    personal: {
      first_name: 'Richard',
      last_name: 'Bate',
      dob: '1990-01-01'
    },
    contact: {
      email: 'richard.bate@enigmaticsmile.com'
    },
    security: {
      password: 'SecureP@ssw0rd2024!'
    },
    consent: {
      accepted_single_id_terms: true,
      single_id_terms_version: '1.0.0'
    }
  };

  // Sample credentials for access token
  const sampleCredentials = {
    username: 'richard.bate@enigmaticsmile.com',
    password: 'SecureP@ssw0rd2024!',
    client_id: 'swipii'
  };

  const updateApiResult = (endpoint: string, status: 'success' | 'error' | 'loading', data?: any, error?: string) => {
    const result: ApiTestResult = {
      endpoint,
      status,
      data,
      error,
      timestamp: new Date().toISOString()
    };

    setApiResults(prev => {
      const filtered = prev.filter(r => r.endpoint !== endpoint);
      return [...filtered, result];
    });
  };

  const testUserRegistration = async () => {
    updateApiResult('/user/register', 'loading');
    setLoading(true);

    try {
      const result = await singleidApi.registerUser(sampleUserData);
      updateApiResult('/user/register', 'success', result);
      setUserCreated(true);
    } catch (error: any) {
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      updateApiResult('/user/register', 'error', null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testAccessToken = async () => {
    updateApiResult('/oauth/access_token', 'loading');
    setLoading(true);

    try {
      const result: AccessTokenResponse = await singleidApi.getAccessToken(sampleCredentials);
      setAccessToken(result.access_token);
      updateApiResult('/oauth/access_token', 'success', result);
    } catch (error: any) {
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      updateApiResult('/oauth/access_token', 'error', null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testGenericEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
    updateApiResult(endpoint, 'loading');
    setLoading(true);

    try {
      let result;
      if (method === 'GET') {
        result = await singleidApi.get(endpoint);
      } else {
        result = await singleidApi.post(endpoint, {});
      }
      updateApiResult(endpoint, 'success', result);
    } catch (error: any) {
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      updateApiResult(endpoint, 'error', null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testLocations = async () => {
    updateApiResult('/locations', 'loading');
    setLoading(true);

    try {
      const result: LocationsResponse = await singleidApi.getLocations({ limit: 20 });
      updateApiResult('/locations', 'success', result);
    } catch (error: any) {
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      updateApiResult('/locations', 'error', null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testOffers = async () => {
    updateApiResult('/offers', 'loading');
    setLoading(true);

    try {
      const result: OffersResponse = await singleidApi.getOffers({ 
        status: 'active', 
        limit: 20 
      });
      updateApiResult('/offers', 'success', result);
    } catch (error: any) {
      const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      updateApiResult('/offers', 'error', null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setApiResults([]);
    setAccessToken(null);
    singleidApi.clearAccessToken();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#f44336';
      case 'loading': return '#ff9800';
      default: return '#757575';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  useEffect(() => {
    // Initialize with current access token if exists
    const currentToken = singleidApi.getCurrentAccessToken();
    setAccessToken(currentToken);
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Singleid API Dashboard</h1>
        <div className="auth-status">
          <strong>Publisher:</strong> swipii#publisher
          <br />
          <strong>Access Token:</strong> {accessToken ? `${accessToken.substring(0, 20)}...` : 'None'}
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'api-tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-tests')}
        >
          API Tests
        </button>
        <button 
          className={`tab-button ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          Available Offers
        </button>
      </div>

      {activeTab === 'api-tests' && (
        <>
          <div className="workflow-guide">
            <h3>🔐 Authentication Workflow</h3>
            <div className="workflow-steps">
              <div className={`workflow-step ${userCreated ? 'completed' : ''}`}>
                <span className="step-number">1</span>
                <div className="step-content">
                  <strong>Register User</strong>
                  <p>Create a user account using publisher credentials</p>
                </div>
              </div>
              <div className={`workflow-step ${accessToken ? 'completed' : ''}`}>
                <span className="step-number">2</span>
                <div className="step-content">
                  <strong>Get Access Token</strong>
                  <p>Authenticate user to get access token</p>
                </div>
              </div>
              <div className={`workflow-step ${accessToken ? 'available' : 'disabled'}`}>
                <span className="step-number">3</span>
                <div className="step-content">
                  <strong>Access Locations & Offers</strong>
                  <p>Use authenticated token to view user-specific data</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-controls">
            <button 
              onClick={testUserRegistration} 
              disabled={loading}
              className="test-button register-button"
            >
              Test User Registration
            </button>
            
            <button 
              onClick={testAccessToken} 
              disabled={loading}
              className="test-button token-button"
            >
              Test Access Token
            </button>

            <button 
              onClick={() => testGenericEndpoint('/user/profile')} 
              disabled={loading || !accessToken}
              className="test-button profile-button"
            >
              Test User Profile
            </button>

            <button 
              onClick={() => testGenericEndpoint('/user/balance')} 
              disabled={loading || !accessToken}
              className="test-button balance-button"
            >
              Test User Balance
            </button>

            <button 
              onClick={testLocations} 
              disabled={loading}
              className="test-button locations-button"
            >
              Test Locations
            </button>

            <button 
              onClick={testOffers} 
              disabled={loading}
              className="test-button offers-button"
            >
              Test Offers
            </button>

            <button 
              onClick={clearResults} 
              disabled={loading}
              className="test-button clear-button"
            >
              Clear Results
            </button>
          </div>
        </>
      )}

      {activeTab === 'api-tests' && (
        <div className="results-section">
          <h2>API Test Results</h2>
          
          {apiResults.length === 0 && (
            <div className="no-results">
              No API tests run yet. Use the buttons above to test different endpoints.
            </div>
          )}

          {apiResults.map((result, index) => (
            <div key={index} className="api-result-card">
              <div className="result-header">
                <div className="endpoint-info">
                  <strong>{result.endpoint}</strong>
                  <span className="timestamp">{formatTimestamp(result.timestamp)}</span>
                </div>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(result.status) }}
                >
                  {result.status}
                </div>
              </div>

              {result.status === 'loading' && (
                <div className="loading-spinner">Loading...</div>
              )}

              {result.status === 'success' && result.data && (
                <div className="result-data">
                  <h4>Response:</h4>
                  <pre>{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              )}

              {result.status === 'error' && result.error && (
                <div className="result-error">
                  <h4>Error:</h4>
                  <pre>{typeof result.error === 'string' ? result.error : JSON.stringify(result.error, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'offers' && (
        <OffersDisplay />
      )}
    </div>
  );
};

export default Dashboard;