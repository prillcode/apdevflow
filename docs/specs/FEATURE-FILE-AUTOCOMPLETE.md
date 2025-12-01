# Dev Spec: GitHub Repository File Path Autocomplete

**Story ID**: FEATURE-001  
**Created**: 2025-12-01  
**Status**: Ready for Implementation  
**Dependencies**: REFACTOR-API-001, REFACTOR-FRONTEND-001  
**Estimated Effort**: 3-4 hours

---

## Overview

Add autocomplete functionality to the "Context Reference" file path input that searches and suggests actual files from the selected GitHub repository. This improves UX by preventing typos, enabling file discovery, and validating that referenced files exist.

---

## Prerequisites

**Must be completed first:**
1. ✅ API refactored to pure Hono (REFACTOR-API-001)
2. ✅ Frontend auth service restructured (REFACTOR-FRONTEND-001)

---

## User Story

**As a** Product Owner creating a new dev work item  
**I want** to autocomplete file paths from the selected GitHub repository  
**So that** I can easily reference existing files without typos and discover relevant files

---

## Acceptance Criteria

- [ ] File path input shows autocomplete dropdown when typing
- [ ] Autocomplete only enabled when GitHub repo is selected
- [ ] Autocomplete only enabled when user is authenticated with GitHub
- [ ] Dropdown shows matching file paths from the selected repository
- [ ] User can select a file from dropdown to populate input
- [ ] Dropdown supports keyboard navigation (arrow keys, enter, escape)
- [ ] Search is debounced (300ms) to avoid excessive API calls
- [ ] Shows loading state while fetching files
- [ ] Shows error state if file fetch fails
- [ ] Falls back to manual text input if autocomplete unavailable
- [ ] Works for large repositories (handles 100k+ files)

---

## Technical Design

### Architecture

```
User selects repo
  ↓
Fetch file tree from GitHub API (via backend)
  ↓
Cache file list in component state
  ↓
User types in path input
  ↓
Filter cached files client-side (fuzzy match)
  ↓
Show top 50 matches in dropdown
  ↓
User selects file → populate input
```

### API Endpoint

**Route**: `GET /api/github/repos/:owner/:repo/files`

**Query Parameters:**
- `recursive` (optional): `true` to get full tree (default: true)

**Response:**
```typescript
interface RepoFile {
  path: string;           // "src/components/User.tsx"
  type: 'blob' | 'tree';  // file or directory
  size?: number;          // file size in bytes
  sha: string;            // git object SHA
}

interface RepoFilesResponse {
  files: RepoFile[];
  truncated: boolean;     // true if repo > 100k files
  sha: string;            // tree SHA (for caching)
}
```

**Error Response:**
```typescript
interface ErrorResponse {
  error: string;
  code?: string;
}
```

---

## Implementation Steps

### 1. Backend: Add GitHub Files Endpoint

**File: `apps/api/src/routes/github.ts`**

Add new route:

```typescript
import { Hono } from 'hono';
import { GitHubService } from '../services/github';

const github = new Hono();

// Existing OAuth route...

// GET /api/github/repos/:owner/:repo/files
github.get('/repos/:owner/:repo/files', async (c) => {
  try {
    const { owner, repo } = c.req.param();
    const token = c.req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const files = await GitHubService.fetchRepoFiles(owner, repo, token);
    
    return c.json(files);
  } catch (error) {
    console.error('Fetch repo files error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch files' 
    }, 500);
  }
});

export default github;
```

### 2. Backend: Add GitHub Service Method

**File: `apps/api/src/services/github.ts`**

Add method to existing `GitHubService` class:

```typescript
export class GitHubService {
  // ... existing methods ...

  static async fetchRepoFiles(
    owner: string, 
    repo: string, 
    accessToken: string
  ): Promise<{
    files: Array<{ path: string; type: string; size?: number; sha: string }>;
    truncated: boolean;
    sha: string;
  }> {
    // Get default branch
    const repoResponse = await fetch(
      `${this.API_BASE}/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!repoResponse.ok) {
      throw new Error('Failed to fetch repository info');
    }

    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch;

    // Get file tree (recursive)
    const treeResponse = await fetch(
      `${this.API_BASE}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!treeResponse.ok) {
      throw new Error('Failed to fetch repository tree');
    }

    const treeData = await treeResponse.json();

    // Filter to only files (blobs), not directories (trees)
    const files = treeData.tree
      .filter((item: any) => item.type === 'blob')
      .map((item: any) => ({
        path: item.path,
        type: item.type,
        size: item.size,
        sha: item.sha,
      }));

    return {
      files,
      truncated: treeData.truncated || false,
      sha: treeData.sha,
    };
  }
}
```

### 3. Frontend: Add GitHub Service Method

**File: `apps/web/src/services/auth/github.ts`**

Add method to existing `GitHubAuthService` class:

```typescript
export class GitHubAuthService {
  // ... existing methods ...

  static async fetchRepoFiles(repoFullName: string): Promise<{
    files: Array<{ path: string; type: string; size?: number; sha: string }>;
    truncated: boolean;
  } | null> {
    const token = this.getToken()?.accessToken;
    if (!token) {
      console.error('No access token available');
      return null;
    }

    try {
      const [owner, repo] = repoFullName.split('/');
      
      const response = await fetch(
        `${API_URL}/api/github/repos/${owner}/${repo}/files`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch repository files');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repository files:', error);
      return null;
    }
  }
}
```

### 4. Frontend: Create Autocomplete Component

**File: `apps/web/src/components/FilePathAutocomplete.tsx`**

```typescript
import { useState, useEffect, useRef } from 'react';

interface FilePathAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  files: Array<{ path: string }>;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function FilePathAutocomplete({
  value,
  onChange,
  files,
  placeholder = 'Start typing to search files...',
  disabled = false,
  loading = false,
}: FilePathAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState<Array<{ path: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter files based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredFiles([]);
      setIsOpen(false);
      return;
    }

    const query = value.toLowerCase();
    const matches = files
      .filter((file) => file.path.toLowerCase().includes(query))
      .slice(0, 50); // Limit to 50 results

    setFilteredFiles(matches);
    setIsOpen(matches.length > 0);
    setSelectedIndex(0);
  }, [value, files]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredFiles.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          selectFile(filteredFiles[selectedIndex].path);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Select a file
  const selectFile = (path: string) => {
    onChange(path);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (filteredFiles.length > 0) setIsOpen(true);
        }}
        disabled={disabled || loading}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder={loading ? 'Loading files...' : placeholder}
      />

      {isOpen && filteredFiles.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        >
          {filteredFiles.map((file, index) => (
            <button
              key={file.path}
              type="button"
              onClick={() => selectFile(file.path)}
              className={`
                w-full text-left px-3 py-2 cursor-pointer
                ${index === selectedIndex ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                hover:bg-blue-50 hover:text-blue-900
              `}
            >
              <span className="block truncate font-mono text-xs">
                {file.path}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Frontend: Update Planning Form

**File: `apps/web/src/routes/planning.new.tsx`**

Add state for repo files:

```typescript
import { FilePathAutocomplete } from '../components/FilePathAutocomplete';

function NewBodyOfWorkComponent() {
  // ... existing state ...
  
  const [repoFiles, setRepoFiles] = useState<Array<{ path: string }>>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Fetch repo files when repo is selected
  useEffect(() => {
    if (!repo || !isAuthenticated) {
      setRepoFiles([]);
      return;
    }

    setLoadingFiles(true);
    GitHubAuthService.fetchRepoFiles(repo)
      .then((data) => {
        if (data) {
          setRepoFiles(data.files);
          if (data.truncated) {
            console.warn('Repository file tree was truncated (>100k files)');
          }
        }
      })
      .catch((error) => {
        console.error('Failed to fetch repo files:', error);
      })
      .finally(() => {
        setLoadingFiles(false);
      });
  }, [repo, isAuthenticated]);

  // ... rest of component ...
}
```

Replace the file path input in the "Add New Reference" section:

```typescript
{newRefType === 'path' ? (
  <>
    <input
      type="text"
      value={newRefLabel}
      onChange={(e) => setNewRefLabel(e.target.value)}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
      placeholder="Label (e.g., User Component)"
    />
    
    {repo && isAuthenticated ? (
      <FilePathAutocomplete
        value={newRefValue}
        onChange={setNewRefValue}
        files={repoFiles}
        loading={loadingFiles}
        placeholder="Start typing to search files..."
      />
    ) : (
      <input
        type="text"
        value={newRefValue}
        onChange={(e) => setNewRefValue(e.target.value)}
        disabled={!repo}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder={repo ? "Relative path (e.g., src/components/User.tsx)" : "Select a repository first"}
      />
    )}
    
    <button
      type="button"
      onClick={handleAddContextReference}
      className="w-full px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
    >
      Add Path Reference
    </button>
  </>
) : (
  // ... markdown upload section ...
)}
```

---

## Testing Checklist

### Backend Tests
- [ ] Endpoint returns file list for valid repo
- [ ] Endpoint returns 401 for missing token
- [ ] Endpoint returns 500 for invalid repo
- [ ] Handles large repos (>100k files)
- [ ] Returns truncated flag correctly

### Frontend Tests
- [ ] Autocomplete disabled when no repo selected
- [ ] Autocomplete disabled when not authenticated
- [ ] Autocomplete shows loading state while fetching
- [ ] Dropdown appears when typing
- [ ] Dropdown filters files correctly
- [ ] Can select file with mouse click
- [ ] Can navigate with arrow keys
- [ ] Can select file with Enter key
- [ ] Dropdown closes with Escape key
- [ ] Dropdown closes when clicking outside
- [ ] Falls back to text input on error

### Integration Tests
- [ ] Full flow: select repo → type path → select file → add reference
- [ ] Works with multiple context references
- [ ] Persists selected file path correctly

---

## Edge Cases

### Large Repositories (>100k files)
- GitHub API truncates at 100k files
- Show warning message to user
- Autocomplete still works with available files
- Consider adding search API fallback (future enhancement)

### Rate Limiting
- GitHub API: 5000 req/hour (authenticated)
- Cache file tree in component state
- Only fetch once per repo selection
- Show error if rate limit hit

### Network Errors
- Show error message
- Fall back to manual text input
- Don't block form submission

### No Files Found
- Show "No matching files" message
- Allow manual entry

---

## Future Enhancements

1. **File Type Icons**: Show icons for different file types (JS, TS, CSS, etc.)
2. **Directory Filtering**: Allow filtering by directory
3. **Recent Files**: Show recently used files at top
4. **Fuzzy Search**: Better matching algorithm (e.g., fzf-style)
5. **File Preview**: Show file content preview on hover
6. **Search API Fallback**: Use GitHub Search API for large repos
7. **Caching**: Cache file trees in localStorage with TTL

---

## Success Criteria

✅ Autocomplete works when repo selected and user authenticated  
✅ Dropdown shows matching files as user types  
✅ Keyboard navigation works (arrows, enter, escape)  
✅ Can select file from dropdown  
✅ Falls back gracefully on errors  
✅ No TypeScript errors  
✅ Improves UX (faster, fewer typos)  
✅ Handles large repositories  
✅ Works on both dev and production
