import React, { useRef } from 'react';
import {
  Upload,
  Download,
  FolderPlus,
  Save,
  Trash,
  LayoutGrid,
  Database,
  Undo,
  Redo,
  Maximize,
  Minimize,
  HelpCircle,
  Globe,
} from 'lucide-react';
import { Input, TreeSelect } from '@arco-design/web-react';
import NavCascaderPicker from '@/components/NavCascaderPicker';
import type { NavItem } from '@/types';

export interface FolderTreeNode {
  id: string;
  label: string;
  children?: FolderTreeNode[];
}

interface ToolbarProps {
  onImport: (file: File) => void;
  onImportFromNav: (nav: NavItem) => void;
  onExport: () => void;
  onAddFolder: () => void;
  onClear: () => void;
  onSave: () => void;
  onAutoLayout: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onClearStorage: () => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onShowGuide: () => void;
  // Filter props
  folderTree: FolderTreeNode[];
  activeFolderIds: Set<string>;
  onFilterChange: (ids: string[]) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onImport,
  onImportFromNav,
  onExport,
  onAddFolder,
  onClear,
  onSave,
  onAutoLayout,
  onToggleFullscreen,
  isFullscreen,
  onClearStorage,
  searchTerm,
  onSearch,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onShowGuide,
  folderTree,
  activeFolderIds,
  onFilterChange,
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

  const mapTreeData = (nodes: FolderTreeNode[]): any[] => {
    return nodes.map((node) => ({
      key: node.id,
      title: node.label,
      value: node.id,
      children: node.children ? mapTreeData(node.children) : [],
    }));
  };

  const treeData = React.useMemo(() => mapTreeData(folderTree), [folderTree]);
  const selectedKeys = React.useMemo(() => Array.from(activeFolderIds), [activeFolderIds]);

  const [isHovered, setIsHovered] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsHidden(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    timeoutRef.current = setTimeout(() => {
      setIsHidden(true);
    }, 3000);
  };

  // Initial timeout to hide after 3s if no interaction
  React.useEffect(() => {
    timeoutRef.current = setTimeout(() => {
        setIsHidden(true);
    }, 3000);
    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, []);


  return (
    <>
      {/* Hover Trigger Zone */}
      <div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 w-96 h-16 cursor-pointer"
        onMouseEnter={handleMouseEnter}
      />
      
      <div 
        className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200 dark:border-gray-700 transition-opacity duration-500 ${isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <input
        type="file"
        accept=".html"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div className="mr-2">
        <Input.Search
          allowClear
          placeholder="Search..."
          style={{ width: 320, borderRadius: '9999px' }}
          value={searchTerm}
          onChange={(val) => onSearch(val)}
          className="rounded-full toolbar-search"
          addBefore={
            <TreeSelect
              treeData={treeData}
              treeCheckable
              showSearch
              filterTreeNode={(inputValue, node) => {
                const title = node.props.title as string;
                return title.toLowerCase().indexOf(inputValue.toLowerCase()) > -1;
              }}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              placeholder="Filter"
              style={{ width: 120, border: 'none', background: 'transparent' }}
              bordered={false}
              value={selectedKeys}
              onChange={(val) => onFilterChange(val as string[])}
              maxTagCount={0}
              triggerProps={{
                autoAlignPopupWidth: false,
                autoAlignPopupMinWidth: true,
                position: 'bl',
              }}
            />
          }
        />
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded-full transition-colors ${
          canUndo
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
        title="Undo"
      >
        <Undo size={20} />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded-full transition-colors ${
          canRedo
            ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
        title="Redo"
      >
        <Redo size={20} />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors tooltip-trigger"
        title="Import Bookmarks (HTML)"
      >
        <Upload size={20} />
      </button>

      <NavCascaderPicker
        onSelect={onImportFromNav}
        title="Import from Navs"
        trigger={
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            title="Import from Navs"
          >
            <Globe size={20} />
          </button>
        }
      />

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
        onClick={onToggleFullscreen}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
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

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        onClick={onShowGuide}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
        title="Show Guide"
      >
        <HelpCircle size={20} />
      </button>
    </div>
    </>
  );
};

export default Toolbar;
