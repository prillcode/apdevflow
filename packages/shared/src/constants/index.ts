// Shared constants for APDevFlow

export const APP_NAME = 'APDevFlow';
export const APP_VERSION = '0.1.0';

export const DEFAULT_WORKSPACE_PATH = '~/repos';

export const STATUS_VALUES = {
  FEATURE: ['draft', 'approved', 'in_progress', 'complete'] as const,
  EPIC: ['draft', 'approved', 'in_progress', 'complete'] as const,
  STORY: ['ready', 'in_progress', 'blocked', 'review', 'done'] as const,
} as const;

export const USER_ROLES = ['po', 'developer', 'manager'] as const;
