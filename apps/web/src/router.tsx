import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { PlanningDashboard } from '@/pages/PlanningDashboard';
import { DeveloperDashboard } from '@/pages/DeveloperDashboard';

// Root route with Layout
const rootRoute = createRootRoute({
  component: Layout,
});

// Index route (/)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

// Planning route (/planning)
const planningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/planning',
  component: PlanningDashboard,
});

// Developer route (/developer)
const developerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/developer',
  component: DeveloperDashboard,
});

// Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  planningRoute,
  developerRoute,
]);

// Create and export router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
