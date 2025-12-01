// GitHub OAuth service for APDevFlow
import type { GitHubAuthToken, GitHubUser, AuthState } from '../../types';

const AUTH_TOKEN_KEY = 'apdevflow_github_token';
const AUTH_USER_KEY = 'apdevflow_github_user';
const AUTH_STATE_KEY = 'apdevflow_oauth_state';
const AUTH_METHOD_KEY = 'apdevflow_github_auth_method';

// Environment variables (to be set in .env.local)
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/callback';

export class GitHubAuthService {
  // Generate a random state parameter for CSRF protection
  private static generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Get current auth state
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

  // Get stored token
  static getToken(): GitHubAuthToken | null {
    try {
      const data = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!data) return null;

      const token: GitHubAuthToken = JSON.parse(data);

      // Check if token is expired
      if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
        this.clearAuth();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Error reading auth token:', error);
      return null;
    }
  }

  // Get stored user
  static getUser(): GitHubUser | null {
    try {
      const data = localStorage.getItem(AUTH_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  // Get auth method
  static getAuthMethod(): 'oauth' | 'token' | null {
    try {
      const method = localStorage.getItem(AUTH_METHOD_KEY);
      return method as 'oauth' | 'token' | null;
    } catch (error) {
      return null;
    }
  }

  // Save auth method
  private static saveAuthMethod(method: 'oauth' | 'token'): void {
    try {
      localStorage.setItem(AUTH_METHOD_KEY, method);
    } catch (error) {
      console.error('Error saving auth method:', error);
    }
  }

  // Save token to localStorage
  private static saveToken(token: GitHubAuthToken): void {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(token));
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  // Save user to localStorage
  private static saveUser(user: GitHubUser): void {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Initiate GitHub OAuth flow
  static initiateGitHubAuth(): void {
    if (!GITHUB_CLIENT_ID) {
      console.error('GitHub Client ID not configured');
      alert('GitHub OAuth is not configured. Please set VITE_GITHUB_CLIENT_ID in .env.local');
      return;
    }

    // Clear any existing state
    localStorage.removeItem(AUTH_STATE_KEY);

    const state = this.generateState();
    localStorage.setItem(AUTH_STATE_KEY, state);
    this.saveAuthMethod('oauth');

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'repo read:user user:email',
      state,
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  static async handleOAuthCallback(code: string, state: string): Promise<boolean> {
    try {
      // Verify state parameter to prevent CSRF
      const savedState = localStorage.getItem(AUTH_STATE_KEY);
      console.log('Callback state:', state);
      console.log('Saved state:', savedState);
      
      if (!savedState || savedState !== state) {
        console.error('Invalid state parameter');
        return false;
      }

      // Clear saved state
      localStorage.removeItem(AUTH_STATE_KEY);

      // Exchange code for token via API Lambda
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

      // Save token
      const token: GitHubAuthToken = {
        accessToken: data.access_token,
        tokenType: data.token_type,
        scope: data.scope,
        authMethod: 'oauth',
      };
      this.saveToken(token);

      // Fetch user info from GitHub
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

  // Fetch GitHub user info
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

  // Fetch user's repositories
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

  // Fetch repository files
  static async fetchRepoFiles(repoFullName: string): Promise<{
    files: Array<{ path: string; type: string; size?: number; sha: string }>;
    truncated: boolean;
  } | null> {
    const token = this.getToken()?.accessToken;
    if (!token) {
      console.error('No access token available');
      return null;
    }

    try {
      const [owner, repo] = repoFullName.split('/');
      
      const response = await fetch(
        `${API_URL}/api/github/repos/${owner}/${repo}/files`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch repository files');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repository files:', error);
      return null;
    }
  }

  // Validate repository access
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

  // Logout / clear authentication
  static logout(): void {
    this.clearAuth();
  }

  // Clear all auth data
  private static clearAuth(): void {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_STATE_KEY);
      localStorage.removeItem(AUTH_METHOD_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getAuthState().isAuthenticated;
  }

  // Connect with fine-grained token
  static async connectWithToken(token: string): Promise<boolean> {
    try {
      const user = await this.fetchGitHubUser(token);
      if (!user) {
        throw new Error('Invalid token or insufficient permissions');
      }

      const hasRepoAccess = await this.validateTokenPermissions(token);
      if (!hasRepoAccess) {
        throw new Error('Token must have repository access permissions');
      }

      const tokenData: GitHubAuthToken = {
        accessToken: token,
        tokenType: 'Bearer',
        scope: 'repo',
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
}
