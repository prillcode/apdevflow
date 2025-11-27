# APDevFlow

<img width="400" height="400" alt="AP_DevFlow_Logo_Clean" src="https://github.com/user-attachments/assets/9c549e10-a0bf-4e4c-a944-9037ce7a6c94" />


**AI-Powered Development Workflow Platform**

APDevFlow is a lightweight scrum dashboard and AI-powered development workflow accelerator that helps Product Owners break down features into epics and stories, and helps developers generate implementation specs using AI skills.

**Created by:** Aaron Prill (@prillcode)
**Status:** Planning Phase
**License:** TBD

---

## ⚡ Quick Setup (New Machine)

This is a **pnpm + Turborepo monorepo**. Follow these steps to get started:

### 1. Prerequisites

Ensure you have the following installed:
- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0

```bash
# Install pnpm if needed
npm install -g pnpm@9.0.0

# Verify versions
node --version  # Should be >= 20
pnpm --version  # Should be >= 9
```

### 2. Clone the Repository
```bash
git clone https://github.com/prillcode/apdevflow.git
cd apdevflow
```

### 3. Install Dependencies
```bash
# Install all dependencies for all packages
pnpm install
```

This will install dependencies for:
- Root workspace
- `apps/web` (React dashboard)
- `apps/api` (Lambda functions)
- `apps/cli` (devflow CLI)
- `packages/shared` (shared types/utils)
- `packages/skills-adapter` (skill API adaptation)

### 4. Build All Packages
```bash
# Build everything in parallel with Turborepo
pnpm build

# Or build specific packages
pnpm --filter @apdevflow/shared build
pnpm --filter @apdevflow/cli build
```

### 5. Setup Skills Symlinks
The repository contains Claude Code skills that need to be symlinked to your local Claude skills directory:

```bash
# Create skills directory if it doesn't exist
mkdir -p ~/.claude/skills

# Create symlinks (adjust path to match where you cloned the repo)
REPO_PATH="$PWD"  # Or use absolute path like ~/projects/apdevflow

ln -s "$REPO_PATH/skills/api-skills/epic-feature-creator" ~/.claude/skills/epic-feature-creator
ln -s "$REPO_PATH/skills/api-skills/feature-story-creator" ~/.claude/skills/feature-story-creator
ln -s "$REPO_PATH/skills/local-skills/dev-orchestrator" ~/.claude/skills/dev-orchestrator
ln -s "$REPO_PATH/skills/local-skills/dev-spec" ~/.claude/skills/dev-spec
ln -s "$REPO_PATH/skills/local-skills/dev-execute" ~/.claude/skills/dev-execute
ln -s "$REPO_PATH/skills/local-skills/git-commit-helper" ~/.claude/skills/git-commit-helper
ln -s "$REPO_PATH/skills/local-skills/debug-like-expert" ~/.claude/skills/debug-like-expert
```

### 6. Verify Setup
```bash
# Check that symlinks are created
ls -la ~/.claude/skills/ | grep apdevflow

# Check that builds succeeded
ls -la apps/cli/dist
ls -la packages/shared/dist

# Test CLI (after build)
node apps/cli/dist/cli.js --version
```

### 7. Development Workflow

```bash
# Start development mode (watches for changes)
pnpm dev

# Run web app only
pnpm --filter @apdevflow/web dev

# Run CLI in dev mode
pnpm --filter @apdevflow/cli dev

# Adapt API skills (regenerate api-prompt.md files)
pnpm adapt-skills
```

### 8. Useful Commands

```bash
# Run builds
pnpm build           # Build all packages

# Clean everything
pnpm clean           # Remove dist/ and node_modules

# Format code
pnpm format          # Run Prettier

# Lint code
pnpm lint            # Run ESLint

# Run tests
pnpm test            # Run all tests
```

That's it! The monorepo is set up and ready for development. 🚀

---

## 📚 Documentation

- **[Product Requirements Document (Revised)](docs/APP-PRD-Revised.md)** - Complete PRD with architecture, workflows, and MVP phases
- **[Original PRD](docs/APP-PRD-Original.md)** - Initial planning document (for reference)
- **[Claude Integration Strategy](docs/CLAUDE-INTEGRATION.md)** - Deep dive on Claude Code vs. Claude API approaches
- **[Git Worktrees Integration](docs/GIT-WORKTREE-STRAT.md)** - Developer workflow with git worktrees
- **[Branding Guide](docs/BRANDING.md)** - Brand identity and naming conventions
- **[Skills Reference](docs/SKILLS.md)** - How APDevFlow uses Claude Code skills

---

## 🎯 What is APDevFlow?

APDevFlow is **NOT** just another JIRA plugin. It's a standalone workflow tool that:

### For Product Owners
- 📝 **AI-Powered Planning** - Paste a feature request or PRD, get AI-generated epics and user stories
- ✅ **Review & Approve** - Edit AI output before creating tickets
- 📤 **Flexible Export** - Export to JIRA (CSV for MVP, API later), Linear, or use standalone

### For Developers
- 🚀 **Fast Spec Generation** - Export story to workspace, use Claude Code skills to generate implementation specs
- 🌿 **Git Worktree Integration** - One worktree per story for clean separation
- 📦 **Artifact Management** - Track all generated specs and code with versioning

### Key Benefits
- ⏱️ **70% faster** spec writing (45 min → 5 min)
- 📊 **15x faster** epic breakdown (3 hours → 15 min)
- 💰 **Low cost** - $25-30/month for entire team
- 🔓 **Not locked-in** - Works with or without JIRA

---

## 🏗️ Architecture Overview

### Components

```
┌─────────────────────────────────────────────┐
│          APDevFlow Platform                 │
├─────────────────────────────────────────────┤
│                                             │
│  📱 Planning Dashboard (React SPA)         │
│     - Feature → Epic → Story breakdown     │
│     - AI-powered generation via Bedrock    │
│     - Review/edit/approve workflow         │
│                                             │
│  💻 Developer Dashboard (React SPA)        │
│     - My Stories view                      │
│     - Artifact viewer                      │
│     - Export to workspace                  │
│                                             │
│  🔧 CLI Tool (devflow)                     │
│     - devflow start story-123              │
│     - devflow finish story-123             │
│     - devflow skills install               │
│                                             │
│  ☁️ Backend (AWS Serverless)               │
│     - Lambda functions                     │
│     - DynamoDB (Features/Epics/Stories)   │
│     - S3 (artifacts, exports)              │
│     - Bedrock (Claude API for PO flows)    │
│                                             │
└─────────────────────────────────────────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │  Claude Code Skills   │
        │  (from claudeai-dev)  │
        └───────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query
- Vite

**Backend:**
- AWS Lambda (Node.js 20.x)
- DynamoDB
- S3
- Bedrock (Claude API)
- API Gateway

**CLI:**
- TypeScript (compiled to Node.js)
- Distributed via npm + Homebrew

---

## 🧩 Skills Integration

APDevFlow includes Claude Code skills directly in this repository under [skills/](skills/).

### Skills Included

| Skill | Purpose | Mode | Location |
|-------|---------|------|----------|
| [epic-feature-creator](skills/api-skills/epic-feature-creator) | Break down feature → epics | Claude API (Bedrock) | `skills/api-skills/` |
| [feature-story-creator](skills/api-skills/feature-story-creator) | Break down epic → stories | Claude API (Bedrock) | `skills/api-skills/` |
| [dev-orchestrator](skills/local-skills/dev-orchestrator) | Orchestrate full dev workflow | Claude Code (local) | `skills/local-skills/` |
| [dev-spec](skills/local-skills/dev-spec) | Generate implementation specs | Claude Code (local) | `skills/local-skills/` |
| [dev-execute](skills/local-skills/dev-execute) | Implement from spec | Claude Code (local) | `skills/local-skills/` |
| [git-commit-helper](skills/local-skills/git-commit-helper) | Generate commit messages | Claude Code (local) | `skills/local-skills/` |
| [debug-like-expert](skills/local-skills/debug-like-expert) | Deep debugging methodology | Claude Code (local) | `skills/local-skills/` |

### Skill Organization

**API Skills** (`skills/api-skills/`)
- Invoked by backend Lambda functions via Claude API (Bedrock)
- Used in Planning Dashboard for PO workflows
- Each skill has `SKILL.md` (full) and `api-prompt.md` (API-adapted)

**Local Skills** (`skills/local-skills/`)
- Invoked by developers using Claude Code locally
- Symlinked to `~/.claude/skills/` for immediate availability
- Full tool access (Read, Write, Bash, Git, etc.)

### How Skills Work

**Backend (API Skills):**
```typescript
// Lambda loads API-adapted prompt
const prompt = await fs.readFile(
  './skills/api-skills/epic-feature-creator/api-prompt.md'
);

// Invoke via Bedrock
const epics = await bedrock.invokeModel({
  system: prompt,
  messages: [{ role: 'user', content: featureDescription }]
});
```

**Local (Developer Skills):**
```bash
# Developer uses Claude Code
cd ~/repos/myapp-story-123
claude-code

> Use dev-orchestrator to implement this story
# Claude Code loads ~/.claude/skills/dev-orchestrator/SKILL.md
```

See [skills/README.md](skills/README.md) for detailed documentation on skill development and usage.

---

## 🚀 MVP Roadmap

### Phase 1: Core Dashboard + AI Planning (Weeks 1-2)
- React dashboard with Tailwind + shadcn/ui
- Feature → Epic → Story generation via Bedrock
- Cognito authentication
- DynamoDB storage

### Phase 2: Developer Dashboard + Story Export (Weeks 3-4)
- Developer "My Stories" view
- Story export to local workspace
- CLI tool basics (`devflow start`, `devflow list`)

### Phase 3: Artifact Upload + Git Worktrees (Weeks 5-6)
- `devflow finish` uploads artifacts
- Git worktree integration
- Artifact viewer in dashboard

### Phase 4: JIRA Integration (Week 7)
- CSV export for JIRA bulk import
- Manual workflow (automated later)

### Phase 5: Skill Installation + Docs (Week 8)
- `devflow skills install` automation
- User documentation
- Video walkthrough

### Phase 6: Analytics + Polish (Weeks 9-10)
- Usage analytics dashboard
- Error handling
- Production-ready

**Total MVP:** 10 weeks (~200 hours)

---

## 💰 Cost Model

### AWS Infrastructure (Monthly)
- Lambda: ~$1
- DynamoDB: ~$3-5
- S3: ~$1
- API Gateway: ~$0.25
- CloudFront: ~$5
- Bedrock Claude API: ~$11
- Secrets Manager: ~$2
- CloudWatch: ~$2

**Total: $25-30/month** for entire team

**Per Developer (team of 20):** $1.50/month

### ROI Calculation
- Time saved per developer: ~8 hours/month
- Value: $50/hour (conservative)
- Monthly value: 20 devs × 8 hrs × $50 = **$8,000**
- Monthly cost: **$30**
- **ROI: 26,600%**

---

## 🎨 Branding

- **Product Name:** APDevFlow (AI-Powered DevFlow)
- **CLI Command:** `devflow` (primary) + `apdev` (alias)
- **Brand Identity:** "AP" = Agile Programming + Aaron Prill
- **Tagline:** "Where planning meets implementation, powered by AI"

---

## 🔗 Related Projects

- **[claudeai-dev](https://github.com/prillcode/claudeai-dev)** - Reusable Claude Code skills library (required dependency)
- **Claude Code** - Official Anthropic CLI tool (developer prerequisite)

---

## 📋 Current Status

**Phase:** Planning & Documentation ✅

**Completed:**
- ✅ Product Requirements Document (revised)
- ✅ Architecture design
- ✅ Integration strategy
- ✅ Cost modeling
- ✅ Skills identification

**Next Steps:**
1. Setup AWS account + CDK project
2. Prototype Bedrock skill invocation
3. Design UI mockups
4. Build CLI skeleton

---

## 🤝 Contributing

This project is currently in the planning phase. Contributions will be welcome once development begins.

---

## 📄 License

License TBD (likely MIT or Apache 2.0)

---

## 📧 Contact

**Creator:** Aaron Prill
**GitHub:** [@prillcode](https://github.com/prillcode)

---

**Built with ❤️ using Claude Code and AI-powered workflows**
