import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { BodyOfWork, WorkflowState } from '../types';

export const Route = createFileRoute('/planning/$id')({
  component: BodyOfWorkDetailComponent,
});

function BodyOfWorkDetailComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [bodyOfWork, setBodyOfWork] = useState<BodyOfWork | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const bow = StorageService.getBodyOfWorkById(id);
    if (!bow) {
      alert('Body of work not found');
      navigate({ to: '/planning' });
      return;
    }
    setBodyOfWork(bow);
  }, [id, navigate]);

  if (!bodyOfWork) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const handleStateChange = (newState: WorkflowState) => {
    const updated = StorageService.updateWorkflowState(id, newState);
    if (updated) {
      setBodyOfWork(updated);
    }
  };

  const handleGenerateSpec = async (mode: 'manual' | 'api') => {
    if (mode === 'manual') {
      // Manual mode - show instructions
      const prompt = generatePromptForSpec(bodyOfWork);
      alert(
        'Copy the following prompt and paste it into Claude Code:\n\n' + prompt
      );
      // For now, we'll just mark it as generated
      const updated = StorageService.updateBodyOfWork(id, {
        generatedSpec: 'Spec generated manually (placeholder)',
        workflowState: 'Spec Generated',
      });
      if (updated) setBodyOfWork(updated);
    } else {
      // API mode - future implementation
      setIsGenerating(true);
      // Placeholder for future Claude API integration
      setTimeout(() => {
        const updated = StorageService.updateBodyOfWork(id, {
          generatedSpec: 'API-generated spec (placeholder - to be implemented)',
          workflowState: 'Spec Generated',
        });
        if (updated) setBodyOfWork(updated);
        setIsGenerating(false);
      }, 2000);
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        'Are you sure you want to delete this body of work? This action cannot be undone.'
      )
    ) {
      StorageService.deleteBodyOfWork(id);
      navigate({ to: '/planning' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">
            {bodyOfWork.title}
          </h2>
          <div className="mt-2 flex items-center space-x-4">
            <span className="text-sm text-gray-500">{bodyOfWork.type}</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">
              Created {new Date(bodyOfWork.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Delete
        </button>
      </div>

      {/* Workflow State */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Workflow Status
        </h3>
        <div className="flex items-center space-x-2">
          {(['Draft', 'Spec Generated', 'Ready for Development'] as const).map(
            (state) => (
              <button
                key={state}
                onClick={() => handleStateChange(state)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  bodyOfWork.workflowState === state
                    ? state === 'Draft'
                      ? 'bg-blue-600 text-white'
                      : state === 'Spec Generated'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {state}
              </button>
            )
          )}
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {bodyOfWork.type}
              {bodyOfWork.typeOther && ` - ${bodyOfWork.typeOther}`}
            </dd>
          </div>
          {bodyOfWork.repo && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Repository</dt>
              <dd className="mt-1 text-sm text-gray-900">{bodyOfWork.repo}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
              {bodyOfWork.description}
            </dd>
          </div>
          {bodyOfWork.contextReferences.length > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">
                Context References
              </dt>
              <dd className="mt-1 space-y-2">
                {bodyOfWork.contextReferences.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {ref.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Type: {ref.type}
                    </div>
                    {ref.type === 'path' && (
                      <div className="text-xs text-gray-600 mt-1">
                        Path: {ref.value}
                      </div>
                    )}
                    {ref.type === 'markdown' && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          View content
                        </summary>
                        <pre className="mt-2 text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-48">
                          {ref.value}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Generate Spec Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Technical Specification / PRD
        </h3>

        {bodyOfWork.generatedSpec ? (
          <div>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                Specification has been generated
              </p>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md border border-gray-200">
                {bodyOfWork.generatedSpec}
              </pre>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => handleGenerateSpec('manual')}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Regenerate (Manual)
              </button>
              <button
                onClick={() => handleGenerateSpec('api')}
                disabled={isGenerating}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Regenerate (API)'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Generate a technical specification or PRD from this body of work.
              Choose manual mode to copy a prompt for Claude Code, or use API
              mode for automatic generation (requires Claude API setup).
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleGenerateSpec('manual')}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Generate (Manual)
              </button>
              <button
                onClick={() => handleGenerateSpec('api')}
                disabled={isGenerating}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate (API - Advanced)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      {bodyOfWork.workflowState === 'Ready for Development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Ready for Development
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            This body of work is ready to move into development. Next steps:
          </p>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Create Epic(s) from the Tech Spec/PRD</li>
            <li>Use epic-feature-creator skill to create features</li>
            <li>Use feature-story-creator skill to create stories</li>
            <li>Optional: Create dev-spec for each story</li>
            <li>Execute development using dev-execute skill</li>
          </ol>
        </div>
      )}
    </div>
  );
}

function generatePromptForSpec(bodyOfWork: BodyOfWork): string {
  let prompt = `Create a technical specification (Tech Spec/PRD) for the following body of work:\n\n`;
  prompt += `Title: ${bodyOfWork.title}\n`;
  prompt += `Type: ${bodyOfWork.type}${bodyOfWork.typeOther ? ` (${bodyOfWork.typeOther})` : ''}\n\n`;
  prompt += `Description:\n${bodyOfWork.description}\n\n`;

  if (bodyOfWork.repo) {
    prompt += `Repository: ${bodyOfWork.repo}\n\n`;
  }

  if (bodyOfWork.contextReferences.length > 0) {
    prompt += `Context References:\n`;
    bodyOfWork.contextReferences.forEach((ref) => {
      if (ref.type === 'path') {
        prompt += `- ${ref.label}: ${ref.value}\n`;
      } else {
        prompt += `- ${ref.label} (markdown content attached)\n`;
      }
    });
    prompt += '\n';
  }

  prompt += `Please create a comprehensive technical specification that includes:\n`;
  prompt += `1. Overview and objectives\n`;
  prompt += `2. Technical requirements\n`;
  prompt += `3. Implementation approach\n`;
  prompt += `4. Architecture and design considerations\n`;
  prompt += `5. Testing strategy\n`;
  prompt += `6. Timeline and milestones (if applicable)\n`;

  return prompt;
}
