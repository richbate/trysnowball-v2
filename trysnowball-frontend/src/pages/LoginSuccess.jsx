import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../utils/tokenStorage';

const LoginSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for token in URL parameters (?token=) or hash parameters (#token=)
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const jwt = searchParams.get('token') || hashParams.get('token');

    console.log('[LoginSuccess] Token extraction:', {
      searchToken: searchParams.get('token'),
      hashToken: hashParams.get('token'),
      finalToken: jwt ? 'found' : 'none'
    });

    if (jwt) {
      console.log('[LoginSuccess] Token found, storing and dispatching event with token');
      setToken(jwt);
      // Pass token directly in event to avoid localStorage timing issues
      window.dispatchEvent(new CustomEvent('auth-success', { 
        detail: { token: jwt, source: 'login-success' } 
      }));
      console.log('[LoginSuccess] Token stored and auth-success event dispatched');
    } else {
      console.error('[LoginSuccess] No token found in URL parameters or hash');
      console.log('[LoginSuccess] Search params:', Object.fromEntries(searchParams));
      console.log('[LoginSuccess] Hash params:', Object.fromEntries(hashParams));
      console.log('[LoginSuccess] Full URL:', window.location.href);
    }

    // Clean up URL and navigate to home or dashboard
    navigate('/');
  }, [navigate]);

  return <p>Logging you in...</p>;
};

export default LoginSuccess;