# Deployment Guide

APDevFlow is designed to be self-hosted in your own infrastructure. Each deployment is completely independent with its own data, GitHub OAuth credentials, and configuration.

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- A GitHub account (to create OAuth app)
- AWS account OR a Linux VPS

## Quick Start Options

### Option 1: Local Development

Perfect for testing and development:

```bash
# 1. Clone and install
git clone https://github.com/prillcode/apdevflow.git
cd apdevflow
pnpm install

# 2. Set up GitHub OAuth (see docs/GITHUB_OAUTH_SETUP.md)
cd apps/web
cp .env.example .env.local
# Edit .env.local with your GitHub OAuth credentials

# 3. Start the app
pnpm dev
```

The web app will start at `http://localhost:3000`.

### Option 2: AWS Lambda Deployment

Deploy the Hono API to AWS Lambda using the built-in adapter.

**What you'll need:**
- AWS account
- GitHub OAuth app (production callback URL)
- Domain name (optional, can use API Gateway URL)

**AWS Services used:**
- Lambda (Hono API with adapter)
- API Gateway (REST API)
- S3 (static hosting + artifacts)
- DynamoDB (data storage)
- CloudFront (CDN for frontend)

**Deployment:**
```bash
# Build Lambda package
cd apps/api
pnpm build:lambda

# Deploy using AWS SAM, Serverless Framework, or CDK
# Entry point: dist/lambda.handler
```

**Status:** API refactored and ready. IaC templates coming in Phase 2.

### Option 3: Docker / VPS Deployment

Self-host on any Linux VPS or container platform (Fly.io, Railway, Render, etc.).

**What you'll need:**
- Linux VPS or container platform account
- GitHub OAuth app
- Database (PostgreSQL, MySQL, or Turso Cloud)
- Object storage (S3-compatible or local)

**Deployment:**
```bash
# Build the API
cd apps/api
pnpm build

# Run with Node.js
node dist/server.js

# Or use Docker
docker build -t apdevflow-api .
docker run -p 3001:3001 apdevflow-api
```

**Supported Platforms:**
- **Fly.io** - `fly launch` (easiest, ~$5/month)
- **Railway** - Connect GitHub repo, auto-deploy
- **Render** - Connect GitHub repo, auto-deploy
- **DigitalOcean App Platform** - Deploy from GitHub
- **AWS ECS/Fargate** - Containerized deployment
- **Any VPS** - Ubuntu/Debian with Node.js 20+

**Status:** API refactored to pure Hono. Ready for deployment to any platform.

## Current Status

**✅ What works now:**
- Local development setup
- Planning Dashboard UI
- GitHub OAuth integration
- LocalStorage data persistence

**🔨 Coming soon:**
- AWS deployment automation (CDK templates)
- Docker Compose configuration
- Database migrations
- Backup/restore scripts
- Production deployment checklist

## Configuration

All deployments use environment variables for configuration:

### Frontend (`apps/web/.env.local`)

```env
VITE_GITHUB_CLIENT_ID=your_client_id
VITE_GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_API_URL=http://localhost:3001
```

### Backend (`apps/api/.env` or Lambda environment variables)

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

See **[GitHub OAuth Setup](GITHUB_OAUTH_SETUP.md)** for detailed OAuth configuration instructions.

## Security Considerations

**For Production Deployments:**

1. **Use HTTPS** - Always use HTTPS for production callback URLs
2. **Secure Secrets** - Use AWS Secrets Manager, Docker Secrets, or similar
3. **Environment Isolation** - Use separate GitHub OAuth apps for dev/staging/prod
4. **Regular Updates** - Keep dependencies updated for security patches
5. **Access Control** - Restrict who can access your deployment

## Data Storage

**Current (Phase 1):**
- LocalStorage (browser-based, per-user)
- Perfect for development and testing

**Coming Soon (Phase 2+):**
- DynamoDB (AWS deployments)
- PostgreSQL/MySQL (Docker/VPS deployments)
- Turso Cloud (serverless SQLite option)

## Self-Hosted Benefits

When you self-host APDevFlow:

- ✅ **Complete Data Ownership** - Your data stays in your infrastructure
- ✅ **No Vendor Lock-in** - No dependency on external services
- ✅ **Full Control** - Customize and extend as needed
- ✅ **Privacy** - GitHub tokens and data never leave your environment
- ✅ **Cost Effective** - Pay only for infrastructure you use

## Deployment Architecture

The API is built with Hono, a lightweight web framework that runs anywhere:

```
┌─────────────────────────────────────────────┐
│ APDevFlow Architecture                      │
├─────────────────────────────────────────────┤
│                                             │
│  Frontend (React SPA)                       │
│  ├─ Vite build → Static files              │
│  └─ Deploy to: S3+CloudFront, Vercel, etc. │
│                                             │
│  Backend (Hono API)                         │
│  ├─ Pure Hono application                  │
│  ├─ Deploy to: Lambda, Fly.io, Railway,    │
│  │              ECS, VPS, etc.             │
│  └─ Adapters: AWS Lambda, Node.js server   │
│                                             │
│  Data Layer                                 │
│  └─ DynamoDB, PostgreSQL, MySQL, or Turso  │
│                                             │
└─────────────────────────────────────────────┘
```

**Deployment Flexibility:**
- **Lambda:** Use `lambda.ts` adapter for serverless
- **Node.js:** Use `server.ts` for always-on deployments
- **Docker:** Containerize for any platform
- **Edge:** Deploy to Cloudflare Workers (future)

## Deployment Options Summary

The Hono refactor enables deployment to multiple platforms:

### AWS Lambda (Serverless)
- **Setup:** Use `@hono/aws-lambda` adapter (already included)
- **Entry Point:** `dist/lambda.handler`
- **IaC:** CloudFormation/CDK templates (coming soon)
- **Cost:** ~$5-15/month (pay per request)
- **Pros:** Auto-scaling, no server management
- **Cons:** Cold starts (~100-500ms)

### Fly.io (Easiest)
- **Setup:** `fly launch` from project root
- **Build:** `pnpm build` → `node dist/server.js`
- **Cost:** ~$5-10/month (always-on)
- **Pros:** No cold starts, simple deployment, global edge
- **Cons:** Requires credit card

### Railway / Render
- **Setup:** Connect GitHub repo, auto-deploy on push
- **Build Command:** `pnpm build`
- **Start Command:** `node apps/api/dist/server.js`
- **Cost:** ~$5-20/month
- **Pros:** GitHub integration, easy setup
- **Cons:** Limited free tier

### AWS ECS/Fargate (Container)
- **Setup:** Docker image + ECS task definition
- **Cost:** ~$15-30/month (always-on)
- **Pros:** No cold starts, full AWS integration
- **Cons:** More complex setup

### VPS (DigitalOcean, Linode, etc.)
- **Setup:** Install Node.js 20+, clone repo, run server
- **Cost:** $5-20/month (VPS cost)
- **Pros:** Full control, predictable pricing
- **Cons:** Manual server management

### Kubernetes
- **Setup:** Helm charts (coming soon)
- **Use Case:** Enterprise deployments, multi-replica
- **Pros:** High availability, auto-scaling
- **Cons:** Complex setup, higher cost

## Support & Community

- **Issues:** [GitHub Issues](https://github.com/prillcode/apdevflow/issues)
- **Documentation:** [APDevFlow Docs](https://github.com/prillcode/apdevflow/tree/main/docs)
- **Discussions:** [GitHub Discussions](https://github.com/prillcode/apdevflow/discussions)

## Contributing

Want to contribute deployment guides or automation scripts? We welcome:

- Infrastructure as Code templates (CDK, Terraform, etc.)
- Docker Compose configurations
- Kubernetes Helm charts
- Deployment documentation improvements

See our [Contributing Guide](../CONTRIBUTING.md) for details.

---

**Remember:** APDevFlow is self-hosted. You control your data, your infrastructure, and your GitHub credentials. No central service, no vendor lock-in.
