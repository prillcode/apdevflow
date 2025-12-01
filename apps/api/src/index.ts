import { Hono } from 'hono';
import { cors } from 'hono/cors';
import routes from './routes';
import dotenv from 'dotenv';
import path from 'path';

// Load .env for local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const app = new Hono();

// CORS middleware
app.use('/*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Mount routes under /api
app.route('/api', routes);

// Root endpoint
app.get('/', (c) => {
  return c.json({ 
    name: 'APDevFlow API',
    version: '0.1.0',
    status: 'running'
  });
});

export default app;
