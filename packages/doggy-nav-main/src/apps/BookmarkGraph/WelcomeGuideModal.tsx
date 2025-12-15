import React from 'react';
import { Modal, Button } from '@arco-design/web-react';
import { Upload, FolderPlus, Move, Save, Download, LayoutGrid } from 'lucide-react';

interface WelcomeGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onImportClick?: () => void;
  getPopupContainer?: () => HTMLElement;
}

const features = [
  {
    icon: Upload,
    title: 'Import Bookmarks',
    description: 'Import your browser bookmarks from an HTML file exported from Chrome, Firefox, or other browsers.',
  },
  {
    icon: FolderPlus,
    title: 'Organize with Folders',
    description: 'Create folders to group related bookmarks together. Drag bookmarks into folders to organize them.',
  },
  {
    icon: Move,
    title: 'Drag & Drop',
    description: 'Freely arrange your bookmarks on the canvas. Drag nodes to position them exactly where you want.',
  },
  {
    icon: LayoutGrid,
    title: 'Auto Layout',
    description: 'Use auto-layout to automatically arrange all bookmarks in a clean, organized grid.',
  },
  {
    icon: Save,
    title: 'Save Progress',
    description: 'Your changes are stored locally in your browser. Click Save to persist your work.',
  },
  {
    icon: Download,
    title: 'Export Bookmarks',
    description: 'Export your organized bookmarks back to an HTML file that can be imported into any browser.',
  },
];

const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({ visible, onClose, onImportClick, getPopupContainer }) => {
  const handleGetStarted = () => {
    onClose();
    onImportClick?.();
  };

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      title={null}
      closable
      style={{ width: 600 }}
      className="welcome-guide-modal"
      getPopupContainer={getPopupContainer}
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Welcome to Bookmark Graph
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Visualize and organize your bookmarks in an interactive canvas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <feature.icon size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <Button onClick={onClose}>Browse First</Button>
        <Button type="primary" onClick={handleGetStarted}>
          Import Bookmarks
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
        Tip: Hover over the top center of the canvas to reveal the toolbar
      </p>
    </Modal>
  );
};

export default WelcomeGuideModal;
