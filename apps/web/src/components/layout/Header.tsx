import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary">APDevFlow</div>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/planning"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Planning
              </Link>
              <Link
                to="/developer"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                My Stories
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Demo User</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
