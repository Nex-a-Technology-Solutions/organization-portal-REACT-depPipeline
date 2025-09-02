import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { auth } from '@/api/client.js';

export default function GoogleOAuthCallback() {
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processing Google authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('=== OAUTH CALLBACK DEBUG ===');
        console.log('Full URL:', window.location.href);
        console.log('Authorization code:', code);
        console.log('State:', state);
        console.log('Error:', error);
        console.log('Error description:', errorDescription);

        // Check for OAuth errors first
        if (error) {
          let errorMsg = 'Google authentication failed';
          
          if (error === 'access_denied') {
            errorMsg = 'Google authentication was cancelled by user';
          } else if (errorDescription) {
            errorMsg = errorDescription;
          }
          
          throw new Error(errorMsg);
        }

        // Validate state parameter (security check)
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
          throw new Error('Invalid state parameter - potential security issue');
        }

        // Check if we have an authorization code
        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        setMessage('Exchanging authorization code for tokens...');

        // Exchange authorization code for tokens
        const result = await auth.googleLogin(code);
        
        console.log('Authentication successful:', result);
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Clean up stored state
        sessionStorage.removeItem('oauth_state');

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'google-oauth-success',
            result: result
          }, window.location.origin);
          
          // Close popup after a short delay to show success message
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          // If not in popup, redirect to dashboard or main app
          setTimeout(() => {
            window.location.href = '/Dashboard';
          }, 2000);
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed');

        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'google-oauth-error',
            error: error.message || 'Authentication failed'
          }, window.location.origin);
          
          // Close popup after a delay to show error message
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      }
    };

    // Process the callback
    handleOAuthCallback();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Google Authentication</h2>
          
          <p className={`text-sm ${getStatusColor()}`}>
            {message}
          </p>

          {status === 'error' && (
            <div className="mt-6">
              <button
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    window.location.href = '/login';
                  }
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                {window.opener ? 'Close' : 'Return to Login'}
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                This window will close automatically...
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                Please wait while we complete your authentication...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}