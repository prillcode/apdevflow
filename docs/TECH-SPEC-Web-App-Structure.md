# Technical Specification: APDevFlow Web Application Structure

**Document Version:** 1.0
**Created:** November 25, 2025
**Author:** Aaron Prill (@prillcode)
**Status:** Draft

---

## Overview

This document specifies the technical architecture for the APDevFlow web application using:
- **TanStack Router** for type-safe, file-based routing
- **TanStack Query** for server state management
- **React 18** with TypeScript
- **Tailwind CSS** + **shadcn/ui** for styling
- **Vite** as build tool

The application will support role-based dashboards (PO, Developer, Manager) with authentication guards and optimized data fetching patterns for AWS Lambda + API Gateway backend.

---

## Directory Structure

```
apps/web/
├── src/
│   ├── main.tsx                          # App entry point
│   ├── router.tsx                        # Router configuration
│   ├── routes/                           # File-based routes
│   │   ├── __root.tsx                    # Root layout
│   │   ├── index.tsx                     # Landing page (/)
│   │   ├── login.tsx                     # Login page
│   │   ├── _auth/                        # Protected routes group
│   │   │   ├── __layout.tsx              # Auth guard + shared layout
│   │   │   ├── dashboard.tsx             # Role-based dashboard
│   │   │   ├── features/
│   │   │   │   ├── index.tsx             # Features list (PO)
│   │   │   │   └── $featureId/
│   │   │   │       ├── index.tsx         # Feature detail
│   │   │   │       └── epics.$epicId.tsx # Epic detail
│   │   │   ├── stories/
│   │   │   │   ├── index.tsx             # My Stories (Developer)
│   │   │   │   └── $storyId.tsx          # Story detail
│   │   │   ├── settings/
│   │   │   │   ├── index.tsx             # Settings home
│   │   │   │   ├── profile.tsx           # User profile
│   │   │   │   └── jira.tsx              # JIRA integration
│   │   │   └── analytics.tsx             # Analytics (Manager)
│   │   └── unauthorized.tsx              # 403 page
│   │
│   ├── components/                       # Reusable components
│   │   ├── ui/                           # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── toast.tsx
│   │   ├── layouts/
│   │   │   ├── app-shell.tsx             # Main app layout
│   │   │   ├── sidebar.tsx               # Navigation sidebar
│   │   │   └── header.tsx                # Top header
│   │   ├── features/
│   │   │   ├── feature-card.tsx
│   │   │   ├── feature-form.tsx
│   │   │   └── epic-generator.tsx
│   │   ├── stories/
│   │   │   ├── story-card.tsx
│   │   │   ├── story-board.tsx
│   │   │   └── story-status-badge.tsx
│   │   └── shared/
│   │       ├── error-boundary.tsx
│   │       ├── loading-skeleton.tsx
│   │       └── empty-state.tsx
│   │
│   ├── lib/                              # Core utilities
│   │   ├── api.ts                        # API client (fetch wrapper)
│   │   ├── auth.ts                       # Auth utilities
│   │   ├── errors.ts                     # Custom error types
│   │   └── utils.ts                      # Utility functions
│   │
│   ├── hooks/                            # Custom hooks
│   │   ├── queries/                      # TanStack Query hooks
│   │   │   ├── features.ts               # Feature queries
│   │   │   ├── epics.ts                  # Epic queries
│   │   │   ├── stories.ts                # Story queries
│   │   │   ├── users.ts                  # User queries
│   │   │   └── artifacts.ts              # Artifact queries
│   │   ├── mutations/                    # TanStack Mutation hooks
│   │   │   ├── features.ts               # Feature mutations
│   │   │   ├── epics.ts                  # Epic mutations
│   │   │   ├── stories.ts                # Story mutations
│   │   │   └── artifacts.ts              # Artifact mutations
│   │   └── use-auth.ts                   # Auth hook
│   │
│   ├── contexts/                         # React contexts
│   │   ├── auth-context.tsx              # Auth state
│   │   └── toast-context.tsx             # Toast notifications
│   │
│   ├── types/                            # TypeScript types
│   │   ├── api.ts                        # API response types
│   │   └── auth.ts                       # Auth types
│   │
│   └── index.css                         # Global styles + Tailwind
│
├── public/                               # Static assets
├── index.html                            # HTML template
├── vite.config.ts                        # Vite configuration
├── tailwind.config.js                    # Tailwind configuration
├── tsconfig.json                         # TypeScript config
└── package.json                          # Dependencies
```

---

## Key Implementation Details

### 1. Router Setup (router.tsx)

```tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient } from '@tanstack/react-query'

// Define router context type
export interface RouterContext {
  auth: {
    isLoggedIn: boolean
    user?: {
      id: string
      email: string
      name: string
      role: 'po' | 'developer' | 'manager'
    }
  }
  queryClient: QueryClient
}

export const router = createRouter({
  routeTree,
  context: {
    auth: { isLoggedIn: false },
    queryClient: new QueryClient(),
  },
  defaultPreload: 'intent',
  defaultPreloadDelay: 100,
})

// Register for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

### 2. Root Route (__root.tsx)

```tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import type { RouterContext } from '../router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: () => <div>404 Not Found</div>,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>

      {/* Development tools */}
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools position="bottom-right" />
          <TanStackRouterDevtools position="bottom-left" />
        </>
      )}
    </QueryClientProvider>
  )
}
```

### 3. Authentication Guard (_auth/__layout.tsx)

```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layouts/app-shell'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    // Check authentication
    if (!context.auth.isLoggedIn) {
      throw redirect({
        to: '/login',
        search: {
          from: location.pathname,
        },
      })
    }

    // Return user for child routes
    return {
      user: context.auth.user!,
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { user } = Route.useRouteContext()

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  )
}
```

### 4. Role-Based Dashboard (_auth/dashboard.tsx)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PODashboard } from '@/components/dashboards/po-dashboard'
import { DeveloperDashboard } from '@/components/dashboards/developer-dashboard'
import { ManagerDashboard } from '@/components/dashboards/manager-dashboard'

export const Route = createFileRoute('/_auth/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = Route.useRouteContext()

  return (
    <div>
      {user.role === 'po' && <PODashboard userId={user.id} />}
      {user.role === 'developer' && <DeveloperDashboard userId={user.id} />}
      {user.role === 'manager' && <ManagerDashboard userId={user.id} />}
    </div>
  )
}
```

### 5. Query Hook Example (hooks/queries/stories.ts)

```tsx
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAPI } from '@/lib/api'
import type { Story } from '@apdevflow/shared'

export const storyKeys = {
  all: () => ['stories'] as const,
  lists: () => [...storyKeys.all(), 'list'] as const,
  list: (userId: string) => [...storyKeys.lists(), userId] as const,
  detail: (id: string) => [...storyKeys.all(), 'detail', id] as const,
  byEpic: (epicId: string) => [...storyKeys.all(), 'epic', epicId] as const,
}

export function useUserStories(userId: string) {
  return useQuery({
    queryKey: storyKeys.list(userId),
    queryFn: () => fetchAPI<Story[]>(`/users/${userId}/stories`),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!userId,
  })
}

export function useStoryById(storyId: string) {
  return useQuery({
    queryKey: storyKeys.detail(storyId),
    queryFn: () => fetchAPI<Story>(`/stories/${storyId}`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!storyId,
  })
}

export function useStoriesByEpic(epicId: string) {
  return useQuery({
    queryKey: storyKeys.byEpic(epicId),
    queryFn: () => fetchAPI<Story[]>(`/epics/${epicId}/stories`),
    staleTime: 1000 * 60 * 2,
    enabled: !!epicId,
  })
}
```

### 6. Mutation Hook Example (hooks/mutations/stories.ts)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAPI } from '@/lib/api'
import { storyKeys } from '@/hooks/queries/stories'
import { useToast } from '@/hooks/use-toast'
import type { Story, CreateStoryInput } from '@apdevflow/shared'

export function useCreateStory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: CreateStoryInput) =>
      fetchAPI<Story>('/stories', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (newStory) => {
      // Add to detail cache
      queryClient.setQueryData(storyKeys.detail(newStory.storyId), newStory)

      // Invalidate list caches
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() })

      // If part of epic, invalidate epic stories
      if (newStory.epicId) {
        queryClient.invalidateQueries({
          queryKey: storyKeys.byEpic(newStory.epicId),
        })
      }

      toast({
        title: 'Success',
        description: 'Story created successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateStoryStatus(storyId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (status: Story['status']) =>
      fetchAPI<Story>(`/stories/${storyId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onMutate: async (newStatus) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: storyKeys.detail(storyId) })

      // Snapshot previous value
      const previous = queryClient.getQueryData(storyKeys.detail(storyId))

      // Optimistically update
      queryClient.setQueryData(storyKeys.detail(storyId), (old: Story) => ({
        ...old,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }))

      return { previous }
    },
    onError: (err, newStatus, context) => {
      // Rollback on error
      queryClient.setQueryData(storyKeys.detail(storyId), context?.previous)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() })
      toast({
        title: 'Success',
        description: 'Status updated',
      })
    },
  })
}
```

### 7. API Client (lib/api.ts)

```tsx
class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'APIError'
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function fetchAPI<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = new URL(path, API_BASE_URL)

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new APIError(
      response.status,
      errorData.code || 'UNKNOWN_ERROR',
      errorData.message || `HTTP ${response.status}`,
    )
  }

  if (response.status === 204) return {} as T

  return response.json()
}

function getAuthToken(): string {
  return localStorage.getItem('auth_token') || ''
}
```

### 8. App Shell Layout (components/layouts/app-shell.tsx)

```tsx
import { Sidebar } from './sidebar'
import { Header } from './header'
import type { User } from '@apdevflow/shared'

interface AppShellProps {
  user: User
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 9. Main Entry (main.tsx)

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { router } from './router'
import { loadAuth } from './lib/auth'
import './index.css'

async function initializeApp() {
  // Load authentication state
  const auth = await loadAuth()

  // Create QueryClient
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5,    // 5 minutes
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  })

  // Update router context
  router.update({
    context: {
      auth,
      queryClient,
    },
  })

  // Render app
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}

initializeApp()
```

---

## Component Patterns

### Loading States
```tsx
function StoryList({ userId }: { userId: string }) {
  const { data: stories, isPending, error } = useUserStories(userId)

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    )
  }

  if (error) {
    return <ErrorAlert error={error} />
  }

  if (!stories?.length) {
    return <EmptyState message="No stories assigned" />
  }

  return (
    <div className="space-y-4">
      {stories.map(story => (
        <StoryCard key={story.storyId} story={story} />
      ))}
    </div>
  )
}
```

### Optimistic Updates
```tsx
function StoryStatusDropdown({ story }: { story: Story }) {
  const updateStatus = useUpdateStoryStatus(story.storyId)

  return (
    <Select
      value={story.status}
      onValueChange={(status) => updateStatus.mutate(status)}
      disabled={updateStatus.isPending}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ready">Ready</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="review">Review</SelectItem>
        <SelectItem value="done">Done</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### Route Loaders with Query Integration
```tsx
// In route file
export const Route = createFileRoute('/_auth/stories/$storyId')({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: storyKeys.detail(params.storyId),
      queryFn: () => fetchAPI(`/stories/${params.storyId}`),
    }),
  component: StoryDetail,
})

function StoryDetail() {
  const { storyId } = Route.useParams()
  const { data: story } = useStoryById(storyId) // Already loaded by loader

  return <div>{story?.title}</div>
}
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@tanstack/react-router": "^1.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.300.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@tanstack/router-devtools": "^1.0.0",
    "@tanstack/react-query-devtools": "^5.0.0",
    "@tanstack/router-cli": "^1.0.0"
  }
}
```

---

## Setup Scripts

Add to package.json:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "routes:generate": "tsr generate",
    "routes:watch": "tsr watch"
  }
}
```

---

## Configuration Files

### vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
```

### tailwind.config.js
```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... other shadcn/ui theme colors
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### tsconfig.json (app-specific, extends root)
```json
{
  "extends": "../../tsconfig.react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/shared" }
  ]
}
```

---

## Key Features

### Type Safety
- ✅ Full type inference across routes
- ✅ Type-safe navigation with params/search
- ✅ Type-safe query keys and data
- ✅ Shared types from `@apdevflow/shared` package

### Performance
- ✅ Automatic code splitting per route
- ✅ Preloading on hover/intent
- ✅ Optimistic updates for instant feedback
- ✅ Smart caching with stale-while-revalidate

### Developer Experience
- ✅ File-based routing (auto-generated route tree)
- ✅ Devtools for router and queries
- ✅ Hot module replacement
- ✅ TypeScript everywhere

### Production Ready
- ✅ Error boundaries
- ✅ Loading states
- ✅ Auth guards
- ✅ Role-based access control
- ✅ Optimized for serverless backend

---

## Next Steps

1. **Generate route tree**: Run `pnpm routes:generate` after creating route files
2. **Add shadcn/ui components**: Use `npx shadcn-ui@latest add` for each component
3. **Configure environment variables**: Create `.env` with `VITE_API_URL`
4. **Implement auth flow**: Connect to AWS Cognito
5. **Build API client**: Complete error handling and token refresh
6. **Create shared components**: Build reusable UI components
7. **Test routing**: Verify all routes and guards work correctly

---

## Benefits of This Architecture

1. **Type Safety**: Catch routing errors at compile time
2. **Scalability**: Easy to add new routes and features
3. **Performance**: Smart caching and code splitting
4. **DX**: File-based routing, devtools, hot reload
5. **Maintainability**: Clear separation of concerns
6. **Production Ready**: Error handling, loading states, optimistic updates
7. **Backend Optimized**: Perfect for AWS Lambda + API Gateway

---

## Related Documents

- [Product Requirements Document](./APP-PRD-Revised.md)
- [Skills Reference](./SKILLS.md)
- [Monorepo Structure](../README.md)
