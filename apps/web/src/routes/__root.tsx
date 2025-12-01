import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { APP_NAME } from '@apdevflow/shared';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
              </Link>
              <nav className="flex space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  activeProps={{
                    className:
                      'px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md',
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/planning"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  activeProps={{
                    className:
                      'px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md',
                  }}
                >
                  Planning
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Developer Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Router DevTools (only in development) */}
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
