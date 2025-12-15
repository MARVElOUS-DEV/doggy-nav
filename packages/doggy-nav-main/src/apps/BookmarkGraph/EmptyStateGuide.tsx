import React from 'react';
import { Button } from '@arco-design/web-react';
import { Upload, FolderPlus, HelpCircle, ArrowRight } from 'lucide-react';

interface EmptyStateGuideProps {
  onImportClick: () => void;
  onAddFolderClick: () => void;
  onShowGuide: () => void;
}

const steps = [
  {
    step: 1,
    title: 'Export bookmarks from your browser',
    description: "Go to your browser's bookmark manager and export bookmarks as HTML",
  },
  {
    step: 2,
    title: 'Import the HTML file here',
    description: 'Click the Import button below to upload your bookmarks file',
  },
  {
    step: 3,
    title: 'Organize and visualize',
    description: 'Drag, group, and arrange your bookmarks on the canvas',
  },
];

const EmptyStateGuide: React.FC<EmptyStateGuideProps> = ({
  onImportClick,
  onAddFolderClick,
  onShowGuide,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          No Bookmarks Yet
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Import your browser bookmarks to visualize and organize them in an interactive graph
        </p>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-left">
            Quick Start Guide
          </h3>
          <div className="space-y-4">
            {steps.map((item, index) => (
              <div key={item.step} className="flex items-start gap-3 text-left">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight
                    size={16}
                    className="text-gray-300 dark:text-gray-600 mt-1.5 hidden sm:block"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="primary"
            size="large"
            icon={<Upload size={18} />}
            onClick={onImportClick}
            className="!flex justify-center items-center"
          >
            Import Bookmarks
          </Button>
          <Button
            size="large"
            icon={<FolderPlus size={18} />}
            onClick={onAddFolderClick}
            className="!flex justify-center items-center"
          >
            Create Folder
          </Button>
        </div>

        <button
          onClick={onShowGuide}
          className="!mt-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <HelpCircle size={16} />
          View full feature guide
        </button>
      </div>
    </div>
  );
};

export default EmptyStateGuide;
