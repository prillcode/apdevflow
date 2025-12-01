# GitHub OAuth Integration Setup

> **Note:** APDevFlow is designed to be self-hosted. Each deployment (your organization,
> development team, or individual developer) creates their own GitHub OAuth App with their
> own credentials. This guide walks you through setting up OAuth for YOUR deployment.

This guide walks you through setting up GitHub OAuth integration for APDevFlow.

## Overview

The GitHub OAuth integration allows users to:
- Connect their GitHub account to APDevFlow
- Access private repositories
- Validate repository access when planning items of work

## Architecture

**Frontend (apps/web):**
- User clicks "Connect GitHub" button
- Redirects to GitHub OAuth authorization page
- GitHub redirects back to `/auth/callback` with authorization code
- Frontend calls Lambda function to exchange code for access token
- Token stored in localStorage for subsequent GitHub API calls

**Backend (apps/api):**
- Lambda function exchanges authorization code for access token
- Keeps GitHub client secret secure on the server side
- Returns access token to frontend

## Setup Instructions

### 1. Create a GitHub OAuth App

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: APDevFlow (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/auth/callback`
4. Click "Register application"
5. Copy the **Client ID** (you'll need this for both frontend and backend)
6. Click "Generate a new client secret"
7. Copy the **Client Secret** (⚠️ save this securely - you won't be able to see it again)

### 2. Configure Frontend Environment Variables

1. Navigate to `apps/web/`
2. Create a `.env.local` file (copy from `.env.example`):
   ```bash
   cp .env.example .env.local
   ```
3. Edit `.env.local` and add your GitHub OAuth credentials:
   ```env
   VITE_GITHUB_CLIENT_ID=your_client_id_here
   VITE_GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback
   VITE_API_URL=http://localhost:3001
   ```

### 3. Configure Backend Environment Variables

For local development (if running Lambda locally):

1. Navigate to `apps/api/`
2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and add your GitHub OAuth credentials:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

For AWS Lambda deployment:

1. Go to AWS Lambda console
2. Select the `github-oauth-exchange` function
3. Go to Configuration > Environment variables
4. Add the following environment variables:
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth Client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth Client Secret

### 4. Start the Development Servers

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Start the web app
cd apps/web
pnpm dev

# In another terminal, start the API (if running locally)
cd apps/api
# Configure local Lambda development server
```

### 5. Test the OAuth Flow

1. Open the web app at `http://localhost:3000`
2. Click the "Connect GitHub" button in the top right
3. You'll be redirected to GitHub to authorize the app
4. After authorization, you'll be redirected back to APDevFlow
5. You should see your GitHub avatar and username in the header

## OAuth Scopes

The integration requests the following GitHub scopes:

- `repo`: Full control of private repositories
- `read:user`: Read user profile data
- `user:email`: Access user email addresses

## Security Considerations

1. **Client Secret Protection**: The GitHub client secret is NEVER exposed to the frontend. It's only used in the Lambda function.

2. **CSRF Protection**: The OAuth flow uses a state parameter to prevent CSRF attacks.

3. **Token Storage**: Access tokens are stored in localStorage. For production, consider more secure storage options.

4. **HTTPS**: For production deployments, always use HTTPS for the callback URL.

5. **Token Expiration**: GitHub OAuth tokens don't expire by default, but you may want to implement token refresh logic for enhanced security.

## Deployment Notes

### Production GitHub OAuth App

For production deployment:

1. Create a separate GitHub OAuth App for production
2. Set the Homepage URL to your production domain (e.g., `https://apdevflow.com`)
3. Set the Authorization callback URL to your production callback (e.g., `https://apdevflow.com/auth/callback`)
4. Update the production environment variables with the production OAuth credentials

### Lambda Deployment

When deploying to AWS Lambda:

1. Ensure the Lambda function has internet access (configure VPC settings if needed)
2. Set environment variables in Lambda configuration
3. Configure API Gateway to route `/auth/github/exchange` to the Lambda function
4. Enable CORS on the API Gateway endpoint

### Environment-Specific Configuration

Each deployment environment should have its own GitHub OAuth App:

**Local Development:**
- Callback URL: `http://localhost:3000/auth/callback`
- Use in `.env.local` files
- Can be your personal GitHub account

**Production Self-Hosted:**
- Callback URL: `https://apdevflow.yourcompany.com/auth/callback` (use your actual domain)
- Set as Lambda environment variables (AWS) or Docker secrets
- Should be your organization's GitHub account

**Multiple Environments:**
If you run dev/staging/production, create separate OAuth Apps for each:
- Development: `http://localhost:3000/auth/callback`
- Staging: `https://staging-apdevflow.yourcompany.com/auth/callback`
- Production: `https://apdevflow.yourcompany.com/auth/callback`

## Troubleshooting

### "OAuth not configured" error

- Verify that `VITE_GITHUB_CLIENT_ID` is set in `apps/web/.env.local`
- Check browser console for any error messages

### Token exchange fails

- Verify that the Lambda function has `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` environment variables
- Check Lambda function logs in CloudWatch
- Ensure the API URL is correct in `VITE_API_URL`

### CORS errors

- Verify that the Lambda function includes CORS headers
- Check API Gateway CORS configuration

### "Invalid state parameter" error

- This indicates a potential CSRF attack or browser cookie issues
- Clear browser localStorage and try again
- Ensure the callback URL matches exactly what's registered in GitHub

## API Endpoints

### POST /auth/github/exchange

Exchanges a GitHub authorization code for an access token.

**Request:**
```json
{
  "code": "authorization_code_from_github"
}
```

**Response:**
```json
{
  "access_token": "gho_...",
  "token_type": "bearer",
  "scope": "repo,read:user,user:email"
}
```

## Future Enhancements

- [ ] Token refresh mechanism
- [ ] Server-side token storage (DynamoDB)
- [ ] Token encryption
- [ ] Rate limiting on OAuth endpoints
- [ ] Multi-provider OAuth (GitLab, Bitbucket)
- [ ] OAuth token revocation
