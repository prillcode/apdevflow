import { createFileRoute, Link } from '@tanstack/react-router';
import { StorageService } from '../services/storage';

export const Route = createFileRoute('/')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const devWorkItems = StorageService.getAllDevWork();

  const stateCounts = {
    Draft: devWorkItems.filter((b) => b.workflowState === 'Draft').length,
    'Spec Generated': devWorkItems.filter(
      (b) => b.workflowState === 'Spec Generated'
    ).length,
    'Ready for Development': devWorkItems.filter(
      (b) => b.workflowState === 'Ready for Development'
    ).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Overview of your development workflow
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Draft"
          count={stateCounts.Draft}
          color="blue"
          description="New items of work"
        />
        <StatCard
          title="Spec Generated"
          count={stateCounts['Spec Generated']}
          color="yellow"
          description="Ready for review"
        />
        <StatCard
          title="Ready for Development"
          count={stateCounts['Ready for Development']}
          color="green"
          description="Ready to start coding"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/planning/new"
            className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Plan New Dev Work
          </Link>
          <Link
            to="/planning"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View All Planning Items
          </Link>
        </div>
      </div>

      {/* Recent Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Work
        </h3>
        {devWorkItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No items of work yet. Create your first one to get started!
          </p>
        ) : (
          <div className="space-y-3">
            {devWorkItems.slice(0, 5).map((bow) => (
              <Link
                key={bow.id}
                to="/planning/$id"
                params={{ id: bow.id }}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{bow.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{bow.type}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bow.workflowState === 'Draft'
                        ? 'bg-blue-100 text-blue-800'
                        : bow.workflowState === 'Spec Generated'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {bow.workflowState}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  count: number;
  color: 'blue' | 'yellow' | 'green';
  description: string;
}

function StatCard({ title, count, color, description }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
  };

  return (
    <div
      className={`rounded-lg border p-6 ${colorClasses[color]} transition-all hover:shadow-md`}
    >
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <p className="text-3xl font-bold mt-2">{count}</p>
      <p className="text-xs mt-2 opacity-70">{description}</p>
    </div>
  );
}
