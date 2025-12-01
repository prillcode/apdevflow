# APDevFlow API Specification

**Version:** 0.1.0 (MVP)
**Last Updated:** 2025-12-01

---

## Overview

RESTful API for APDevFlow, supporting Planning Dashboard (Product Owners), Developer Dashboard, and CLI tool workflows.

**Base URL:** `https://api.apdevflow.com` (production) or `http://localhost:3001` (development)

**Authentication:** Cognito JWT tokens via `Authorization: Bearer <token>` header

---

## Design Decisions

1. **AI Generation:** Synchronous (blocking) - user waits for Bedrock response
2. **Bulk Operations:** Not included in MVP
3. **Artifact Upload:** Direct to S3 via presigned URLs
4. **Pagination:** Simple offset/limit for MVP
5. **Endpoint Reuse:** CLI and Web use same endpoints
6. **Versioning:** Track AI-generated content versions for iteration history
7. **Collaboration:** Allow multiple POs, warn if recently edited
8. **Dependencies:** Track story dependencies (optional, don't block MVP)
9. **Hierarchy:** Organization → Teams → Projects → Features → Epics → Stories

---

## Data Models

### Organization
```typescript
interface Organization {
  organizationId: string;
  name: string;
  createdAt: string;
  createdBy: string;
}
```

### Team
```typescript
interface Team {
  teamId: string;
  organizationId: string;
  name: string;
  createdAt: string;
}
```

### Project
```typescript
interface Project {
  projectId: string;
  teamId: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}
```

### Feature
```typescript
interface Feature {
  featureId: string;
  projectId: string;
  title: string;
  description: string;
  prdDocument?: string; // S3 URL or inline text
  status: 'draft' | 'approved' | 'in_progress' | 'complete';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  version: number; // For edit conflict detection
}
```

### Epic
```typescript
interface Epic {
  epicId: string;
  featureId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: 'draft' | 'approved' | 'in_progress' | 'complete';
  generatedByAI: boolean;
  aiVersion?: number; // Tracks AI generation iterations
  jiraEpicKey?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}
```

### EpicVersion (History)
```typescript
interface EpicVersion {
  versionId: string;
  epicId: string;
  versionNumber: number;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  aiPrompt?: string; // What was sent to AI
  createdAt: string;
  createdBy: string;
}
```

### Story
```typescript
interface Story {
  storyId: string;
  epicId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints?: number;
  assignee?: string; // User email or ID
  status: 'ready' | 'in_progress' | 'blocked' | 'review' | 'done';
  generatedByAI: boolean;
  aiVersion?: number;
  jiraKey?: string;
  dependencies?: string[]; // Array of storyIds this story depends on
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}
```

### StoryVersion (History)
```typescript
interface StoryVersion {
  versionId: string;
  storyId: string;
  versionNumber: number;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  aiPrompt?: string;
  createdAt: string;
  createdBy: string;
}
```

### Artifact
```typescript
interface Artifact {
  artifactId: string;
  storyId: string;
  fileName: string;
  fileSize: number; // bytes
  contentType: string;
  s3Key: string;
  s3Bucket: string;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: {
    specType?: 'implementation' | 'test' | 'other';
    generatedBySkill?: string;
  };
}
```

### User
```typescript
interface User {
  userId: string;
  email: string;
  name: string;
  role: 'po' | 'developer' | 'manager';
  organizationId: string;
  teamIds: string[];
  preferences?: {
    workspaceBasePath?: string;
    defaultTool?: 'claude-code' | 'cursor';
    autoOpenVSCode?: boolean;
  };
  createdAt: string;
}
```

### EditLock (For conflict detection)
```typescript
interface EditLock {
  resourceType: 'feature' | 'epic' | 'story';
  resourceId: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt: string; // Auto-expire after 15 minutes
}
```

---

## API Endpoints

### **Organizations API**

#### `GET /api/organizations`
List organizations for current user.

**Response:**
```json
{
  "organizations": [
    {
      "organizationId": "org-123",
      "name": "Acme Corp",
      "createdAt": "2024-01-01T00:00:00Z",
      "createdBy": "user-456"
    }
  ]
}
```

---

### **Teams API**

#### `GET /api/teams?organizationId=org-123`
List teams in an organization.

**Response:**
```json
{
  "teams": [
    {
      "teamId": "team-789",
      "organizationId": "org-123",
      "name": "Platform Team",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### **Projects API**

#### `GET /api/projects?teamId=team-789`
List projects in a team.

#### `POST /api/projects`
Create a new project.

**Request:**
```json
{
  "teamId": "team-789",
  "name": "Mobile App Redesign",
  "description": "Complete redesign of mobile experience"
}
```

**Response:**
```json
{
  "projectId": "proj-abc",
  "teamId": "team-789",
  "name": "Mobile App Redesign",
  "description": "Complete redesign of mobile experience",
  "createdAt": "2024-01-01T00:00:00Z",
  "createdBy": "user-456"
}
```

---

### **Features API**

#### `POST /api/features`
Create a new feature.

**Request:**
```json
{
  "projectId": "proj-abc",
  "title": "User Authentication System",
  "description": "Implement OAuth2 and JWT-based authentication...",
  "prdDocument": "https://s3.../prd.pdf"
}
```

**Response:**
```json
{
  "featureId": "feat-123",
  "projectId": "proj-abc",
  "title": "User Authentication System",
  "status": "draft",
  "createdAt": "2024-01-01T00:00:00Z",
  "version": 1
}
```

#### `GET /api/features?projectId=proj-abc`
List features for a project.

**Query Params:**
- `projectId` (required)
- `status` (optional): filter by status
- `limit` (default: 20)
- `offset` (default: 0)

**Response:**
```json
{
  "features": [...],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

#### `GET /api/features/:featureId`
Get single feature with edit lock info.

**Response:**
```json
{
  "feature": {
    "featureId": "feat-123",
    "title": "...",
    "version": 3,
    ...
  },
  "editLock": {
    "lockedBy": "user-789",
    "lockedAt": "2024-01-01T10:00:00Z",
    "expiresAt": "2024-01-01T10:15:00Z"
  }
}
```

**Note:** If `editLock` is present and not expired, UI should warn user.

#### `PUT /api/features/:featureId`
Update feature.

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "version": 3  // Current version - for optimistic locking
}
```

**Response:**
- `200 OK` - Updated successfully
- `409 Conflict` - Version mismatch (someone else edited)

```json
{
  "error": "Version conflict",
  "currentVersion": 4,
  "message": "Feature was updated by user@example.com at 10:05 AM"
}
```

#### `DELETE /api/features/:featureId`
Delete feature (cascade deletes epics/stories).

**Response:** `204 No Content`

#### `POST /api/features/:featureId/ai/epics`
Generate epics using AI (Bedrock).

**Request:**
```json
{
  "regenerate": false  // If true, creates new AI version
}
```

**Response:**
```json
{
  "epics": [
    {
      "epicId": "epic-456",
      "featureId": "feat-123",
      "title": "OAuth2 Integration",
      "description": "...",
      "acceptanceCriteria": ["...", "..."],
      "generatedByAI": true,
      "aiVersion": 1,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "aiVersion": 1  // Increment if regenerated
}
```

---

### **Epics API**

#### `GET /api/epics?featureId=feat-123`
List epics for a feature.

**Query Params:**
- `featureId` (required)
- `status` (optional)

#### `GET /api/epics/:epicId`
Get single epic.

#### `GET /api/epics/:epicId/versions`
Get version history for epic.

**Response:**
```json
{
  "versions": [
    {
      "versionId": "ver-789",
      "versionNumber": 2,
      "title": "OAuth2 Integration v2",
      "description": "...",
      "aiPrompt": "Break down OAuth2 authentication...",
      "createdAt": "2024-01-01T12:00:00Z",
      "createdBy": "user-456"
    },
    {
      "versionNumber": 1,
      ...
    }
  ]
}
```

#### `PUT /api/epics/:epicId`
Update epic (manual edit).

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "acceptanceCriteria": ["AC1", "AC2"],
  "version": 2
}
```

#### `DELETE /api/epics/:epicId`
Delete epic (cascade deletes stories).

#### `POST /api/epics/:epicId/ai/stories`
Generate stories using AI.

**Request:**
```json
{
  "regenerate": false
}
```

**Response:**
```json
{
  "stories": [
    {
      "storyId": "story-123",
      "epicId": "epic-456",
      "title": "Implement Google OAuth provider",
      "description": "...",
      "acceptanceCriteria": ["...", "..."],
      "generatedByAI": true,
      "aiVersion": 1,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "aiVersion": 1
}
```

#### `PUT /api/epics/:epicId/approve`
Approve epic (changes status to 'approved').

**Response:**
```json
{
  "epicId": "epic-456",
  "status": "approved",
  "approvedBy": "user-456",
  "approvedAt": "2024-01-01T00:00:00Z"
}
```

---

### **Stories API**

#### `GET /api/stories`
List stories with filters.

**Query Params:**
- `epicId` (optional)
- `assignee` (optional)
- `status` (optional)
- `limit` (default: 20)
- `offset` (default: 0)

**Response:**
```json
{
  "stories": [
    {
      "storyId": "story-123",
      "epicId": "epic-456",
      "title": "Implement Google OAuth provider",
      "status": "ready",
      "assignee": "dev@example.com",
      "storyPoints": 5,
      "dependencies": ["story-122"],  // Blocks on story-122
      ...
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

#### `GET /api/stories/:storyId`
Get single story with full details.

**Response:**
```json
{
  "story": {
    "storyId": "story-123",
    "title": "...",
    "description": "...",
    "acceptanceCriteria": ["...", "..."],
    "dependencies": ["story-122"],
    ...
  },
  "dependencyDetails": [
    {
      "storyId": "story-122",
      "title": "Setup OAuth library",
      "status": "in_progress"
    }
  ],
  "artifacts": [
    {
      "artifactId": "art-789",
      "fileName": "implementation-spec.md",
      "uploadedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `PUT /api/stories/:storyId`
Update story.

**Request:**
```json
{
  "title": "Updated title",
  "description": "...",
  "storyPoints": 8,
  "dependencies": ["story-122"],
  "version": 2
}
```

#### `PUT /api/stories/:storyId/assign`
Assign story to developer.

**Request:**
```json
{
  "assignee": "dev@example.com"
}
```

**Response:**
```json
{
  "storyId": "story-123",
  "assignee": "dev@example.com",
  "assignedAt": "2024-01-01T00:00:00Z"
}
```

#### `PUT /api/stories/:storyId/status`
Update story status.

**Request:**
```json
{
  "status": "in_progress"
}
```

**Response:**
```json
{
  "storyId": "story-123",
  "status": "in_progress",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### `GET /api/stories/:storyId/versions`
Get version history.

#### `DELETE /api/stories/:storyId`
Delete story.

---

### **Artifacts API**

#### `GET /api/stories/:storyId/artifacts/upload-url`
Get presigned S3 URL for uploading artifact.

**Query Params:**
- `fileName` (required)
- `contentType` (required)
- `fileSize` (required)

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "artifactId": "art-789",
  "s3Key": "artifacts/story-123/implementation-spec.md",
  "expiresIn": 300  // seconds
}
```

**Client Flow:**
1. Call this endpoint to get upload URL
2. Upload file directly to S3 using presigned URL
3. Call `POST /api/artifacts/:artifactId/complete` to confirm

#### `POST /api/artifacts/:artifactId/complete`
Confirm artifact upload completed.

**Request:**
```json
{
  "storyId": "story-123",
  "metadata": {
    "specType": "implementation",
    "generatedBySkill": "dev-spec"
  }
}
```

**Response:**
```json
{
  "artifactId": "art-789",
  "fileName": "implementation-spec.md",
  "s3Key": "artifacts/story-123/implementation-spec.md",
  "uploadedAt": "2024-01-01T00:00:00Z"
}
```

#### `GET /api/stories/:storyId/artifacts`
List artifacts for a story.

**Response:**
```json
{
  "artifacts": [
    {
      "artifactId": "art-789",
      "fileName": "implementation-spec.md",
      "fileSize": 4096,
      "contentType": "text/markdown",
      "uploadedBy": "dev@example.com",
      "uploadedAt": "2024-01-01T00:00:00Z",
      "metadata": {
        "specType": "implementation"
      }
    }
  ]
}
```

#### `GET /api/artifacts/:artifactId`
Get artifact metadata.

#### `GET /api/artifacts/:artifactId/download`
Get presigned S3 URL for downloading artifact.

**Response:**
```json
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "fileName": "implementation-spec.md",
  "expiresIn": 300
}
```

#### `DELETE /api/artifacts/:artifactId`
Delete artifact.

**Response:** `204 No Content`

---

### **Users API**

#### `GET /api/users/me`
Get current user profile.

**Response:**
```json
{
  "userId": "user-456",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "developer",
  "organizationId": "org-123",
  "teamIds": ["team-789"],
  "preferences": {
    "workspaceBasePath": "~/repos",
    "defaultTool": "claude-code",
    "autoOpenVSCode": true
  }
}
```

#### `PUT /api/users/me`
Update user preferences.

**Request:**
```json
{
  "preferences": {
    "workspaceBasePath": "~/projects",
    "defaultTool": "cursor"
  }
}
```

#### `GET /api/users?teamId=team-789`
List users in a team (for assignment dropdown).

**Response:**
```json
{
  "users": [
    {
      "userId": "user-456",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "developer"
    }
  ]
}
```

---

### **Export API**

#### `POST /api/export/jira/csv`
Export features/epics/stories to JIRA CSV format.

**Request:**
```json
{
  "featureIds": ["feat-123", "feat-456"],
  "format": "jira-csv"
}
```

**Response:**
```json
{
  "exportId": "exp-789",
  "downloadUrl": "https://s3.../export.csv",
  "expiresAt": "2024-01-02T00:00:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "statusCode": 400,
  "details": {
    "field": "Specific error detail"
  }
}
```

**Common Status Codes:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - No permission for resource
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Version conflict or edit lock
- `500 Internal Server Error` - Server error

---

## Rate Limiting

**Limits:**
- Standard endpoints: 100 requests/minute per user
- AI endpoints: 10 requests/minute per user (Bedrock rate limits)

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## Authentication

All requests require Cognito JWT token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token contains:**
- `sub` (userId)
- `email`
- `cognito:groups` (roles)

---

## Pagination

Standard pagination for list endpoints:

**Request:**
```
GET /api/stories?limit=20&offset=40
```

**Response:**
```json
{
  "stories": [...],
  "total": 150,
  "limit": 20,
  "offset": 40,
  "hasMore": true
}
```

---

## Edit Conflict Detection

For resources with `version` field:

1. Client fetches resource with current version
2. Client edits locally
3. Client PUTs update with `version` in request
4. Server checks if version matches
5. If mismatch, returns `409 Conflict` with current data

**Edit Locks:**
- Created when user starts editing (optional UI feature)
- Auto-expire after 15 minutes
- Used to show warnings, not hard locks

---

## MVP Implementation Order

**Phase 1: Core Planning (Weeks 1-2)**
1. Organizations/Teams/Projects CRUD
2. Features CRUD
3. AI epic generation (`POST /features/:id/ai/epics`)
4. Epics CRUD
5. AI story generation (`POST /epics/:id/ai/stories`)

**Phase 2: Developer Flow (Weeks 3-4)**
6. Stories CRUD
7. Story assignment/status
8. Users API
9. Edit conflict detection

**Phase 3: Artifacts (Weeks 5-6)**
10. S3 presigned URL generation
11. Artifact upload/download
12. Artifact listing

**Phase 4: History & Export (Week 7)**
13. Version history endpoints
14. JIRA CSV export

**Phase 5: Dependencies (Optional)**
15. Story dependency tracking

---

## Implementation Notes

**DynamoDB Tables:**
- `apdevflow-organizations`
- `apdevflow-teams`
- `apdevflow-projects`
- `apdevflow-features`
- `apdevflow-epics`
- `apdevflow-epic-versions`
- `apdevflow-stories`
- `apdevflow-story-versions`
- `apdevflow-artifacts`
- `apdevflow-users`
- `apdevflow-edit-locks`

**Lambda Functions:**
- One Lambda per API route (or grouped by resource)
- Use Lambda Powertools for logging/tracing
- Environment variables for Bedrock/S3/DynamoDB config

**S3 Buckets:**
- `apdevflow-artifacts-{env}` - User-uploaded artifacts
- `apdevflow-exports-{env}` - CSV exports

---

## Future Enhancements (Post-MVP)

- WebSocket support for real-time collaboration
- JIRA API integration (automated sync)
- GitHub integration (link stories to PRs)
- Advanced search/filtering
- Analytics endpoints
- Bulk operations
- Story templates
- Custom fields
