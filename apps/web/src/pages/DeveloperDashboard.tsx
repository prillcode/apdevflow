import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';

interface Story {
  id: string;
  title: string;
  epicTitle: string;
  description: string;
  status: 'ready' | 'in_progress' | 'review' | 'done';
  storyPoints?: number;
}

const mockStories: Story[] = [
  {
    id: 'story-123',
    title: 'Implement OAuth2 login flow',
    epicTitle: 'User Authentication System',
    description: 'Create OAuth2 authentication flow with Google and GitHub providers',
    status: 'ready',
    storyPoints: 5,
  },
  {
    id: 'story-124',
    title: 'Build user profile component',
    epicTitle: 'Dashboard UI Components',
    description: 'Design and implement reusable user profile card component',
    status: 'in_progress',
    storyPoints: 3,
  },
  {
    id: 'story-125',
    title: 'Create API client service',
    epicTitle: 'API Integration Layer',
    description: 'Build TypeScript client for backend API with error handling',
    status: 'ready',
    storyPoints: 8,
  },
];

const statusColors = {
  ready: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  review: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
};

const statusLabels = {
  ready: 'Ready',
  in_progress: 'In Progress',
  review: 'In Review',
  done: 'Done',
};

export function DeveloperDashboard() {
  const [stories] = useState<Story[]>(mockStories);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const handleStartStory = (storyId: string) => {
    console.log(`Starting story: ${storyId}`);
    alert(`Command: devflow start ${storyId}\n\nThis will export the story to your local workspace.`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Stories</h1>
        <p className="text-gray-600">View and manage your assigned stories</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stories List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Stories</CardTitle>
              <CardDescription>
                {stories.length} stories assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStory?.id === story.id
                      ? 'border-primary bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">
                          {story.id}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            statusColors[story.status]
                          }`}
                        >
                          {statusLabels[story.status]}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {story.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {story.epicTitle}
                      </p>
                    </div>
                    {story.storyPoints && (
                      <div className="text-sm font-semibold text-gray-600 bg-gray-100 rounded px-2 py-1">
                        {story.storyPoints} pts
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {story.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Story Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Story Details</CardTitle>
              <CardDescription>
                {selectedStory ? 'Actions and information' : 'Select a story'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedStory ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">
                      Story ID
                    </h4>
                    <p className="text-sm font-mono text-gray-900">
                      {selectedStory.id}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">
                      Epic
                    </h4>
                    <p className="text-sm text-gray-900">
                      {selectedStory.epicTitle}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">
                      Status
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        statusColors[selectedStory.status]
                      }`}
                    >
                      {statusLabels[selectedStory.status]}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">
                      Description
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedStory.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleStartStory(selectedStory.id)}
                    >
                      Start Story (devflow)
                    </Button>
                    <Button className="w-full" variant="outline">
                      View Artifacts
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Select a story to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
