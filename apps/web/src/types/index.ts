// Types for APDevFlow Planning Dashboard

export type WorkType =
  | 'Feature Request to existing App'
  | 'Iterative Improvements to existing feature(s)'
  | 'Brand New App/Initiative'
  | 'New Integration to existing App'
  | 'Alterations to Process/App Component'
  | 'Other';

export type WorkflowState = 'Draft' | 'Spec Generated' | 'Ready for Development';

export interface ContextReference {
  id: string;
  type: 'path' | 'markdown';
  value: string; // file path or markdown content
  label: string; // display name
}

export interface BodyOfWork {
  id: string;
  title: string;
  type: WorkType;
  typeOther?: string; // Only used when type is 'Other'
  description: string;
  repo?: string;
  contextReferences: ContextReference[];
  workflowState: WorkflowState;
  generatedSpec?: string; // Tech Spec/PRD content
  createdAt: string;
  updatedAt: string;
}

export interface CreateBodyOfWorkInput {
  title: string;
  type: WorkType;
  typeOther?: string;
  description: string;
  repo?: string;
  contextReferences: ContextReference[];
}

// GitHub OAuth Types
export interface GitHubAuthToken {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresAt?: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatarUrl: string;
  name: string | null;
  email: string | null;
  htmlUrl: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: GitHubAuthToken | null;
  user: GitHubUser | null;
}
