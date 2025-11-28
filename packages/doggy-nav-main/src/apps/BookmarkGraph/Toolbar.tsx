import React, { useRef } from 'react';
import { Upload, Download, FolderPlus, Save, Trash, LayoutGrid, Database } from 'lucide-react';

interface ToolbarProps {
  onImport: (file: File) => void;
  onExport: () => void;
  onAddFolder: () => void;
  onClear: () => void;
  onSave: () => void;
  onAutoLayout: () => void;
  onClearStorage: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onImport,
  onExport,
  onAddFolder,
  onClear,
  onSave,
  onAutoLayout,
  onClearStorage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200 dark:border-gray-700">
      <input
        type="file"
        accept=".html"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors tooltip-trigger"
        title="Import Bookmarks (HTML)"
      >
        <Upload size={20} />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={onAddFolder}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
        title="Add New Folder"
      >
        <FolderPlus size={20} />
      </button>

      <button
        onClick={onAutoLayout}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
        title="Auto Layout (Reset View)"
      >
        <LayoutGrid size={20} />
      </button>

      <button
        onClick={onSave}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
        title="Save to Local Storage"
      >
        <Save size={20} />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={onExport}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
        title="Export to HTML"
      >
        <Download size={20} />
      </button>

      <button
        onClick={onClearStorage}
        className="p-2 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-600 transition-colors"
        title="Clear Saved Data (IndexedDB)"
      >
        <Database size={20} />
      </button>

      <button
        onClick={onClear}
        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
        title="Clear All"
      >
        <Trash size={20} />
      </button>
    </div>
  );
};

export default Toolbar;
