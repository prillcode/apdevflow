export class GitHubService {
  private static readonly TOKEN_URL = 'https://github.com/login/oauth/access_token';
  private static readonly API_BASE = 'https://api.github.com';

  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type: string;
    scope: string;
  }> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth not configured');
    }

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    return await response.json() as {
      access_token: string;
      token_type: string;
      scope: string;
    };
  }

  static async fetchRepoFiles(
    owner: string,
    repo: string,
    accessToken: string
  ): Promise<{
    files: Array<{ path: string; type: string; size?: number; sha: string }>;
    truncated: boolean;
    sha: string;
  }> {
    // Get repository info to find default branch
    const repoResponse = await fetch(
      `${this.API_BASE}/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!repoResponse.ok) {
      throw new Error('Failed to fetch repository info');
    }

    const repoData = await repoResponse.json() as any;
    const defaultBranch = repoData.default_branch;

    // Get file tree (recursive)
    const treeResponse = await fetch(
      `${this.API_BASE}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!treeResponse.ok) {
      throw new Error('Failed to fetch repository tree');
    }

    const treeData = await treeResponse.json() as any;

    // Filter to only files (blobs), not directories (trees)
    const files = treeData.tree
      .filter((item: any) => item.type === 'blob')
      .map((item: any) => ({
        path: item.path,
        type: item.type,
        size: item.size,
        sha: item.sha,
      }));

    return {
      files,
      truncated: treeData.truncated || false,
      sha: treeData.sha,
    };
  }
}
