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

### Option 2: AWS Deployment (Coming Soon)

Deploy to AWS using CloudFormation/CDK templates.

**What you'll need:**
- AWS account
- GitHub OAuth app (production callback URL)
- Domain name (optional, can use CloudFront URL)

**AWS Services used:**
- Lambda (Node.js functions)
- API Gateway (REST API)
- S3 (static hosting + artifacts)
- DynamoDB (data storage)
- CloudFront (CDN)

**Status:** Deployment scripts and IaC templates coming in Phase 2.

### Option 3: Docker / VPS (Coming Soon)

Self-host on any Linux VPS using Docker Compose.

**What you'll need:**
- Linux VPS (Ubuntu/Debian recommended)
- Docker + Docker Compose
- GitHub OAuth app
- Database (PostgreSQL, MySQL, or Turso Cloud)
- Object storage (S3-compatible or local)

**Status:** Docker Compose configuration coming in Phase 2.

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

Each self-hosted instance is completely independent:

```
Your Organization's Deployment:
┌─────────────────────────────────────┐
│ Your AWS Account / VPS              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ APDevFlow Instance          │   │
│  │ - Your GitHub OAuth App     │   │
│  │ - Your Database             │   │
│  │ - Your Object Storage       │   │
│  │ - Your Lambda Functions     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         ↓ OAuth Flow
    GitHub.com (Your OAuth App)
```

## Future Deployment Options

We're planning to support multiple deployment patterns:

### AWS Deployment
- **IaC:** CloudFormation/CDK templates
- **Services:** Lambda, API Gateway, DynamoDB, S3, CloudFront
- **Setup Time:** ~15 minutes (automated)
- **Cost:** ~$5-15/month (based on usage)

### Docker Compose (VPS)
- **Platform:** Any Linux VPS (DigitalOcean, Linode, etc.)
- **Services:** Docker containers + PostgreSQL/MySQL + local/S3 storage
- **Setup Time:** ~10 minutes
- **Cost:** VPS cost ($5-20/month depending on size)

### Kubernetes
- **Platform:** Any k8s cluster (EKS, GKE, self-hosted)
- **Setup:** Helm charts
- **Scale:** Multi-replica deployments
- **Use Case:** Enterprise deployments

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
