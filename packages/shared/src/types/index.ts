// Shared TypeScript types for APDevFlow
// These will be used across API, CLI, and Web apps

export interface Feature {
  featureId: string;
  title: string;
  description: string;
  status: 'draft' | 'approved' | 'in_progress' | 'complete';
  createdBy: string;
  createdAt: string;
  prdDocument?: string; // S3 URL
}

export interface Epic {
  epicId: string;
  featureId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: 'draft' | 'approved' | 'in_progress' | 'complete';
  generatedByAI: boolean;
  jiraEpicKey?: string;
}

export interface Story {
  storyId: string;
  epicId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints?: number;
  assignee?: string;
  status: 'ready' | 'in_progress' | 'blocked' | 'review' | 'done';
  generatedByAI: boolean;
  jiraKey?: string;
}

export interface User {
  email: string;
  name: string;
  role: 'po' | 'developer' | 'manager';
  preferences?: UserPreferences;
}

export interface UserPreferences {
  workspaceBasePath: string;
  defaultTool: 'claude-code' | 'cursor';
  autoOpenVSCode: boolean;
}

export interface Artifact {
  artifactId: string;
  storyId: string;
  fileName: string;
  contentType: string;
  s3Location: string;
  version: number;
  generatedBy: string;
  generatedAt: string;
}
