import { createFileRoute, Link } from '@tanstack/react-router';
import { StorageService } from '../services/storage';
import type { DevWork } from '../types';

export const Route = createFileRoute('/planning/')({
  component: PlanningListComponent,
});

function PlanningListComponent() {
  const devWorkItems = StorageService.getAllDevWork();

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this item of work? This action cannot be undone.'
      )
    ) {
      StorageService.deleteDevWork(id);
      // Force a re-render by navigating to the same route
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Planning Dashboard
          </h2>
          <p className="mt-2 text-gray-600">
            Manage all your dev work in one place
          </p>
        </div>
        <Link
          to="/planning/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          + Plan New Dev Work
        </Link>
      </div>

      {devWorkItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No items of work
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new item of work
          </p>
          <div className="mt-6">
            <Link
              to="/planning/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + Plan New Dev Work
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devWorkItems.map((bow) => (
                <BodyOfWorkRow
                  key={bow.id}
                  bow={bow}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface BodyOfWorkRowProps {
  bow: DevWork;
  onDelete: (id: string) => void;
}

function BodyOfWorkRow({ bow, onDelete }: BodyOfWorkRowProps) {
  const statusColors = {
    Draft: 'bg-blue-100 text-blue-800',
    'Spec Generated': 'bg-yellow-100 text-yellow-800',
    'Ready for Development': 'bg-green-100 text-green-800',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <Link
          to="/planning/$id"
          params={{ id: bow.id }}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {bow.title}
        </Link>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{bow.type}</td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[bow.workflowState]}`}
        >
          {bow.workflowState}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {new Date(bow.updatedAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-right text-sm space-x-2">
        <Link
          to="/planning/$id"
          params={{ id: bow.id }}
          className="text-blue-600 hover:text-blue-900"
        >
          View
        </Link>
        <button
          onClick={() => onDelete(bow.id)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
