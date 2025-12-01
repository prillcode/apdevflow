# Dev Spec: Fine-Grained Personal Access Token Support

**Story ID**: FEATURE-002  
**Created**: 2025-12-01  
**Status**: Ready for Implementation  
**Estimated Effort**: 3-4 hours

---

## Overview

Add support for GitHub fine-grained personal access tokens (PATs) as an alternative authentication method. This allows users to access organization repositories without requiring organization admin approval of the OAuth app.

---

## User Story

**As a** developer on a team using APDevFlow  
**I want** to connect my organization repositories using a fine-grained token  
**So that** I can access specific org repos without waiting for admin OAuth approval

---

## Business Context

**Problem:**
- GitHub OAuth requires organization admin approval for private org repos
- This creates friction for teams wanting to use APDevFlow
- Admins may be slow to approve or hesitant to grant broad OAuth access

**Solution:**
- Offer fine-grained PATs as alternative authentication
- Users can grant access to specific repos only
- No admin approval required
- More granular permission control

**Use Cases:**
1. **Personal repos** → Use OAuth (current, easy)
2. **Org repos (admin approved)** → Use OAuth (seamless)
3. **Org repos (no admin approval)** → Use fine-grained token (self-service)

---

## Acceptance Criteria

- [ ] User can choose between OAuth and fine-grained token
- [ ] UI shows both connection options clearly
- [ ] Token input is secure (password field, not stored in plain text)
- [ ] Token is validated before saving
- [ ] Token permissions are checked (must have repo access)
- [ ] User can see which repos are accessible with token
- [ ] User can revoke/disconnect token
- [ ] Token works with all existing features (repo dropdown, file autocomplete)
- [ ] Clear instructions on creating fine-grained token
- [ ] Graceful error handling for invalid/expired tokens

---

## Technical Design

### Authentication Flow Options

**Visual Flow:**

```
┌─────────────────────────────────────────┐
│ Not Connected State                     │
├─────────────────────────────────────────┤
│ Connect to GitHub                       │
│                                         │
│ [Connect with GitHub OAuth]  ← Primary │
│                                         │
│ ─────────── or ───────────              │
│                                         │
│ [Connect with Fine-Grained Token]      │
│                                         │
│ (Use token for org repos without       │
│  admin approval)                        │
└─────────────────────────────────────────┘
         │                    │
         │                    │
    OAuth Flow          Token Modal Opens
         │                    │
         ↓                    ↓
┌─────────────────┐  ┌─────────────────────┐
│ GitHub OAuth    │  │ [X] Token Modal     │
│ (external)      │  │                     │
│                 │  │ Token: [_______]    │
│ Authorize       │  │                     │
│ APDevFlow       │  │ [Instructions...]   │
│                 │  │                     │
│ [Authorize]     │  │ [Cancel] [Connect]  │
└─────────────────┘  └─────────────────────┘
         │                    │
         └────────┬───────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Connected State                         │
├─────────────────────────────────────────┤
│ Connected to GitHub                     │
│                                         │
│ [Avatar] @username [OAuth/Token badge] │
│                                         │
│                          [Disconnect]   │
└─────────────────────────────────────────┘
```

**Key UX Decisions:**

1. **Modal for Token** - Cleaner than inline form, easy to cancel
2. **OAuth Primary** - Positioned as recommended option
3. **Clear Labeling** - Shows which auth method is active when connected
4. **Single Disconnect** - Works for both OAuth and Token
5. **Backdrop Click** - Modal closes when clicking outside (unless loading)

### Data Model Changes

**Update AuthState type:**
```typescript
interface AuthState {
  isAuthenticated: boolean;
  authMethod: 'oauth' | 'token';  // NEW
  token: GitHubAuthToken | null;
  user: GitHubUser | null;
}

interface GitHubAuthToken {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresAt?: string;
  authMethod: 'oauth' | 'token';  // NEW
}
```

### Storage Keys

```typescript
// Existing
const GITHUB_TOKEN_KEY = 'apdevflow_github_token';
const GITHUB_USER_KEY = 'apdevflow_github_user';
const GITHUB_STATE_KEY = 'apdevflow_github_oauth_state';

// New
const GITHUB_AUTH_METHOD_KEY = 'apdevflow_github_auth_method';
```

---

## Implementation Steps

### 1. Update Types

**File: `apps/web/src/types/index.ts`**

```typescript
export interface AuthState {
  isAuthenticated: boolean;
  authMethod: 'oauth' | 'token';
  token: GitHubAuthToken | null;
  user: GitHubUser | null;
}

export interface GitHubAuthToken {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresAt?: string;
  authMethod: 'oauth' | 'token';
}
```

### 2. Update GitHubAuthService

**File: `apps/web/src/services/auth/github.ts`**

Add methods:

```typescript
// Connect with fine-grained token
static async connectWithToken(token: string): Promise<boolean> {
  try {
    // Validate token by fetching user
    const user = await this.fetchGitHubUser(token);
    if (!user) {
      throw new Error('Invalid token or insufficient permissions');
    }

    // Check token has repo access
    const hasRepoAccess = await this.validateTokenPermissions(token);
    if (!hasRepoAccess) {
      throw new Error('Token must have repository access permissions');
    }

    // Save token
    const tokenData: GitHubAuthToken = {
      accessToken: token,
      tokenType: 'Bearer',
      scope: 'repo', // Fine-grained tokens don't return scope
      authMethod: 'token',
    };
    this.saveToken(tokenData);
    this.saveUser(user);
    this.saveAuthMethod('token');

    return true;
  } catch (error) {
    console.error('Token connection error:', error);
    return false;
  }
}

// Validate token has required permissions
static async validateTokenPermissions(token: string): Promise<boolean> {
  try {
    // Try to list repos - if this works, token has repo access
    const response = await fetch('https://api.github.com/user/repos?per_page=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Get auth method
static getAuthMethod(): 'oauth' | 'token' | null {
  try {
    const method = localStorage.getItem(GITHUB_AUTH_METHOD_KEY);
    return method as 'oauth' | 'token' | null;
  } catch (error) {
    return null;
  }
}

// Save auth method
private static saveAuthMethod(method: 'oauth' | 'token'): void {
  try {
    localStorage.setItem(GITHUB_AUTH_METHOD_KEY, method);
  } catch (error) {
    console.error('Error saving auth method:', error);
  }
}

// Update getAuthState to include authMethod
static getAuthState(): AuthState {
  const token = this.getToken();
  const user = this.getUser();
  const authMethod = this.getAuthMethod() || 'oauth';

  return {
    isAuthenticated: !!token && !!user,
    authMethod,
    token,
    user,
  };
}

// Update clearAuth to clear auth method
private static clearAuth(): void {
  try {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
    localStorage.removeItem(GITHUB_USER_KEY);
    localStorage.removeItem(GITHUB_STATE_KEY);
    localStorage.removeItem(GITHUB_AUTH_METHOD_KEY);
  } catch (error) {
    console.error('Error clearing GitHub auth:', error);
  }
}

// Update initiateGitHubAuth to save auth method
static initiateGitHubAuth(): void {
  // ... existing code ...
  this.saveAuthMethod('oauth');
  // ... rest of existing code ...
}
```

### 3. Create Token Connection Modal

**File: `apps/web/src/components/GitHubTokenConnect.tsx`**

```typescript
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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
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

          {/* Body */}
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

          {/* Footer */}
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
```

### 4. Update GitHubConnect Component

**File: `apps/web/src/components/GitHubConnect.tsx`**

Update to show both connection options and use modal:

```typescript
import { useState, useEffect } from 'react';
import { GitHubAuthService } from '../services/auth';
import { GitHubTokenConnect } from './GitHubTokenConnect';
import type { AuthState } from '../types';

export function GitHubConnect() {
  const [authState, setAuthState] = useState<AuthState>(GitHubAuthService.getAuthState());
  const [showTokenModal, setShowTokenModal] = useState(false);

  useEffect(() => {
    setAuthState(GitHubAuthService.getAuthState());
  }, []);

  const handleOAuthConnect = () => {
    GitHubAuthService.initiateGitHubAuth();
  };

  const handleTokenSuccess = () => {
    setAuthState(GitHubAuthService.getAuthState());
    setShowTokenModal(false);
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect from GitHub?')) {
      GitHubAuthService.logout();
      setAuthState(GitHubAuthService.getAuthState());
    }
  };

  // Connected state
  if (authState.isAuthenticated && authState.user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={authState.user.avatarUrl}
              alt={authState.user.login}
              className="h-12 w-12 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Connected to GitHub
              </h3>
              <p className="text-sm text-gray-600">
                {authState.user.name || authState.user.login}
              </p>
              <div className="flex items-center space-x-2">
                <a
                  href={authState.user.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  @{authState.user.login}
                </a>
                <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                  {authState.authMethod === 'oauth' ? 'OAuth' : 'Token'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // Not connected state
  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Connect to GitHub
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Connect your GitHub account to access repositories and enable file path autocomplete
        </p>
        
        <div className="space-y-3">
          {/* OAuth Button */}
          <button
            onClick={handleOAuthConnect}
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
          >
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Connect with GitHub OAuth
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Token Button */}
          <button
            onClick={() => setShowTokenModal(true)}
            className="w-full px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Connect with Fine-Grained Token
          </button>

          {/* Info text */}
          <p className="text-xs text-gray-500 text-center mt-2">
            Use a token to access organization repos without admin approval
          </p>
        </div>
      </div>

      {/* Token Modal */}
      <GitHubTokenConnect
        isOpen={showTokenModal}
        onSuccess={handleTokenSuccess}
        onClose={() => setShowTokenModal(false)}
      />
    </>
  );
}
```

---

## Testing Checklist

### Token Connection
- [ ] Can enter fine-grained token
- [ ] Token is validated before saving
- [ ] Invalid token shows error message
- [ ] Token without repo access shows error
- [ ] Successful connection shows user info
- [ ] Token is stored securely (not visible in DevTools)

### Token Usage
- [ ] Repo dropdown shows repos accessible with token
- [ ] File autocomplete works with token
- [ ] All existing features work with token auth
- [ ] Token persists across page refreshes
- [ ] Token survives browser restart

### OAuth Still Works
- [ ] OAuth flow unchanged
- [ ] OAuth and token don't conflict
- [ ] Can switch between OAuth and token
- [ ] Disconnect works for both methods

### UI/UX
- [ ] Clear instructions for creating token
- [ ] Link to GitHub token creation page
- [ ] Shows which auth method is active
- [ ] Error messages are helpful
- [ ] Loading states work correctly

---

## Security Considerations

1. **Token Storage**
   - Store in localStorage (same as OAuth token)
   - Not encrypted (browser security model)
   - User responsible for token security

2. **Token Validation**
   - Validate token has required permissions
   - Check token is not expired
   - Graceful error handling

3. **Token Revocation**
   - User can disconnect/revoke in APDevFlow
   - User must revoke in GitHub settings for full revocation
   - Show instructions for GitHub revocation

4. **Scope Limitations**
   - Fine-grained tokens are more secure than OAuth
   - User controls exact repos and permissions
   - No automatic refresh (user must create new token)

---

## Documentation Updates

### User Guide

Add section: "Connecting to GitHub"

**Option 1: OAuth (Recommended for Personal Repos)**
- One-click setup
- Automatic token management
- Best for personal repos and approved org repos

**Option 2: Fine-Grained Token (For Organization Repos)**
- Access specific org repos without admin approval
- More granular permission control
- Requires manual token creation

**Creating a Fine-Grained Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Give it a name (e.g., "APDevFlow")
4. Select repository access (specific repos)
5. Grant "Contents" permission (read/write)
6. Generate and copy token
7. Paste in APDevFlow

---

## Future Enhancements

1. **Token Expiration Warnings**
   - Detect when token is about to expire
   - Prompt user to create new token

2. **Permission Checker**
   - Show which permissions token has
   - Warn if missing required permissions

3. **Multiple Tokens**
   - Support multiple tokens for different org repos
   - Switch between tokens per repo

4. **GitHub App Alternative**
   - Consider GitHub App installation (better than OAuth)
   - Org-level installation with fine-grained permissions

---

## Success Criteria

✅ Users can connect with fine-grained token  
✅ Token auth works for all features  
✅ OAuth still works as before  
✅ Clear UI for choosing auth method  
✅ Helpful error messages  
✅ Secure token storage  
✅ Documentation updated  
✅ No breaking changes to existing OAuth flow
