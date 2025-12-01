import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { APP_NAME } from '@apdevflow/shared';
import { useState, useEffect } from 'react';
import { GitHubAuthService } from '../services/auth';
import { GitHubConnect } from '../components/GitHubConnect';
import type { AuthState } from '../types';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [authState, setAuthState] = useState<AuthState>(GitHubAuthService.getAuthState());
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    // Update auth state on mount and when localStorage changes
    const updateAuthState = () => {
      setAuthState(GitHubAuthService.getAuthState());
    };

    updateAuthState();

    // Listen for storage changes (for cross-tab updates)
    window.addEventListener('storage', updateAuthState);
    // Listen for custom auth state changes (same-tab updates)
    window.addEventListener('auth-state-changed', updateAuthState);

    return () => {
      window.removeEventListener('storage', updateAuthState);
      window.removeEventListener('auth-state-changed', updateAuthState);
    };
  }, []);

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect from GitHub?')) {
      GitHubAuthService.logout();
      setAuthState(GitHubAuthService.getAuthState());
      window.dispatchEvent(new Event('auth-state-changed'));
    }
  };

  const handleConnectSuccess = () => {
    setAuthState(GitHubAuthService.getAuthState());
    setShowConnectModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
              </Link>
              <nav className="flex space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  activeProps={{
                    className:
                      'px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md',
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/planning"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  activeProps={{
                    className:
                      'px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md',
                  }}
                >
                  Planning
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {authState.isAuthenticated && authState.user ? (
                <div className="flex items-center space-x-3">
                  <img
                    src={authState.user.avatarUrl}
                    alt={authState.user.login}
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="text-sm text-gray-700">
                    {authState.user.login}
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Connect GitHub
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Connection Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowConnectModal(false)}
          />
          <div className="relative z-10 w-full max-w-2xl">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-white hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <GitHubConnect onSuccess={handleConnectSuccess} />
          </div>
        </div>
      )}

      {/* Router DevTools (only in development) */}
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
