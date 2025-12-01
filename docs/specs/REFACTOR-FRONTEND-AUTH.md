# Dev Spec: Refactor Frontend Auth Service Structure

**Story ID**: REFACTOR-FRONTEND-001  
**Created**: 2025-12-01  
**Status**: Ready for Implementation  
**Estimated Effort**: 1-2 hours

---

## Overview

Restructure the frontend authentication services to separate GitHub OAuth (a "connected service") from the main app authentication layer. This prepares for future app-level authentication (JWT, sessions, etc.) while keeping GitHub as an optional integration.

---

## Current State

```
apps/web/src/
├── services/
│   └── auth.ts          # GitHub OAuth service (misnamed)
└── routes/
    └── auth.callback.tsx # GitHub OAuth callback
```

**Problems:**
- `auth.ts` is actually GitHub-specific, not general auth
- No separation between app auth and connected services
- Future app authentication will conflict with naming
- Unclear that GitHub is optional

---

## Target State

```
apps/web/src/
├── services/
│   ├── auth/
│   │   ├── github.ts              # GitHub OAuth service
│   │   └── index.ts               # Re-exports (future: app auth)
│   └── storage.ts                 # Existing storage service
└── routes/
    └── auth.callback.tsx          # GitHub OAuth callback (no changes)
```

**Benefits:**
- Clear separation: app auth vs. connected services
- GitHub is clearly a "connected service" not core auth
- Room for future app authentication layer
- Better organization as services grow

---

## Implementation Steps

### 1. Create Auth Directory

```bash
mkdir -p apps/web/src/services/auth
```

### 2. Move and Rename Auth Service

**Move file:**
```bash
mv apps/web/src/services/auth.ts apps/web/src/services/auth/github.ts
```

**File: `src/services/auth/github.ts`**
- No code changes needed
- Just moved to new location

### 3. Create Auth Index

**File: `src/services/auth/index.ts`**
```typescript
// Re-export GitHub service for backward compatibility
export { AuthService as GitHubAuthService } from './github';

// Future: Export app-level auth service
// export { AppAuthService } from './app';
```

### 4. Update All Imports

**Files to update:**

**`src/routes/planning.new.tsx`**
```typescript
// Before:
import { AuthService } from '../services/auth';

// After:
import { GitHubAuthService } from '../services/auth';

// Update all references:
AuthService.getAuthState() → GitHubAuthService.getAuthState()
AuthService.fetchUserRepos() → GitHubAuthService.fetchUserRepos()
```

**`src/routes/auth.callback.tsx`**
```typescript
// Before:
import { AuthService } from '../services/auth';

// After:
import { GitHubAuthService } from '../services/auth';

// Update all references:
AuthService.handleOAuthCallback() → GitHubAuthService.handleOAuthCallback()
```

**`src/components/Header.tsx`** (if exists)
```typescript
// Before:
import { AuthService } from '../services/auth';

// After:
import { GitHubAuthService } from '../services/auth';

// Update all references
```

### 5. Search for All Usages

```bash
# Find all files importing AuthService
cd apps/web
grep -r "from.*services/auth" src/
grep -r "AuthService" src/
```

Update each file found.

### 6. Update Class Name (Optional but Recommended)

**File: `src/services/auth/github.ts`**
```typescript
// Before:
export class AuthService {
  // ...
}

// After:
export class GitHubAuthService {
  // ...
}
```

This makes it crystal clear this is GitHub-specific.

### 7. Update localStorage Keys (Optional)

**File: `src/services/auth/github.ts`**
```typescript
// Before:
const AUTH_TOKEN_KEY = 'apdevflow_github_token';
const AUTH_USER_KEY = 'apdevflow_github_user';
const AUTH_STATE_KEY = 'apdevflow_oauth_state';

// After (more explicit):
const GITHUB_TOKEN_KEY = 'apdevflow_github_token';
const GITHUB_USER_KEY = 'apdevflow_github_user';
const GITHUB_STATE_KEY = 'apdevflow_github_oauth_state';
```

Update all references in the file.

---

## File-by-File Changes

### `src/services/auth/github.ts`

```typescript
// GitHub OAuth service for APDevFlow
import type { GitHubAuthToken, GitHubUser, AuthState } from '../../types';

const GITHUB_TOKEN_KEY = 'apdevflow_github_token';
const GITHUB_USER_KEY = 'apdevflow_github_user';
const GITHUB_STATE_KEY = 'apdevflow_github_oauth_state';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/callback';

export class GitHubAuthService {
  // ... rest of the code (same as before, just renamed keys)
  
  private static generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  static getAuthState(): AuthState {
    const token = this.getToken();
    const user = this.getUser();

    return {
      isAuthenticated: !!token && !!user,
      token,
      user,
    };
  }

  static getToken(): GitHubAuthToken | null {
    try {
      const data = localStorage.getItem(GITHUB_TOKEN_KEY);
      if (!data) return null;

      const token: GitHubAuthToken = JSON.parse(data);

      if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
        this.clearAuth();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Error reading GitHub token:', error);
      return null;
    }
  }

  static getUser(): GitHubUser | null {
    try {
      const data = localStorage.getItem(GITHUB_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading GitHub user:', error);
      return null;
    }
  }

  private static saveToken(token: GitHubAuthToken): void {
    try {
      localStorage.setItem(GITHUB_TOKEN_KEY, JSON.stringify(token));
    } catch (error) {
      console.error('Error saving GitHub token:', error);
    }
  }

  private static saveUser(user: GitHubUser): void {
    try {
      localStorage.setItem(GITHUB_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving GitHub user:', error);
    }
  }

  static initiateGitHubAuth(): void {
    if (!GITHUB_CLIENT_ID) {
      console.error('GitHub Client ID not configured');
      alert('GitHub OAuth is not configured. Please set VITE_GITHUB_CLIENT_ID in .env.local');
      return;
    }

    localStorage.removeItem(GITHUB_STATE_KEY);

    const state = this.generateState();
    localStorage.setItem(GITHUB_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'repo read:user user:email',
      state,
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    window.location.href = authUrl;
  }

  static async handleOAuthCallback(code: string, state: string): Promise<boolean> {
    try {
      const savedState = localStorage.getItem(GITHUB_STATE_KEY);
      
      if (!savedState || savedState !== state) {
        console.error('Invalid state parameter');
        return false;
      }

      localStorage.removeItem(GITHUB_STATE_KEY);

      const response = await fetch(`${API_URL}/api/github/oauth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Token exchange failed:', error);
        return false;
      }

      const data = await response.json();

      const token: GitHubAuthToken = {
        accessToken: data.access_token,
        tokenType: data.token_type,
        scope: data.scope,
      };
      this.saveToken(token);

      const user = await this.fetchGitHubUser(token.accessToken);
      if (user) {
        this.saveUser(user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return false;
    }
  }

  static async fetchGitHubUser(accessToken: string): Promise<GitHubUser | null> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch GitHub user');
        return null;
      }

      const data = await response.json();

      return {
        login: data.login,
        id: data.id,
        avatarUrl: data.avatar_url,
        name: data.name,
        email: data.email,
        htmlUrl: data.html_url,
      };
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
      return null;
    }
  }

  static async fetchUserRepos(accessToken?: string): Promise<any[]> {
    const token = accessToken || this.getToken()?.accessToken;
    if (!token) {
      console.error('No access token available');
      return [];
    }

    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch repositories');
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repositories:', error);
      return [];
    }
  }

  static async validateRepoAccess(repoFullName: string): Promise<boolean> {
    const token = this.getToken()?.accessToken;
    if (!token) return false;

    try {
      const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating repo access:', error);
      return false;
    }
  }

  static logout(): void {
    this.clearAuth();
  }

  private static clearAuth(): void {
    try {
      localStorage.removeItem(GITHUB_TOKEN_KEY);
      localStorage.removeItem(GITHUB_USER_KEY);
      localStorage.removeItem(GITHUB_STATE_KEY);
    } catch (error) {
      console.error('Error clearing GitHub auth:', error);
    }
  }

  static isAuthenticated(): boolean {
    return this.getAuthState().isAuthenticated;
  }
}
```

### `src/services/auth/index.ts`

```typescript
// Re-export GitHub auth service
export { GitHubAuthService } from './github';

// Future: App-level authentication
// export { AppAuthService } from './app';
// export { useAuth } from './hooks';
```

### `src/routes/planning.new.tsx`

```typescript
// Update import
import { GitHubAuthService } from '../services/auth';

// Update all usages in useEffect:
useEffect(() => {
  const authState = GitHubAuthService.getAuthState();
  setIsAuthenticated(authState.isAuthenticated);

  if (authState.isAuthenticated) {
    setLoadingRepos(true);
    GitHubAuthService.fetchUserRepos()
      .then((fetchedRepos) => {
        setRepos(fetchedRepos);
      })
      .finally(() => {
        setLoadingRepos(false);
      });
  }
}, []);
```

### `src/routes/auth.callback.tsx`

```typescript
// Update import
import { GitHubAuthService } from '../services/auth';

// Update usage:
const success = await GitHubAuthService.handleOAuthCallback(code, state);
```

---

## Testing Checklist

- [ ] TypeScript compiles: `pnpm --filter @apdevflow/web build`
- [ ] No TypeScript errors
- [ ] Dev server starts: `pnpm --filter @apdevflow/web dev`
- [ ] GitHub OAuth flow still works
- [ ] Repo dropdown still populates
- [ ] Logout still works
- [ ] No console errors

---

## Future Enhancements (Post-Refactor)

### App-Level Authentication

**File: `src/services/auth/app.ts`** (future)
```typescript
export class AppAuthService {
  static async login(email: string, password: string) { }
  static async signup(email: string, password: string) { }
  static async logout() { }
  static getUser() { }
  static isAuthenticated() { }
}
```

### Connected Services

**File: `src/services/auth/index.ts`** (future)
```typescript
export { GitHubAuthService } from './github';
export { AppAuthService } from './app';
export { JiraAuthService } from './jira';      // Future
export { LinearAuthService } from './linear';  // Future
```

---

## Migration Notes

**Breaking Changes:**
- Import paths change
- Class name changes from `AuthService` to `GitHubAuthService`
- localStorage keys change (optional - will log users out once)

**Rollback Plan:**
- Keep old file in git history
- Can revert commit if issues arise
- No backend changes needed

---

## Success Criteria

✅ Auth service moved to `services/auth/github.ts`  
✅ All imports updated  
✅ Class renamed to `GitHubAuthService`  
✅ TypeScript compiles without errors  
✅ All existing functionality works  
✅ Clear separation for future app auth  
✅ Better organized service structure
