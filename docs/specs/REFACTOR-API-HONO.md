# Dev Spec: Refactor API to Pure Hono Architecture

**Story ID**: REFACTOR-API-001  
**Created**: 2025-12-01  
**Status**: Ready for Implementation  
**Estimated Effort**: 3-4 hours

---

## Overview

Refactor the API from dual Lambda/Hono architecture to a pure Hono application. This simplifies the codebase, removes wrapper complexity, and keeps deployment options open (AWS Lambda, ECS, Fly.io, Railway, VPS, etc.).

---

## Current State

```
apps/api/src/
├── dev-server.ts                    # Hono dev server (wraps Lambda)
├── lambdas/
│   └── github-oauth-exchange.ts     # Lambda handler
└── (no route structure)
```

**Problems:**
- Dual architecture (Lambda handlers + Hono wrapper)
- Lambda handlers don't naturally work in dev
- Adding endpoints requires both Lambda handler + dev-server route
- Tightly coupled to AWS Lambda deployment

---

## Target State

```
apps/api/src/
├── index.ts                         # Main Hono app (all routes)
├── server.ts                        # Dev server (runs index.ts)
├── lambda.ts                        # Lambda adapter (wraps index.ts)
├── routes/
│   ├── github.ts                    # GitHub OAuth + repo endpoints
│   ├── health.ts                    # Health check endpoint
│   └── index.ts                     # Route aggregator
├── services/
│   ├── github.ts                    # GitHub API client
│   └── aws.ts                       # AWS SDK clients (future)
├── middleware/
│   ├── cors.ts                      # CORS middleware
│   └── auth.ts                      # Auth middleware (future)
└── types/
    └── index.ts                     # Shared types
```

**Benefits:**
- Single codebase for dev and production
- Clean route structure
- Easy to add new endpoints
- Deployment-agnostic (can deploy anywhere)
- No wrapper complexity

---

## Implementation Steps

### 1. Install Dependencies

```bash
cd apps/api
pnpm add @hono/node-server @hono/aws-lambda
```

### 2. Create Route Structure

**File: `src/routes/github.ts`**
```typescript
import { Hono } from 'hono';

const github = new Hono();

// POST /api/github/oauth/exchange
github.post('/oauth/exchange', async (c) => {
  // Move logic from lambdas/github-oauth-exchange.ts
  // Return JSON directly (no Lambda response wrapper)
});

export default github;
```

**File: `src/routes/health.ts`**
```typescript
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
```

**File: `src/routes/index.ts`**
```typescript
import { Hono } from 'hono';
import github from './github';
import health from './health';

const routes = new Hono();

routes.route('/github', github);
routes.route('/health', health);

export default routes;
```

### 3. Create Main Hono App

**File: `src/index.ts`**
```typescript
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
```

### 4. Create Dev Server

**File: `src/server.ts`**
```typescript
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
```

### 5. Create Lambda Adapter

**File: `src/lambda.ts`**
```typescript
import { handle } from '@hono/aws-lambda';
import app from './index';

export const handler = handle(app);
```

### 6. Create GitHub Service

**File: `src/services/github.ts`**
```typescript
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

    return await response.json();
  }

  static async fetchUser(accessToken: string): Promise<any> {
    const response = await fetch(`${this.API_BASE}/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return await response.json();
  }

  static async fetchRepos(accessToken: string): Promise<any[]> {
    const response = await fetch(
      `${this.API_BASE}/user/repos?per_page=100&sort=updated`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch repos');
    }

    return await response.json();
  }
}
```

### 7. Migrate GitHub OAuth Route

**Update `src/routes/github.ts`:**
```typescript
import { Hono } from 'hono';
import { GitHubService } from '../services/github';

const github = new Hono();

github.post('/oauth/exchange', async (c) => {
  try {
    const { code } = await c.req.json();

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
```

### 8. Update package.json Scripts

**File: `apps/api/package.json`**
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build:lambda": "tsc && cp package.json dist/",
    "clean": "rm -rf dist",
    "lint": "eslint src/ --ext ts"
  }
}
```

### 9. Update TypeScript Config

**File: `apps/api/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.node.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "ESNext",
    "target": "ES2022"
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../../packages/shared" }]
}
```

### 10. Remove Old Files

```bash
rm apps/api/src/dev-server.ts
rm -rf apps/api/src/lambdas/
```

### 11. Update Frontend API URL

**File: `apps/web/.env.local`**
```bash
# No changes needed - still points to http://localhost:3001
VITE_API_URL=http://localhost:3001
```

---

## Testing Checklist

- [ ] Dev server starts: `pnpm --filter @apdevflow/api dev`
- [ ] Health endpoint works: `curl http://localhost:3001/api/health`
- [ ] GitHub OAuth flow works in web app
- [ ] TypeScript compiles: `pnpm --filter @apdevflow/api build`
- [ ] No TypeScript errors
- [ ] All existing functionality preserved

---

## Deployment Options (Post-Refactor)

### Option 1: AWS Lambda (Serverless)
```bash
# Build Lambda package
pnpm build:lambda

# Deploy using AWS SAM, Serverless Framework, or CDK
# Entry point: dist/lambda.handler
```

### Option 2: AWS ECS/Fargate (Container)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY dist/ ./dist/
COPY node_modules/ ./node_modules/
CMD ["node", "dist/server.js"]
```

### Option 3: Fly.io (Easiest)
```bash
fly launch
fly deploy
```

### Option 4: Railway/Render
- Connect GitHub repo
- Set build command: `pnpm build`
- Set start command: `node dist/server.js`

---

## Migration Notes

**Breaking Changes:**
- None for frontend (API endpoints remain the same)
- Lambda deployment process changes (use `lambda.ts` adapter)

**Environment Variables:**
- Same as before: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- New optional: `CORS_ORIGIN`, `PORT`

**Rollback Plan:**
- Keep old code in git branch
- Can revert commit if issues arise
- No database migrations needed

---

## Future Enhancements (Post-Refactor)

- Add auth middleware for protected routes
- Add request logging middleware
- Add rate limiting
- Add OpenAPI/Swagger docs
- Add request validation (Zod)
- Add error handling middleware

---

## Success Criteria

✅ Single Hono app runs in dev and prod  
✅ No Lambda wrapper complexity  
✅ Clean route structure  
✅ All existing features work  
✅ TypeScript compiles without errors  
✅ Can deploy to multiple platforms  
✅ Dev experience improved (faster, simpler)
