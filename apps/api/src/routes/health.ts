import { Hono } from 'hono';

const health = new Hono();

// GET /api/health
health.get('/', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

export default health;
