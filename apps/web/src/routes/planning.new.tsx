import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { StorageService } from '../services/storage';
import type { WorkType, ContextReference } from '../types';

export const Route = createFileRoute('/planning/new')({
  component: NewBodyOfWorkComponent,
});

const WORK_TYPES: WorkType[] = [
  'Feature Request to existing App',
  'Iterative Improvements to existing feature(s)',
  'Brand New App/Initiative',
  'New Integration to existing App',
  'Alterations to Process/App Component',
  'Other',
];

function NewBodyOfWorkComponent() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WorkType>(
    'Feature Request to existing App'
  );
  const [typeOther, setTypeOther] = useState('');
  const [description, setDescription] = useState('');
  const [repo, setRepo] = useState('');
  const [contextReferences, setContextReferences] = useState<
    ContextReference[]
  >([]);
  const [newRefType, setNewRefType] = useState<'path' | 'markdown'>('path');
  const [newRefValue, setNewRefValue] = useState('');
  const [newRefLabel, setNewRefLabel] = useState('');

  const handleAddContextReference = () => {
    if (!newRefValue.trim() || !newRefLabel.trim()) return;

    const newRef: ContextReference = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: newRefType,
      value: newRefValue,
      label: newRefLabel,
    };

    setContextReferences([...contextReferences, newRef]);
    setNewRefValue('');
    setNewRefLabel('');
  };

  const handleRemoveContextReference = (id: string) => {
    setContextReferences(contextReferences.filter((ref) => ref.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newRef: ContextReference = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'markdown',
        value: content,
        label: file.name,
      };
      setContextReferences([...contextReferences, newRef]);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert('Please fill in required fields: Title and Description');
      return;
    }

    if (type === 'Other' && !typeOther.trim()) {
      alert('Please specify the type when selecting "Other"');
      return;
    }

    const bodyOfWork = StorageService.createBodyOfWork({
      title: title.trim(),
      type,
      typeOther: type === 'Other' ? typeOther.trim() : undefined,
      description: description.trim(),
      repo: repo.trim() || undefined,
      contextReferences,
    });

    navigate({ to: '/planning/$id', params: { id: bodyOfWork.id } });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">
          Plan New Body of Work
        </h2>
        <p className="mt-2 text-gray-600">
          Describe the work to be done in natural language
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g., Add Program Panel to User Management app"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as WorkType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              required
            >
              {WORK_TYPES.map((workType) => (
                <option key={workType} value={workType}>
                  {workType}
                </option>
              ))}
            </select>
          </div>

          {/* Type Other (conditional) */}
          {type === 'Other' && (
            <div>
              <label
                htmlFor="typeOther"
                className="block text-sm font-medium text-gray-700"
              >
                Please Specify <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="typeOther"
                value={typeOther}
                onChange={(e) => setTypeOther(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="Describe the type of work"
                required
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              This will be used as the prompt for generating the technical
              specification
            </p>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="Provide as much detail as you want about this body of work..."
              required
            />
          </div>

          {/* Repo */}
          <div>
            <label
              htmlFor="repo"
              className="block text-sm font-medium text-gray-700"
            >
              GitHub Repository (Optional)
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Provide the repository URL or name
            </p>
            <input
              type="text"
              id="repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g., https://github.com/org/repo or org/repo"
            />
          </div>

          {/* Context References */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Context References (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Add file paths or upload markdown documents for additional context
            </p>

            {/* Existing References */}
            {contextReferences.length > 0 && (
              <div className="space-y-2 mb-4">
                {contextReferences.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {ref.label}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({ref.type})
                      </span>
                      {ref.type === 'path' && (
                        <p className="text-xs text-gray-600 mt-1">
                          {ref.value}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveContextReference(ref.id)}
                      className="ml-4 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Reference */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="path"
                    checked={newRefType === 'path'}
                    onChange={(e) =>
                      setNewRefType(e.target.value as 'path' | 'markdown')
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">File Path</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="markdown"
                    checked={newRefType === 'markdown'}
                    onChange={(e) =>
                      setNewRefType(e.target.value as 'path' | 'markdown')
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Upload Markdown</span>
                </label>
              </div>

              {newRefType === 'path' ? (
                <>
                  <input
                    type="text"
                    value={newRefLabel}
                    onChange={(e) => setNewRefLabel(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="Label (e.g., User Component)"
                  />
                  <input
                    type="text"
                    value={newRefValue}
                    onChange={(e) => setNewRefValue(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="Relative path (e.g., src/components/User.tsx)"
                  />
                  <button
                    type="button"
                    onClick={handleAddContextReference}
                    className="w-full px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Add Path Reference
                  </button>
                </>
              ) : (
                <div>
                  <input
                    type="file"
                    accept=".md,.markdown"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/planning' })}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Body of Work
          </button>
        </div>
      </form>
    </div>
  );
}
