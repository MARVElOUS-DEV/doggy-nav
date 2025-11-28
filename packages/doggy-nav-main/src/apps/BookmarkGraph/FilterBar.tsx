import React from 'react';
import { Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';

export interface FolderTreeNode {
  id: string;
  label: string;
  children?: FolderTreeNode[];
}

interface FilterBarProps {
  folderTree: FolderTreeNode[];
  activeFolderIds: Set<string>;
  onToggleFolder: (id: string) => void;
  onToggleAll: (show: boolean) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  folderTree,
  activeFolderIds,
  onToggleFolder,
  onToggleAll,
}) => {
  const [open, setOpen] = React.useState(false);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const allFolderIds = React.useMemo(() => {
    const ids = new Set<string>();
    const collect = (nodes: FolderTreeNode[]) => {
      nodes.forEach((node) => {
        ids.add(node.id);
        if (node.children && node.children.length > 0) {
          collect(node.children);
        }
      });
    };
    collect(folderTree);
    return ids;
  }, [folderTree]);

  React.useEffect(() => {
    setExpandedIds(new Set(allFolderIds));
  }, [allFolderIds]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedCount = React.useMemo(() => {
    let count = 0;
    allFolderIds.forEach((id) => {
      if (activeFolderIds.has(id)) count += 1;
    });
    return count;
  }, [allFolderIds, activeFolderIds]);

  const totalCount = allFolderIds.size;
  if (folderTree.length === 0) return null;
  let summaryLabel = 'Filter folders';
  if (totalCount > 0) {
    if (selectedCount === 0) summaryLabel = 'No folders selected';
    else if (selectedCount === totalCount) summaryLabel = 'All folders';
    else summaryLabel = `${selectedCount} folders selected`;
  }

  const renderTreeNode = (node: FolderTreeNode): React.ReactNode => {
    const isActive = activeFolderIds.has(node.id);
    const hasChildren = !!(node.children && node.children.length > 0);
    const isExpanded = hasChildren && expandedIds.has(node.id);

    return (
      <div key={node.id} className="flex flex-col">
        <div className="flex items-center">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleExpand(node.id);
              }}
              className="mr-1 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <span className="w-3 mr-1" />
          )}
          <label className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-blue-600"
              checked={isActive}
              onChange={() => onToggleFolder(node.id)}
            />
            <span
              className={`text-xs font-medium max-w-[200px] truncate ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
              title={node.label}
            >
              {node.label}
            </span>
          </label>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 pl-3 border-l border-gray-200 dark:border-gray-700 mt-1 flex flex-col gap-1">
            {node.children!.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Eye size={14} />
          <span className="font-medium">{summaryLabel}</span>
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg rounded-xl p-2 border border-gray-200 dark:border-gray-700 min-w-[260px] max-h-80 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-1">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                Folder visibility
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleAll(true)}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-[11px] font-medium flex items-center gap-1 text-gray-600 dark:text-gray-300"
                  title="Show All"
                >
                  <Eye size={12} /> All
                </button>
                <button
                  onClick={() => onToggleAll(false)}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-[11px] font-medium flex items-center gap-1 text-gray-600 dark:text-gray-300"
                  title="Hide All"
                >
                  <EyeOff size={12} /> None
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 overflow-y-auto pr-1">
              {folderTree.map((node) => renderTreeNode(node))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
