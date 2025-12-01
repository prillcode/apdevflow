import { useState } from 'react';
import { GitHubAuthService } from '../services/auth';

interface GitHubTokenConnectProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export function GitHubTokenConnect({ isOpen, onSuccess, onClose }: GitHubTokenConnectProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!token.trim()) {
      setError('Please enter a token');
      return;
    }

    setLoading(true);
    setError('');

    const success = await GitHubAuthService.connectWithToken(token.trim());

    if (success) {
      setToken('');
      onSuccess();
    } else {
      setError('Invalid token or insufficient permissions. Token must have repository access.');
    }

    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      setToken('');
      setError('');
      onClose();
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Connect with Fine-Grained Token
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Personal Access Token
              </label>
              <input
                type="password"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                disabled={loading}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100"
                placeholder="github_pat_..."
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                How to create a fine-grained token:
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>
                  Go to{' '}
                  <a 
                    href="https://github.com/settings/tokens?type=beta" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline font-medium"
                  >
                    GitHub Settings → Tokens
                  </a>
                </li>
                <li>Click "Generate new token" (fine-grained)</li>
                <li>Give it a name (e.g., "APDevFlow")</li>
                <li>Select specific repositories you want to access</li>
                <li>Under "Permissions", grant "Contents" (read/write)</li>
                <li>Click "Generate token"</li>
                <li>Copy the token and paste it above</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                Why use a fine-grained token?
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>✓ Access organization repos without admin approval</li>
                <li>✓ Grant access to specific repos only</li>
                <li>✓ More granular permission control</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={loading || !token.trim()}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
