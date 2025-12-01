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

export default github;
