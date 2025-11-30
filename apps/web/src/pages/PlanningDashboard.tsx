import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface Epic {
  id: string;
  title: string;
  description: string;
}

export function PlanningDashboard() {
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [epics, setEpics] = useState<Epic[]>([]);

  const handleGenerateEpics = async () => {
    setIsGenerating(true);

    // Simulate API call - will be replaced with real Bedrock integration
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock generated epics
    const mockEpics: Epic[] = [
      {
        id: 'epic-1',
        title: 'User Authentication System',
        description: 'Implement secure user authentication with OAuth and JWT tokens',
      },
      {
        id: 'epic-2',
        title: 'Dashboard UI Components',
        description: 'Create reusable React components for the planning and developer dashboards',
      },
      {
        id: 'epic-3',
        title: 'API Integration Layer',
        description: 'Build the API layer for connecting frontend to AWS backend services',
      },
    ];

    setEpics(mockEpics);
    setIsGenerating(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Planning Dashboard
        </h1>
        <p className="text-gray-600">
          Break down features into epics and stories using AI
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create Feature</CardTitle>
              <CardDescription>
                Describe your feature or paste a PRD to generate epics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Title
                </label>
                <Input
                  placeholder="e.g., User Management System"
                  value={featureTitle}
                  onChange={(e) => setFeatureTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Description / PRD
                </label>
                <Textarea
                  placeholder="Paste your PRD or describe the feature in detail..."
                  className="min-h-[300px]"
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                />
              </div>
              <Button
                onClick={handleGenerateEpics}
                disabled={!featureTitle || !featureDescription || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating Epics...' : 'Generate Epics with AI'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generated Epics</CardTitle>
              <CardDescription>
                {epics.length > 0
                  ? 'Review and edit the AI-generated epics'
                  : 'Epics will appear here after generation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {epics.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 mb-4"
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
                  <p>No epics generated yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {epics.map((epic) => (
                    <div
                      key={epic.id}
                      className="border rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {epic.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {epic.description}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          Break into Stories
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <Button className="w-full" variant="outline">
                      Export to JIRA
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
