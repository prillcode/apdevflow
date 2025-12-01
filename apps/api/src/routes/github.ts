import { Hono } from 'hono';
import { GitHubService } from '../services/github';

const github = new Hono();

// POST /api/github/oauth/exchange
github.post('/oauth/exchange', async (c) => {
  try {
    const body = await c.req.json();
    const { code } = body;

    if (!code) {
      return c.json({ error: 'Missing authorization code' }, 400);
    }

    const tokenData = await GitHubService.exchangeCodeForToken(code);
    
    return c.json(tokenData);
  } catch (error) {
    console.error('OAuth exchange error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Token exchange failed' 
    }, 500);
  }
});

// GET /api/github/repos/:owner/:repo/files
github.get('/repos/:owner/:repo/files', async (c) => {
  try {
    const { owner, repo } = c.req.param();
    const token = c.req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const files = await GitHubService.fetchRepoFiles(owner, repo, token);
    
    return c.json(files);
  } catch (error) {
    console.error('Fetch repo files error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch files' 
    }, 500);
  }
});

export default github;
