import { Link } from 'react-router-dom';
import { APP_NAME, APP_VERSION } from '@apdevflow/shared';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';

export function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">{APP_NAME}</h1>
        <p className="text-xl text-gray-600 mb-2">
          AI-Powered Development Workflow Platform
        </p>
        <p className="text-sm text-gray-500">Version {APP_VERSION}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Planning Dashboard</CardTitle>
            <CardDescription>
              Break down features into epics and stories using AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm text-gray-600">
              <li>• AI-powered feature breakdown</li>
              <li>• Epic and story generation</li>
              <li>• Review and edit workflow</li>
              <li>• Export to JIRA or CSV</li>
            </ul>
            <Link to="/planning">
              <Button className="w-full">Go to Planning</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Developer Dashboard</CardTitle>
            <CardDescription>
              View your stories and generate implementation specs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm text-gray-600">
              <li>• View assigned stories</li>
              <li>• Export to local workspace</li>
              <li>• Generate specs with AI</li>
              <li>• Upload artifacts</li>
            </ul>
            <Link to="/developer">
              <Button className="w-full" variant="outline">
                Go to My Stories
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Quick Start
        </h2>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>1. Product Owners:</strong> Use the Planning Dashboard to
            create features and generate epics/stories
          </li>
          <li>
            <strong>2. Developers:</strong> View your assigned stories in the
            Developer Dashboard
          </li>
          <li>
            <strong>3. Export:</strong> Use the <code className="bg-blue-100 px-1 rounded">devflow</code> CLI to start working on stories
          </li>
        </ol>
      </div>
    </div>
  );
}
