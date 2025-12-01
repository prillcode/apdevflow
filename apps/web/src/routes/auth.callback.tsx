import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AuthService } from '../services/auth';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackComponent,
});

function AuthCallbackComponent() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code and state from URL params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        // Check for GitHub OAuth error
        if (error) {
          const errorDesc = params.get('error_description') || 'Authorization failed';
          setStatus('error');
          setErrorMessage(errorDesc);
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setStatus('error');
          setErrorMessage('Missing authorization code or state parameter');
          return;
        }

        // Handle OAuth callback
        const success = await AuthService.handleOAuthCallback(code, state);

        if (success) {
          setStatus('success');
          // Redirect to dashboard after 1 second
          setTimeout(() => {
            navigate({ to: '/' });
          }, 1000);
        } else {
          setStatus('error');
          setErrorMessage('Failed to complete GitHub authentication');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during authentication');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        {status === 'processing' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Connecting to GitHub...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we complete the authentication
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Successfully Connected!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Redirecting you to the dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Authentication Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate({ to: '/' })}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
