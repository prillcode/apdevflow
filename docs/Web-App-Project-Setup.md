# APDevFlow UI Setup Flow

**Document Version:** 1.0
**Created:** November 25, 2025
**Author:** Aaron Prill (@prillcode)
**Status:** Reference Guide

---

## Overview

This document explains the UI architecture for APDevFlow and the setup workflow using modern best practices:
- **shadcn/ui** for component library
- **Vite** as build tool
- **TanStack Router** with Vite plugin
- **Tailwind CSS** for styling

---

## Component Architecture

### shadcn/ui Components

The components in `apps/web/src/components/ui/` (button, card, dialog, etc.) **ARE shadcn/ui components**.

**Key Points:**
- shadcn/ui is **NOT a package you install via npm**
- Instead, you **add individual components** to your project via CLI
- These commands **copy the component code directly** into `components/ui/`
- You **own the code** and can customize it freely
- Built on **Radix UI** primitives (headless, accessible)
- Styled with **Tailwind CSS**

**Example:**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

Each command:
1. Downloads the component source from shadcn/ui
2. Copies it to `src/components/ui/`
3. Includes all necessary dependencies (Radix UI primitives)
4. Pre-configured with Tailwind styles

---

## Build Tool: Vite

**Why Vite?**
- Lightning fast Hot Module Replacement (HMR)
- Modern ESM-first build tool
- Native TypeScript support
- Optimized for React
- Perfect for monorepo setups

**Configuration** (already in tech spec):
```ts
// apps/web/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(), // Auto-generates route tree
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

---

## TanStack Router + Vite Integration

**TanStack Router Vite Plugin:**
- Watches your `routes/` directory
- Auto-generates `routeTree.gen.ts` with type-safe routes
- Hot reloads when routes change
- Zero manual configuration

**How it works:**
1. You create route files in `src/routes/`
2. Vite plugin watches for changes
3. Generates `routeTree.gen.ts` automatically
4. Router imports this generated file
5. Full TypeScript type safety across all routes

**Example:**
```tsx
// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen' // ✅ Auto-generated

export const router = createRouter({ routeTree })
```

---

## Complete Setup Flow

### Step 1: Initialize the Web App

The monorepo structure is already set up with `apps/web/`, so we start from there:

```bash
cd apps/web
```

### Step 2: Install Core Dependencies

```bash
# TanStack Router + Query
pnpm add @tanstack/react-router @tanstack/react-query

# Dev dependencies
pnpm add -D @tanstack/router-vite-plugin
pnpm add -D @tanstack/router-devtools
pnpm add -D @tanstack/react-query-devtools
pnpm add -D @tanstack/router-cli
```

### Step 3: Install Tailwind CSS

```bash
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D tailwindcss-animate

# Generate tailwind config
npx tailwindcss init -p
```

### Step 4: Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
```

This command will:
- Ask you configuration questions (theme colors, CSS variables, etc.)
- Create `components/ui/` directory
- Set up `lib/utils.ts` with cn() helper
- Configure `components.json` for future component installs
- Update `tailwind.config.js` with shadcn theme

**Configuration choices:**
- Style: Default
- Base color: Slate (or your preference)
- CSS variables: Yes
- Import alias: `@/components`

### Step 5: Add shadcn/ui Components

Add components as needed for your UI:

```bash
# Core components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu

# Form components
npx shadcn-ui@latest add form
npx shadcn-ui@latest add label
npx shadcn-ui@latest add textarea

# Feedback components
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add alert

# Navigation components
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add separator
```

Each component is added to `src/components/ui/` and you can customize it as needed.

### Step 6: Configure Vite

Create or update `vite.config.ts`:

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

### Step 7: Configure TypeScript

Create `tsconfig.json` extending the root config:

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

### Step 8: Set Up Global Styles

Create `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Step 9: Create Route Structure

Create your first routes:

```bash
mkdir -p src/routes
touch src/routes/__root.tsx
touch src/routes/index.tsx
```

### Step 10: Generate Route Tree

```bash
# One-time generation
pnpm routes:generate

# Or watch mode during development
pnpm routes:watch
```

This creates `src/routeTree.gen.ts` - commit this file to git!

### Step 11: Start Development Server

```bash
pnpm dev
```

Vite will start on `http://localhost:3000` with:
- Hot module replacement
- Route generation watching
- API proxy to backend

---

## Benefits of This Approach

### 1. **shadcn/ui Benefits**
- ✅ Own your component code (not locked in)
- ✅ Fully customizable styles and behavior
- ✅ Built on accessible Radix UI primitives
- ✅ Styled with Tailwind (consistent with our stack)
- ✅ No runtime overhead (just static code)
- ✅ Only add components you need
- ✅ Easy to modify for brand consistency

### 2. **Vite Benefits**
- ✅ Lightning fast HMR (<50ms updates)
- ✅ Modern ESM-first architecture
- ✅ Optimized production builds
- ✅ Native TypeScript support
- ✅ Plugin ecosystem (TanStack, etc.)
- ✅ Built-in CSS handling
- ✅ Excellent dev experience

### 3. **TanStack Router Vite Plugin**
- ✅ Auto-generates type-safe route tree
- ✅ File-based routing without manual config
- ✅ Hot reloads on route changes
- ✅ Zero configuration needed
- ✅ Perfect TypeScript inference
- ✅ Catches routing errors at compile time

### 4. **Combined Power**
- ✅ Type-safe routing (TanStack Router)
- ✅ Type-safe data fetching (TanStack Query)
- ✅ Accessible components (Radix UI via shadcn)
- ✅ Custom styling (Tailwind + owned components)
- ✅ Fast builds (Vite)
- ✅ Great DX (devtools for router & query)

---

## Package.json Scripts

Add these to `apps/web/package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src/ --ext ts,tsx",
    "routes:generate": "tsr generate",
    "routes:watch": "tsr watch"
  }
}
```

---

## Directory Structure After Setup

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (added via CLI)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layouts/               # Custom layout components
│   │   ├── features/              # Feature-specific components
│   │   └── stories/               # Story-specific components
│   ├── lib/
│   │   └── utils.ts               # cn() helper + utilities
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   └── ...
│   ├── routeTree.gen.ts           # ✅ Auto-generated by Vite plugin
│   ├── router.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── components.json                # shadcn/ui config
├── tsconfig.json
└── package.json
```

---

## Common Commands Reference

```bash
# Development
pnpm dev                          # Start dev server
pnpm routes:watch                 # Watch routes (auto-run by Vite plugin)

# Building
pnpm build                        # Build for production
pnpm preview                      # Preview production build

# Adding Components
npx shadcn-ui@latest add button   # Add specific component
npx shadcn-ui@latest add          # Interactive component picker

# Route Generation
pnpm routes:generate              # Generate route tree once
pnpm routes:watch                 # Watch and regenerate on changes
```

---

## Best Practices

### 1. **Component Customization**
After adding a shadcn component, customize it for your needs:
```tsx
// src/components/ui/button.tsx
// Modify variants, colors, sizes, etc.
// You own this code!
```

### 2. **Route Organization**
Use file-based routing patterns:
- `__root.tsx` - Root layout
- `_auth/` prefix - Auth-protected routes (pathless layout)
- `$paramName` - Dynamic route parameters
- `index.tsx` - Default route for a path

### 3. **Type Safety**
Always register your router for type safety:
```tsx
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

### 4. **Development Workflow**
1. Create route files in `src/routes/`
2. Vite plugin auto-generates `routeTree.gen.ts`
3. Import and use type-safe `<Link>` components
4. TypeScript catches routing errors at compile time

---

## Troubleshooting

### Issue: Route tree not generating
**Solution:** Ensure Vite dev server is running and `TanStackRouterVite()` plugin is in config.

### Issue: shadcn component not found
**Solution:** Run `npx shadcn-ui@latest add <component-name>` to add it.

### Issue: Import alias `@/` not working
**Solution:** Check `tsconfig.json` and `vite.config.ts` have matching path aliases.

### Issue: Tailwind styles not applying
**Solution:** Ensure `index.css` is imported in `main.tsx` and content paths are correct in `tailwind.config.js`.

---

## Related Documents

- [Technical Specification: Web App Structure](./TECH-SPEC-Web-App-Structure.md)
- [Product Requirements Document](./APP-PRD-Revised.md)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Vite Docs](https://vitejs.dev)
