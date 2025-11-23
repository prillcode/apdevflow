# APDevFlow

**AI-Powered Development Workflow Platform**

APDevFlow is a lightweight scrum dashboard and AI-powered development workflow accelerator that helps Product Owners break down features into epics and stories, and helps developers generate implementation specs using AI skills.

**Created by:** Aaron Prill (@prillcode)
**Status:** Planning Phase
**License:** TBD

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

APDevFlow uses Claude Code skills from the **[claudeai-dev](https://github.com/prillcode/claudeai-dev)** repository.

### Skills Used

| Skill | Purpose | Mode |
|-------|---------|------|
| [epic-feature-creator](https://github.com/prillcode/claudeai-dev/tree/main/agile-skills/epic-feature-creator) | Break down feature → epics | Claude API (Bedrock) |
| [feature-story-creator](https://github.com/prillcode/claudeai-dev/tree/main/agile-skills/feature-story-creator) | Break down epic → stories | Claude API (Bedrock) |
| [dev-spec](https://github.com/prillcode/claudeai-dev/tree/main/dev-skills/dev-spec) | Generate implementation specs | Claude Code (local) |
| [dev-execute](https://github.com/prillcode/claudeai-dev/tree/main/dev-skills/dev-execute) | Implement from spec | Claude Code (local) |
| [git-commit-helper](https://github.com/prillcode/claudeai-dev/tree/main/dev-skills/git-commit-helper) | Generate commit messages | Claude Code (local) |

### Skill Installation (Future)

When the CLI is built, skills will be installed automatically:

```bash
devflow skills install
```

This will:
1. Clone the `claudeai-dev` repository
2. Symlink skills to `~/.claude/skills/`
3. Track version for reproducibility

### How Skills Are Referenced

**Phase 1 (MVP):** Direct reference to public GitHub repo
- CLI clones `claudeai-dev` at install time
- Uses `main` branch (or specific tag/commit)
- Simple, no submodule complexity

**Phase 2 (Production):** Version locking
- CLI references specific git tags (e.g., `v1.0.0`)
- Ensures reproducible builds
- Can upgrade skills independently

**Future:** npm package (if skills become published)
```bash
npm install @apdevsolutions/claude-skills
```

See [docs/SKILLS.md](docs/SKILLS.md) for detailed skill reference documentation.

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
