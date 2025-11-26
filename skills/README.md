# APDevFlow Skills

This directory contains all Claude Code skills for the APDevFlow platform. Skills are organized into two categories based on their invocation context.

## Directory Structure

```
skills/
├── api-skills/              # Skills invoked via API (PO workflows)
│   ├── epic-feature-creator/
│   │   ├── SKILL.md         # Full skill for Claude Code
│   │   └── api-prompt.md    # API-adapted version (auto-generated)
│   └── feature-story-creator/
│       ├── SKILL.md
│       └── api-prompt.md
│
├── local-skills/            # Skills for local Claude Code usage
│   ├── dev-orchestrator/
│   ├── dev-spec/
│   ├── dev-execute/
│   ├── git-commit-helper/
│   └── debug-like-expert/
│
└── README.md (this file)
```

**Note:** The skill adaptation script has moved to the monorepo:
- Location: `packages/skills-adapter/src/adapt-for-api.ts`
- Run via: `pnpm adapt-skills` from repo root

## Skill Categories

### 1. API Skills (Backend Invocation)

These skills are invoked by the APDevFlow backend via Claude API (Bedrock or direct). They power the Planning Dashboard workflows for Product Owners.

#### epic-feature-creator
- **Purpose**: Breaks down features into epics
- **Used by**: PO in Planning Dashboard
- **Invocation**: Backend Lambda → Claude API (Bedrock)
- **Input**: Feature description / PRD
- **Output**: 3-5 structured epics with descriptions

#### feature-story-creator
- **Purpose**: Breaks down epics into user stories
- **Used by**: PO in Planning Dashboard
- **Invocation**: Backend Lambda → Claude API (Bedrock)
- **Input**: Epic content
- **Output**: 4-8 user stories with acceptance criteria

**API Adaptation:**
- `SKILL.md` contains the full skill for reference
- `api-prompt.md` is the adapted version for API use (auto-generated)
- API versions remove tool instructions and enforce JSON output

### 2. Local Skills (Developer Workflows)

These skills are installed locally via `devflow skills install` and used directly in Claude Code on developer machines.

#### dev-orchestrator
- **Purpose**: Orchestrates end-to-end development workflow
- **Used by**: Developers in Claude Code
- **Workflow**: spec → plan → implement → test → commit

#### dev-spec
- **Purpose**: Generates implementation specifications
- **Used by**: Developers, often invoked by dev-orchestrator
- **Input**: Story requirements
- **Output**: Detailed technical spec in `.dev-docs/features/`

#### dev-execute
- **Purpose**: Executes implementation specs
- **Used by**: Developers, often invoked by dev-orchestrator
- **Input**: Spec file path
- **Output**: Implemented code

#### git-commit-helper
- **Purpose**: Creates well-formatted git commits
- **Used by**: Developers in Claude Code
- **Input**: Git diff
- **Output**: Commit with clear message

#### debug-like-expert
- **Purpose**: Deep debugging methodology
- **Used by**: Developers for complex issues
- **Workflow**: Evidence gathering → hypothesis testing → verification

## Installation

### For Developers (Local Skills)

The skills are already installed if you're in this repo! The repo uses symlinks:

```bash
# Verify symlinks
ls -la ~/.claude/skills/ | grep apdevflow

# Should see symlinks like:
# dev-orchestrator -> /path/to/apdevflow/skills/local-skills/dev-orchestrator
```

### For Distribution (CLI Tool)

When users install via the CLI tool:

```bash
devflow skills install
```

The CLI will:
1. Clone this repo (or sync from it)
2. Create symlinks in `~/.claude/skills/` pointing to repo skills
3. Track version in `~/.apdevflow/config.json`

## Development

### Editing Skills

1. Edit skill files directly in this repo: `skills/api-skills/` or `skills/local-skills/`
2. Changes are immediately available in Claude Code (via symlinks)
3. Test in Claude Code
4. Commit changes to repo

### Generating API Versions

After editing API skills, regenerate the `api-prompt.md` files:

```bash
# From repo root
pnpm adapt-skills

# Or run directly from the package
pnpm --filter @apdevflow/skills-adapter adapt
```

This strips tool instructions and adds JSON output formatting. The adaptation script is located at: `packages/skills-adapter/src/adapt-for-api.ts`

### File Structure for Each Skill

```
skill-name/
├── SKILL.md              # Main skill prompt
├── api-prompt.md         # API-adapted version (if API skill, auto-generated)
└── references/           # Optional: supporting docs
    └── *.md
```

## How Skills Are Used

### API Skills (Backend)

```typescript
// Lambda function example
import { BedrockRuntime } from '@aws-sdk/client-bedrock-runtime';
import * as fs from 'fs/promises';

const skillPrompt = await fs.readFile(
  './skills/api-skills/epic-feature-creator/api-prompt.md',
  'utf-8'
);

const response = await bedrock.invokeModel({
  modelId: 'anthropic.claude-sonnet-4-5-v2',
  body: JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4000,
    system: skillPrompt,
    messages: [{
      role: 'user',
      content: `Feature Request:\n\n${featureDescription}`
    }]
  })
});

const epics = JSON.parse(response.items);
```

### Local Skills (Claude Code)

```bash
# Developer workflow
cd ~/repos/myapp-story-123

# In Claude Code:
> I have a story in .apdevflow/story.md. Please use dev-orchestrator
  to create a spec and implement it.

# Claude Code loads ~/.claude/skills/dev-orchestrator/SKILL.md
# and follows the workflow
```

## Testing Skills

### Testing API Skills

```bash
# Use Claude Code with the skill directly to test logic
cd skills/api-skills/epic-feature-creator
claude-code

> Please act as if you're the epic-feature-creator skill.
  Here's a feature description: [paste PRD]
```

### Testing Local Skills

```bash
# Test in a real workspace
devflow start story-123
cd ~/repos/myapp-story-123

# In Claude Code, invoke the skill
> Use dev-spec to create a specification
```

## Version Control

- All skills are version controlled in this repo
- API-adapted versions (`api-prompt.md`) are gitignored and regenerated
- Track breaking changes in skill versions
- Document changes in commit messages

## Best Practices

1. **Single Responsibility**: Each skill does one thing well
2. **Clear Output Format**: API skills must return parseable JSON/XML
3. **Documented Inputs**: Clearly specify what input the skill expects
4. **Error Handling**: Include error scenarios in acceptance criteria
5. **Progressive Disclosure**: Start simple, add complexity when needed

## Future Skills

Planned skills for later phases:

- **cursor-adapter**: Adapt skills for Cursor IDE
- **pr-creator**: Auto-generate PR descriptions
- **test-generator**: Generate test suites from specs
- **code-reviewer**: Review code against spec
- **release-notes**: Generate release notes from commits

## Contributing

1. Create new skill in appropriate directory
2. Follow existing skill structure
3. Test thoroughly in Claude Code
4. If API skill, run `npm run adapt` to generate API version
5. Document in this README
6. Commit to repo

## License

Proprietary - AP Dev Solutions (@prillcode)

---

**Created by**: Aaron Prill (@prillcode)
**Last Updated**: November 25, 2025
**Version**: 1.0.0
