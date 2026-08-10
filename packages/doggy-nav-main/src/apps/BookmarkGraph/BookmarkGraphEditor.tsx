import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  ConfigProvider,
  Drawer,
  Input,
  Message,
  Modal,
  Select,
  Tooltip,
} from '@arco-design/web-react';
import {
  Bookmark,
  CircleHelp,
  Download,
  Dog,
  FileUp,
  Folder,
  FolderPlus,
  Fullscreen,
  LayoutGrid,
  ListChevronsDownUp,
  ListChevronsUpDown,
  Maximize2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  RotateCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import type { NavItem } from '@/types';
import NavCascaderPicker from '@/components/NavCascaderPicker';
import { LoadingIndicator } from '@/components/PageLoading';
import useHistory from './hooks/useHistory';
import BookmarkGraphCanvas from './components/BookmarkGraphCanvas';
import AiOrganizePanel from './components/AiOrganizePanel';
import { loadWorkspace, saveWorkspace } from './persistence';
import {
  generateBookmarkDocumentHtml,
  parseBookmarkDocument,
  type BookmarkImportPreview,
} from './documentFormat';
import {
  EMPTY_DOCUMENT,
  EMPTY_VIEW_STATE,
  getDescendantIds,
  normalizeOrders,
  wouldCreateCycle,
  type BookmarkDocument,
  type BookmarkDocumentItem,
  type BookmarkEditorViewState,
} from './model';
import { LAYOUT_VERSION, runPackedLayout } from './elkLayout';
import { bookmarkOrganizeResponseToDocument } from './aiOrganizeDocument';
import type { BookmarkOrganizeResponse } from 'doggy-nav-core';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export default function BookmarkGraphEditor() {
  const { t } = useTranslation('translation');
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayHostRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, messageHolder] = Message.useMessage({
    getContainer: () => overlayHostRef.current || window.document.body,
  });
  const messageRef = useRef(message);
  useEffect(() => {
    messageRef.current = message;
  }, [message]);
  const [modal, modalHolder] = Modal.useModal();
  const {
    state: document,
    setState: setDocument,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  } = useHistory<BookmarkDocument>(EMPTY_DOCUMENT);
  const [view, setView] = useState<BookmarkEditorViewState>(EMPTY_VIEW_STATE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [rightMode, setRightMode] = useState<'inspect' | 'ai'>('inspect');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(256);
  const [rightWidth, setRightWidth] = useState(320);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layouting, setLayouting] = useState(false);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [importPreview, setImportPreview] = useState<BookmarkImportPreview | null>(null);
  const hasLoaded = useRef(false);
  const loadStarted = useRef(false);

  const popupContainer = useCallback(
    () => overlayHostRef.current || containerRef.current || window.document.body,
    []
  );
  const notify = useCallback((type: 'success' | 'error' | 'warning', content: string) => {
    messageRef.current[type]?.(content);
  }, []);

  useEffect(() => {
    if (loadStarted.current) return;
    loadStarted.current = true;
    loadWorkspace()
      .then(async ({ document: savedDocument, view: savedView, migrated }) => {
        reset(savedDocument);
        let nextView = savedView;
        if (savedDocument.items.length && savedView.layoutVersion !== LAYOUT_VERSION) {
          try {
            nextView = await runPackedLayout(savedDocument, savedView);
            setLayoutRevision((value) => value + 1);
          } catch (error) {
            console.error('Initial bookmark layout failed', error);
          }
        }
        setView(nextView);
        hasLoaded.current = true;
        setLoading(false);
        if (migrated) {
          setSaveStatus('unsaved');
          message.info?.('Legacy bookmark data migrated. The original record is retained.');
        }
      })
      .catch((error) => {
        console.error('Failed to load bookmark workspace', error);
        setLoading(false);
        setSaveStatus('error');
        notify('error', 'Could not load saved bookmark data.');
      });
  }, [message, notify, reset]);

  useEffect(() => {
    const update = () => setNarrow(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const update = () =>
      setIsFullscreen(window.document.fullscreenElement === containerRef.current);
    window.document.addEventListener('fullscreenchange', update);
    return () => window.document.removeEventListener('fullscreenchange', update);
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    setSaveStatus('unsaved');
    const timer = window.setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveWorkspace(document, view);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to autosave bookmark workspace', error);
        setSaveStatus('error');
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [document, view]);

  const saveNow = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await saveWorkspace(document, view);
      setSaveStatus('saved');
      message.success?.('Workspace saved');
    } catch {
      setSaveStatus('error');
      message.error?.('Could not save workspace');
    }
  }, [document, message, view]);

  const folders = useMemo(
    () => document.items.filter((item) => item.type === 'folder'),
    [document.items]
  );
  const selectedItem = useMemo(
    () => document.items.find((item) => item.id === (inspectedId || selectedIds[0])) || null,
    [document.items, inspectedId, selectedIds]
  );
  const filteredIds = useMemo(() => {
    const query = view.filters.query.trim().toLowerCase();
    const visibleFolders = new Set(view.filters.visibleFolderIds);
    const byId = new Map(document.items.map((item) => [item.id, item]));
    return document.items
      .filter((item) => {
        const queryMatch =
          !query ||
          item.title.toLowerCase().includes(query) ||
          item.url?.toLowerCase().includes(query);
        if (!queryMatch || visibleFolders.size === 0) return queryMatch;
        let parentId = item.type === 'folder' ? item.id : item.parentId;
        while (parentId) {
          if (visibleFolders.has(parentId)) return true;
          parentId = byId.get(parentId)?.parentId || null;
        }
        return false;
      })
      .map((item) => item.id);
  }, [document.items, view.filters]);

  const addFolder = useCallback(() => {
    let title = 'New Folder';
    modal.confirm?.({
      title: 'Create folder',
      getPopupContainer: popupContainer,
      content: (
        <Input
          autoFocus
          defaultValue={title}
          onChange={(value) => {
            title = value;
          }}
        />
      ),
      onOk: () => {
        const parentId =
          selectedItem?.type === 'folder' ? selectedItem.id : selectedItem?.parentId || null;
        setDocument((current) => ({
          version: 2,
          items: [
            ...current.items,
            {
              id: uuidv4(),
              type: 'folder',
              title: title.trim() || 'New Folder',
              parentId,
              order: current.items.filter((item) => item.parentId === parentId).length,
            },
          ],
        }));
      },
    });
  }, [modal, popupContainer, selectedItem, setDocument]);

  const importFromNav = useCallback(
    (nav: NavItem) => {
      setDocument((current) => ({
        version: 2,
        items: [
          ...current.items,
          {
            id: uuidv4(),
            type: 'bookmark',
            title: nav.name,
            url: nav.href || undefined,
            icon: nav.logo || undefined,
            parentId: null,
            order: current.items.filter((item) => item.parentId === null).length,
          },
        ],
      }));
    },
    [setDocument]
  );

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () =>
        setImportPreview(parseBookmarkDocument(String(reader.result || ''), document));
      reader.onerror = () => message.error?.('Could not read bookmark file');
      reader.readAsText(file);
    },
    [document, message]
  );

  const applyImport = useCallback(() => {
    if (!importPreview) return;
    setDocument((current) => ({
      version: 2,
      items: normalizeOrders([...current.items, ...importPreview.items]),
    }));
    message.success?.(`Imported ${importPreview.newCount} items`);
    setImportPreview(null);
  }, [importPreview, message, setDocument]);

  const exportBookmarks = useCallback(() => {
    const blob = new Blob([generateBookmarkDocumentHtml(document)], {
      type: 'text/html;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = 'bookmarks.html';
    anchor.click();
    URL.revokeObjectURL(url);
    message.success?.(`Exported ${document.items.length} items`);
  }, [document, message]);

  const deleteItems = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      setDocument((current) => {
        const removed = new Set(ids);
        ids.forEach((id) =>
          getDescendantIds(current.items, id).forEach((child) => removed.add(child))
        );
        return {
          version: 2,
          items: normalizeOrders(current.items.filter((item) => !removed.has(item.id))),
        };
      });
      setSelectedIds([]);
    },
    [setDocument]
  );

  const confirmDelete = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      modal.confirm?.({
        title: `Delete ${ids.length} item${ids.length === 1 ? '' : 's'}?`,
        content: 'Nested content will also be removed.',
        getPopupContainer: popupContainer,
        okButtonProps: { status: 'danger' },
        onOk: () => deleteItems(ids),
      });
    },
    [deleteItems, modal, popupContainer]
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<BookmarkDocumentItem>) => {
      setDocument((current) => {
        if ('parentId' in patch && wouldCreateCycle(current.items, id, patch.parentId ?? null))
          return current;
        return {
          ...current,
          items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        };
      });
    },
    [setDocument]
  );

  const moveItem = useCallback(
    (id: string, parentId: string | null) => {
      const item = document.items.find((candidate) => candidate.id === id);
      if (!item || item.parentId === parentId || wouldCreateCycle(document.items, id, parentId))
        return;
      if (item.type === 'bookmark') {
        setView((current) => {
          const positions = { ...current.positions };
          delete positions[id];
          return { ...current, positions };
        });
      }
      setDocument((current) => ({
        ...current,
        items: normalizeOrders(
          current.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  parentId,
                  order: current.items.filter((candidate) => candidate.parentId === parentId)
                    .length,
                }
              : item
          )
        ),
      }));
    },
    [document.items, setDocument]
  );

  const autoLayout = useCallback(async () => {
    setLayouting(true);
    try {
      const next = await runPackedLayout(document, view);
      setView(next);
      setLayoutRevision((value) => value + 1);
      message.success?.('Automatic layout complete');
    } catch (error) {
      console.error('ELK layout failed', error);
      notify('error', 'Automatic layout failed. Your document was not changed.');
    } finally {
      setLayouting(false);
    }
  }, [document, message, notify, view]);

  const applyAiOrganization = useCallback(
    async (response: BookmarkOrganizeResponse) => {
      const organizedDocument = bookmarkOrganizeResponseToDocument(document, response);
      const currentIds = new Set(organizedDocument.items.map((item) => item.id));
      const resetView: BookmarkEditorViewState = {
        ...view,
        positions: {},
        collapsedFolderIds: view.collapsedFolderIds.filter((id) => currentIds.has(id)),
        filters: {
          ...view.filters,
          visibleFolderIds: view.filters.visibleFolderIds.filter((id) => currentIds.has(id)),
        },
      };

      setDocument(organizedDocument);
      setSelectedIds([]);
      setInspectedId(null);
      setView(resetView);
      setLayouting(true);
      try {
        const laidOutView = await runPackedLayout(organizedDocument, resetView);
        setView(laidOutView);
        setLayoutRevision((value) => value + 1);
      } catch (error) {
        console.error('AI organization layout failed', error);
        notify('warning', t('bookmark_graph_ai_layout_warning'));
      } finally {
        setLayouting(false);
      }
    },
    [document, notify, setDocument, t, view]
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (window.document.fullscreenElement) await window.document.exitFullscreen();
      else await containerRef.current?.requestFullscreen();
    } catch {
      message.error?.('Fullscreen is not available');
    }
  }, [message]);

  const openAi = useCallback(() => {
    setRightMode('ai');
    setRightOpen(true);
  }, []);
  const openInspector = useCallback((id: string) => {
    setInspectedId(id);
    setRightMode('inspect');
    setRightOpen(true);
  }, []);
  const outline = (
    <HierarchyOutline
      document={document}
      selectedIds={selectedIds}
      collapsedIds={view.collapsedFolderIds}
      onSelect={(id) => {
        setSelectedIds([id]);
        openInspector(id);
      }}
      onToggle={(id) =>
        setView((current) => ({
          ...current,
          collapsedFolderIds: current.collapsedFolderIds.includes(id)
            ? current.collapsedFolderIds.filter((value) => value !== id)
            : [...current.collapsedFolderIds, id],
        }))
      }
      onCollapseAll={(collapse) =>
        setView((current) => ({
          ...current,
          collapsedFolderIds: collapse ? folders.map((folder) => folder.id) : [],
        }))
      }
    />
  );
  const rightPanel =
    rightMode === 'ai' ? (
      <AiOrganizePanel document={document} onOrganized={applyAiOrganization} notify={notify} />
    ) : (
      <Inspector
        item={selectedItem}
        folders={
          selectedItem
            ? folders.filter(
                (folder) => !getDescendantIds(document.items, selectedItem.id).has(folder.id)
              )
            : folders
        }
        onChange={updateItem}
        onMove={moveItem}
        onDelete={(id) => confirmDelete([id])}
      />
    );

  if (loading) return <LoadingIndicator className="h-full" />;
  return (
    <ConfigProvider
      getPopupContainer={popupContainer}
      effectGlobalNotice={false}
      effectGlobalModal={false}
    >
      <div
        ref={containerRef}
        className="relative flex h-full w-full flex-col overflow-hidden bg-theme-background text-theme-foreground"
      >
        <div
          ref={overlayHostRef}
          className="pointer-events-none absolute inset-0 z-[1000] [&>*]:pointer-events-auto"
        />
        {messageHolder}
        {modalHolder}
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,text/html"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
            event.target.value = '';
          }}
        />
        <CommandBar
          narrow={narrow}
          canUndo={canUndo}
          canRedo={canRedo}
          isFullscreen={isFullscreen}
          layouting={layouting}
          onOutline={() => (narrow ? setOutlineOpen(true) : setLeftOpen((value) => !value))}
          onImport={() => fileInputRef.current?.click()}
          onExport={exportBookmarks}
          onAddFolder={addFolder}
          onUndo={undo}
          onRedo={redo}
          onLayout={autoLayout}
          onAi={openAi}
          onHelp={() => setHelpOpen(true)}
          onSave={saveNow}
          onFullscreen={toggleFullscreen}
          onInspector={() => setRightOpen((value) => !value)}
          onClear={() =>
            confirmDelete(selectedIds.length ? selectedIds : document.items.map((item) => item.id))
          }
          query={view.filters.query}
          onQuery={(query: string) =>
            setView((current) => ({ ...current, filters: { ...current.filters, query } }))
          }
          folderOptions={folders.map((folder) => ({ label: folder.title, value: folder.id }))}
          visibleFolderIds={view.filters.visibleFolderIds}
          onVisibleFolders={(visibleFolderIds: string[]) =>
            setView((current) => ({
              ...current,
              filters: { ...current.filters, visibleFolderIds },
            }))
          }
          navPicker={
            <NavCascaderPicker
              onSelect={importFromNav}
              title={t('bookmark_graph_import_doggy_nav')}
              trigger={
                <CommandButton label={t('bookmark_graph_doggy_nav')}>
                  <Dog size={16} />
                </CommandButton>
              }
              getPopupContainer={popupContainer}
            />
          }
        />
        <div className="flex min-h-0 flex-1">
          {!narrow ? (
            <ResizablePanel
              side="left"
              open={leftOpen}
              width={leftWidth}
              minWidth={220}
              maxWidth={480}
              onResize={setLeftWidth}
              onToggle={() => setLeftOpen((value) => !value)}
            >
              {outline}
            </ResizablePanel>
          ) : null}
          <main className="relative min-w-0 flex-1">
            <BookmarkGraphCanvas
              document={document}
              view={view}
              selectedIds={selectedIds}
              onViewChange={setView}
              onSelectionChange={setSelectedIds}
              onMoveItem={moveItem}
              onDeleteItems={confirmDelete}
              onInspect={openInspector}
              layoutRevision={layoutRevision}
            />
            {document.items.length === 0 ? (
              <EmptyWorkspace
                onImport={() => fileInputRef.current?.click()}
                onAddFolder={addFolder}
                onAi={openAi}
              />
            ) : null}
          </main>
          {!narrow ? (
            <ResizablePanel
              side="right"
              open={rightOpen}
              width={rightWidth}
              minWidth={280}
              maxWidth={520}
              onResize={setRightWidth}
              onToggle={() => setRightOpen((value) => !value)}
            >
              {rightPanel}
            </ResizablePanel>
          ) : null}
        </div>
        <StatusBar
          document={document}
          selectedCount={selectedIds.length}
          saveStatus={saveStatus}
          viewport={view.viewport}
        />
        <Drawer
          visible={narrow && outlineOpen}
          placement="left"
          width="min(88vw, 340px)"
          title={t('bookmark_graph_hierarchy')}
          getPopupContainer={popupContainer}
          onCancel={() => setOutlineOpen(false)}
          unmountOnExit
        >
          {outline}
        </Drawer>
        <Drawer
          visible={narrow && rightOpen}
          placement="right"
          width="min(92vw, 390px)"
          title={
            rightMode === 'ai' ? t('bookmark_graph_organize_ai') : t('bookmark_graph_inspector')
          }
          getPopupContainer={popupContainer}
          onCancel={() => setRightOpen(false)}
          unmountOnExit
        >
          {rightPanel}
        </Drawer>
        <Modal
          visible={Boolean(importPreview)}
          title="Import preview"
          getPopupContainer={popupContainer}
          onCancel={() => setImportPreview(null)}
          onOk={applyImport}
          okText="Import new items"
        >
          {importPreview ? (
            <div className="grid grid-cols-3 gap-3 py-4">
              <PreviewCount value={importPreview.newCount} label="new" />
              <PreviewCount value={importPreview.duplicateCount} label="duplicates skipped" />
              <PreviewCount value={importPreview.invalidCount} label="invalid skipped" />
            </div>
          ) : null}
        </Modal>
        <Modal
          visible={helpOpen}
          title={t('bookmark_graph_help_title')}
          getPopupContainer={popupContainer}
          onCancel={() => setHelpOpen(false)}
          footer={
            <Button type="primary" onClick={() => setHelpOpen(false)}>
              {t('bookmark_graph_help_close')}
            </Button>
          }
          style={{ width: 'calc(100vw - 32px)', maxWidth: 560 }}
          autoFocus={false}
          focusLock
        >
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <HelpTopic
              step="01"
              title={t('bookmark_graph_help_navigate_title')}
              description={t('bookmark_graph_help_navigate_description')}
            />
            <HelpTopic
              step="02"
              title={t('bookmark_graph_help_select_title')}
              description={t('bookmark_graph_help_select_description')}
            />
            <HelpTopic
              step="03"
              title={t('bookmark_graph_help_organize_title')}
              description={t('bookmark_graph_help_organize_description')}
            />
            <HelpTopic
              step="04"
              title={t('bookmark_graph_help_edit_title')}
              description={t('bookmark_graph_help_edit_description')}
            />
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
}

function CommandBar(props: any) {
  const { t } = useTranslation('translation');
  const folderFilterRef = useRef<HTMLDivElement>(null);
  const [folderFilterOpen, setFolderFilterOpen] = useState(false);

  useEffect(() => {
    if (!folderFilterOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (folderFilterRef.current?.contains(target) || target.closest('.arco-select-popup')) return;
      setFolderFilterOpen(false);
    };
    window.document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    return () => window.document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
  }, [folderFilterOpen]);

  return (
    <header
      className={`z-20 flex min-h-14 flex-none items-center gap-2 border-b border-theme-border bg-theme-card px-3 py-2 shadow-sm ${props.narrow ? 'overflow-x-auto' : 'flex-wrap'}`}
    >
      <CommandGroup label={t('bookmark_graph_panels')}>
        <CommandButton label={t('bookmark_graph_hierarchy')} onClick={props.onOutline}>
          <Menu size={16} />
        </CommandButton>
        <CommandButton label={t('bookmark_graph_inspector')} onClick={props.onInspector}>
          <PanelRight size={16} />
        </CommandButton>
      </CommandGroup>
      <CommandGroup label={t('bookmark_graph_file_actions')}>
        <CommandButton label={t('bookmark_graph_import_file')} onClick={props.onImport}>
          <FileUp size={16} />
        </CommandButton>
        {props.navPicker}
        <CommandButton label={t('bookmark_graph_export')} onClick={props.onExport}>
          <Download size={16} />
        </CommandButton>
      </CommandGroup>
      <CommandGroup label={t('bookmark_graph_edit_actions')}>
        <CommandButton label={t('bookmark_graph_add_folder')} onClick={props.onAddFolder}>
          <FolderPlus size={16} />
        </CommandButton>
        <CommandButton
          label={t('bookmark_graph_undo')}
          disabled={!props.canUndo}
          onClick={props.onUndo}
        >
          <RotateCcw size={16} />
        </CommandButton>
        <CommandButton
          label={t('bookmark_graph_redo')}
          disabled={!props.canRedo}
          onClick={props.onRedo}
        >
          <RotateCw size={16} />
        </CommandButton>
        <CommandButton label={t('bookmark_graph_delete')} onClick={props.onClear}>
          <Trash2 size={16} />
        </CommandButton>
      </CommandGroup>
      <CommandGroup label={t('bookmark_graph_layout_actions')}>
        <CommandButton
          label={t('bookmark_graph_auto_layout')}
          disabled={props.layouting}
          onClick={props.onLayout}
        >
          <LayoutGrid size={16} />
        </CommandButton>
      </CommandGroup>
      <div className="flex flex-none items-center gap-2">
        <label className="flex h-10 w-72 items-center gap-2 rounded-xl border border-theme-border bg-theme-background px-3">
          <Search size={15} className="text-theme-muted-foreground" />
          <input
            value={props.query}
            onChange={(event) => props.onQuery(event.target.value)}
            placeholder={t('bookmark_graph_filter_bookmarks')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <div ref={folderFilterRef} className="w-56 flex-none">
          <Select
            size="large"
            mode="multiple"
            allowClear
            maxTagCount={1}
            popupVisible={folderFilterOpen}
            onVisibleChange={setFolderFilterOpen}
            placeholder={t('bookmark_graph_all_folders')}
            options={props.folderOptions}
            value={props.visibleFolderIds}
            onChange={props.onVisibleFolders}
            className="w-full"
          />
        </div>
      </div>
      <span className="min-w-2 flex-1" />
      <button
        type="button"
        onClick={props.onAi}
        className="inline-flex h-10 flex-none items-center gap-2 whitespace-nowrap rounded-xl bg-theme-primary px-4 text-sm font-semibold text-theme-primary-foreground shadow-sm hover:opacity-90"
      >
        <Sparkles size={16} /> {t('bookmark_graph_organize_ai')}
      </button>
      <CommandGroup label={t('bookmark_graph_view_actions')}>
        <CommandButton label={t('bookmark_graph_help')} onClick={props.onHelp}>
          <CircleHelp size={16} />
        </CommandButton>
        <CommandButton label={t('bookmark_graph_save')} onClick={props.onSave}>
          <Save size={16} />
        </CommandButton>
        <CommandButton
          label={
            props.isFullscreen
              ? t('bookmark_graph_exit_fullscreen')
              : t('bookmark_graph_fullscreen')
          }
          onClick={props.onFullscreen}
        >
          {props.isFullscreen ? <X size={16} /> : <Fullscreen size={16} />}
        </CommandButton>
      </CommandGroup>
    </header>
  );
}

function CommandButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <Tooltip content={label}>
      <span className="inline-flex">
        <button
          type="button"
          aria-label={label}
          title={label}
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-theme-foreground hover:bg-theme-card disabled:cursor-not-allowed disabled:opacity-40"
          {...props}
        >
          {children}
        </button>
      </span>
    </Tooltip>
  );
}

function CommandGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex h-10 flex-none items-center rounded-xl border border-theme-border bg-theme-muted p-0.5"
    >
      {children}
    </div>
  );
}

function HelpTopic({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-theme-border bg-theme-muted p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-theme-primary">{step}</span>
        <div className="font-semibold text-theme-foreground">{title}</div>
      </div>
      <p className="text-sm leading-6 text-theme-muted-foreground">{description}</p>
    </div>
  );
}

function ResizablePanel({
  side,
  open,
  width,
  minWidth,
  maxWidth,
  onResize,
  onToggle,
  children,
}: {
  side: 'left' | 'right';
  open: boolean;
  width: number;
  minWidth: number;
  maxWidth: number;
  onResize: (width: number) => void;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation('translation');
  const drag = useRef<{ x: number; width: number } | null>(null);
  const dragged = useRef(false);
  const Icon =
    side === 'left'
      ? open
        ? PanelLeftClose
        : PanelLeftOpen
      : open
        ? PanelRightClose
        : PanelRightOpen;
  const label = t(`bookmark_graph_${open ? 'collapse' : 'expand'}_${side}_panel`);

  return (
    <aside
      className={`relative flex-none bg-theme-card ${side === 'left' ? 'border-r' : 'border-l'} border-theme-border`}
      style={{ width: open ? width : 14 }}
    >
      {open ? <div className="h-full min-w-0 overflow-hidden">{children}</div> : null}
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={open ? `${label} · ${t('bookmark_graph_drag_to_resize')}` : label}
        className={`absolute inset-y-0 z-20 flex w-3 touch-none cursor-col-resize items-center justify-center ${side === 'left' ? '-right-1.5' : '-left-1.5'}`}
        onPointerDown={(event) => {
          if (!open) return;
          drag.current = { x: event.clientX, width };
          dragged.current = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const delta = (event.clientX - drag.current.x) * (side === 'left' ? 1 : -1);
          dragged.current ||= Math.abs(delta) > 3;
          onResize(Math.min(maxWidth, Math.max(minWidth, drag.current.width + delta)));
        }}
        onPointerUp={(event) => {
          if (!drag.current) return;
          drag.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onClick={(event) => {
          if (dragged.current) {
            dragged.current = false;
            event.preventDefault();
            return;
          }
          onToggle();
        }}
      >
        <span className="flex h-12 w-5 flex-none items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-muted-foreground shadow-sm hover:border-theme-primary hover:text-theme-primary">
          <Icon size={13} />
        </span>
      </button>
    </aside>
  );
}

function HierarchyOutline({
  document,
  selectedIds,
  collapsedIds,
  onSelect,
  onToggle,
  onCollapseAll,
}: {
  document: BookmarkDocument;
  selectedIds: string[];
  collapsedIds: string[];
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onCollapseAll: (collapse: boolean) => void;
}) {
  const { t } = useTranslation('translation');
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const collapsed = useMemo(() => new Set(collapsedIds), [collapsedIds]);
  const itemById = useMemo(
    () => new Map(document.items.map((item) => [item.id, item])),
    [document.items]
  );
  const children = useMemo(() => {
    const map = new Map<string | null, BookmarkDocumentItem[]>();
    document.items.forEach((item) => {
      const list = map.get(item.parentId) || [];
      list.push(item);
      map.set(item.parentId, list);
    });
    return map;
  }, [document.items]);
  const folderIds = useMemo(
    () => document.items.filter((item) => item.type === 'folder').map((item) => item.id),
    [document.items]
  );
  const allCollapsed = folderIds.length > 0 && folderIds.every((id) => collapsed.has(id));
  const matchingIds = useMemo(
    () =>
      new Set(
        normalizedQuery
          ? document.items
              .filter((item) => item.title.toLowerCase().includes(normalizedQuery))
              .map((item) => item.id)
          : []
      ),
    [document.items, normalizedQuery]
  );
  const searchVisibleIds = useMemo(() => {
    if (!normalizedQuery) return null;
    const visible = new Set(matchingIds);
    matchingIds.forEach((id) => {
      let parentId = itemById.get(id)?.parentId;
      while (parentId) {
        visible.add(parentId);
        parentId = itemById.get(parentId)?.parentId;
      }
    });
    return visible;
  }, [itemById, matchingIds, normalizedQuery]);
  const render = (parentId: string | null, depth = 0): React.ReactNode =>
    (children.get(parentId) || [])
      .filter((item) => !searchVisibleIds || searchVisibleIds.has(item.id))
      .toSorted((a, b) => a.order - b.order)
      .map((item) => (
        <React.Fragment key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex w-full items-center gap-2 truncate px-3 py-2 text-left text-sm hover:bg-theme-muted ${selectedIds.includes(item.id) ? 'text-theme-primary' : 'text-theme-foreground'}`}
            style={{ paddingLeft: 12 + depth * 16 }}
          >
            {item.type === 'folder' ? (
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle(item.id);
                }}
              >
                {!normalizedQuery && collapsed.has(item.id) ? '▸' : '▾'}
              </span>
            ) : (
              <span className="w-3" />
            )}
            <span
              className={`truncate ${matchingIds.has(item.id) ? 'rounded bg-yellow-200 px-1 text-yellow-950 dark:bg-yellow-400/30 dark:text-yellow-100' : ''}`}
            >
              {item.title}
            </span>
          </button>
          {item.type === 'folder' && (normalizedQuery || !collapsed.has(item.id))
            ? render(item.id, depth + 1)
            : null}
        </React.Fragment>
      ));
  return (
    <div className="h-full overflow-y-auto py-2">
      <div className="sticky top-0 z-10 space-y-2 border-b border-theme-border bg-theme-card px-3 pb-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-theme-muted-foreground">
            {t('bookmark_graph_hierarchy')}
          </div>
          <button
            type="button"
            disabled={!folderIds.length}
            aria-label={
              allCollapsed
                ? t('bookmark_graph_expand_all_folders')
                : t('bookmark_graph_collapse_all_folders')
            }
            title={
              allCollapsed
                ? t('bookmark_graph_expand_all_folders')
                : t('bookmark_graph_collapse_all_folders')
            }
            onClick={() => onCollapseAll(!allCollapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-theme-muted-foreground hover:bg-theme-muted hover:text-theme-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allCollapsed ? <ListChevronsUpDown size={14} /> : <ListChevronsDownUp size={14} />}
          </button>
        </div>
        <label className="flex h-7 items-center gap-1.5 rounded-md border border-theme-border bg-theme-background px-2 focus-within:border-theme-primary">
          <Search size={13} className="flex-none text-theme-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t('bookmark_graph_search_hierarchy')}
            placeholder={t('bookmark_graph_search_hierarchy')}
            className="min-w-0 flex-1 bg-transparent text-xs text-theme-foreground outline-none placeholder:text-theme-muted-foreground"
          />
        </label>
      </div>
      {render(null)}
      {normalizedQuery && matchingIds.size === 0 ? (
        <div className="p-4 text-center text-sm text-theme-muted-foreground">
          {t('bookmark_graph_no_hierarchy_matches')}
        </div>
      ) : null}
      {document.items.length === 0 ? (
        <div className="p-4 text-sm text-theme-muted-foreground">
          {t('bookmark_graph_no_items')}
        </div>
      ) : null}
    </div>
  );
}

function Inspector({
  item,
  folders,
  onChange,
  onMove,
  onDelete,
}: {
  item: BookmarkDocumentItem | null;
  folders: BookmarkDocumentItem[];
  onChange: (id: string, patch: Partial<BookmarkDocumentItem>) => void;
  onMove: (id: string, parentId: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation('translation');
  if (!item)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme-muted text-theme-primary">
          <PanelRight size={20} />
        </div>
        <div className="font-semibold text-theme-foreground">
          {t('bookmark_graph_inspector_empty_title')}
        </div>
        <div className="max-w-56 text-sm leading-6 text-theme-muted-foreground">
          {t('bookmark_graph_inspector_empty_description')}
        </div>
      </div>
    );
  const ItemIcon = item.type === 'bookmark' ? Bookmark : Folder;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-theme-border p-4">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-theme-muted text-theme-primary">
          <ItemIcon size={18} />
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-theme-foreground">{item.title}</div>
          <div className="mt-0.5 text-xs text-theme-muted-foreground">
            {t(
              item.type === 'bookmark'
                ? 'bookmark_graph_item_bookmark'
                : 'bookmark_graph_item_folder'
            )}
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-4 rounded-xl border border-theme-border p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-theme-muted-foreground">
            {t('bookmark_graph_properties')}
          </div>
          <label className="block text-xs font-medium text-theme-muted-foreground">
            {t('bookmark_graph_property_title')}
            <Input
              key={`${item.id}-title`}
              className="mt-1.5"
              defaultValue={item.title}
              onBlur={(event) =>
                onChange(item.id, { title: event.target.value.trim() || item.title })
              }
            />
          </label>
          {item.type === 'bookmark' ? (
            <label className="block text-xs font-medium text-theme-muted-foreground">
              {t('bookmark_graph_property_url')}
              <Input
                key={`${item.id}-url`}
                className="mt-1.5"
                defaultValue={item.url || ''}
                onBlur={(event) => onChange(item.id, { url: event.target.value.trim() })}
              />
            </label>
          ) : null}
          <label className="block text-xs font-medium text-theme-muted-foreground">
            {t('bookmark_graph_move_to_folder')}
            <select
              className="mt-1.5 h-9 w-full rounded-lg border border-theme-border bg-theme-background px-3 text-sm text-theme-foreground outline-none focus:border-theme-primary"
              value={item.parentId || ''}
              onChange={(event) => onMove(item.id, event.target.value || null)}
            >
              <option value="">{t('bookmark_graph_root')}</option>
              {folders
                .filter((folder) => folder.id !== item.id)
                .map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.title}
                  </option>
                ))}
            </select>
            <span className="mt-2 block leading-5">
              {t(
                item.type === 'bookmark'
                  ? 'bookmark_graph_move_bookmark_hint'
                  : 'bookmark_graph_move_folder_hint'
              )}
            </span>
          </label>
        </div>
      </div>
      <div className="space-y-3 border-t border-theme-border p-4">
        {item.type === 'bookmark' && item.url ? (
          <Button
            type="primary"
            long
            onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
          >
            {t('bookmark_graph_open_bookmark')}
          </Button>
        ) : null}
        <div
          className={
            item.type === 'bookmark' && item.url ? 'border-t border-theme-border pt-3' : ''
          }
        >
          <Button long status="danger" onClick={() => onDelete(item.id)}>
            {t('bookmark_graph_delete_item')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyWorkspace({
  onImport,
  onAddFolder,
  onAi,
}: {
  onImport: () => void;
  onAddFolder: () => void;
  onAi: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="pointer-events-auto max-w-md rounded-2xl border border-theme-border bg-theme-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-theme-muted text-theme-primary">
          <Maximize2 />
        </div>
        <h2 className="text-xl font-semibold text-theme-foreground">
          Build your bookmark workspace
        </h2>
        <p className="my-3 text-sm text-theme-muted-foreground">
          Import browser bookmarks, add a folder, or ask AI to organize the workspace.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="primary" onClick={onImport}>
            Import bookmarks
          </Button>
          <Button onClick={onAddFolder}>Add folder</Button>
          <Button onClick={onAi}>Organize with AI</Button>
        </div>
      </div>
    </div>
  );
}
function StatusBar({
  document,
  selectedCount,
  saveStatus,
  viewport,
}: {
  document: BookmarkDocument;
  selectedCount: number;
  saveStatus: SaveStatus;
  viewport: BookmarkEditorViewState['viewport'];
}) {
  const bookmarks = document.items.filter((item) => item.type === 'bookmark').length;
  return (
    <footer className="flex h-7 flex-none items-center gap-4 border-t border-theme-border bg-theme-card px-3 text-[11px] text-theme-muted-foreground">
      <span>{bookmarks} bookmarks</span>
      <span>{document.items.length - bookmarks} folders</span>
      <span>{selectedCount} selected</span>
      <span>{Math.round(viewport.zoom * 100)}%</span>
      <span className="ml-auto capitalize">{saveStatus === 'saving' ? 'Saving…' : saveStatus}</span>
    </footer>
  );
}
function PreviewCount({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-theme-muted p-3 text-center">
      <div className="text-xl font-semibold text-theme-foreground">{value}</div>
      <div className="text-xs text-theme-muted-foreground">{label}</div>
    </div>
  );
}
