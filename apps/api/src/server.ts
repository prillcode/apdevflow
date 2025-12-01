import { serve } from '@hono/node-server';
import app from './index';

const PORT = Number(process.env.PORT) || 3001;

console.log(`🚀 APDevFlow API running on http://localhost:${PORT}`);
console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
console.log(`📍 GitHub OAuth: http://localhost:${PORT}/api/github/oauth/exchange`);

serve({ 
  fetch: app.fetch, 
  port: PORT 
});
