import type { ECrudState } from "@/lib/crud-hook";
import { createURLStateManager, URLStateManager } from "@/lib/crud-state-mgr";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { proxy, useSnapshot } from "valtio";
import type { BaseEntity, CRUDConfig, ECrudProps } from "../types";

interface CRUDState<T extends BaseEntity> {
  entities: T[];
  selectedEntity: T | null;
  totalCount: number;
  view: "list" | "form" | "detail";
  formMode: "create" | "edit" | null;
  filters: Record<string, any>;
  tempFilters: Record<string, any>;
  activeFilters: string[];
  sorting: {
    field: keyof T | null;
    direction: "asc" | "desc" | null;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
  loading: {
    list: boolean;
    form: boolean;
    delete: boolean;
    deleteConfirmation: boolean;
    bulkDelete: boolean;
    restore: boolean;
    bulkRestore: boolean;
  };
  errors: {
    list: Error | null;
    form: Record<keyof T, string[]> | null;
    general: Error | null;
  };
  pendingNavigation: {
    targetIndex: number;
    type: "previous" | "next";
  } | null;
  lastFetch: number;
  dirty: boolean;
  bulkSelection: {
    selectedIds: (string | number)[];
    isSelectingAll: boolean;
    allRecordsSelected: boolean;
  };
  showTrash: boolean;
  parentListStateHash?: string;
  parentListStateLabel?: string;
  currentListStateHash?: string;
  activeTab: string;
  defaultData: Record<string, any> | null;
  undoDelete: {
    entities: T[];
    timeouts: NodeJS.Timeout[];
  };
}

export const useECrudState = <T extends BaseEntity>(
  config: CRUDConfig<T>,
  props: ECrudProps<T>
) => {
  const {
    data = [],
    onLoadData,
    onLoadTrashData,
    onStoreState,
    onGetState,
    onUpdateState,
    urlState,
  } = props;

  const write = useRef(
    proxy<CRUDState<T>>({
      entities: data,
      selectedEntity: null,
      totalCount: 0,
      view: "list",
      formMode: null,
      filters: {},
      tempFilters: {},
      activeFilters: [],
      sorting: {
        field: null,
        direction: null,
      },
      pagination: {
        page: 1,
        pageSize: 50,
        totalPages: 1,
      },
      loading: {
        list: onLoadData || onLoadTrashData ? true : false,
        form: false,
        delete: false,
        deleteConfirmation: false,
        bulkDelete: false,
        restore: false,
        bulkRestore: false,
      },
      errors: {
        list: null,
        form: null,
        general: null,
      },
      lastFetch: 0,
      dirty: false,
      bulkSelection: {
        selectedIds: [],
        isSelectingAll: false,
        allRecordsSelected: false,
      },
      showTrash: false,
      parentListStateHash: undefined,
      parentListStateLabel: undefined,
      currentListStateHash: undefined,
      activeTab: "main",
      defaultData: null,
      undoDelete: {
        entities: [],
        timeouts: [],
      },
      pendingNavigation: null,
    })
  ).current;

  const read = useSnapshot(write);
  const urlStateManager = useRef<URLStateManager | null>(null);

  // Initialize URL state manager if enabled
  useEffect(() => {
    if (urlState && onStoreState && onGetState && onUpdateState) {
      urlStateManager.current = createURLStateManager(urlState.baseUrl, {
        onStoreState,
        onGetState,
        onUpdateState,
      });
    }
  }, [urlState, onStoreState, onGetState, onUpdateState]);

  // Save current state to URL
  const saveStateToURL = useCallback(async () => {
    const currentState: ECrudState = {
      view: write.view,
      formMode: write.formMode,
      filters: write.filters,
      sorting: {
        field: write.sorting.field ? String(write.sorting.field) : null,
        direction: write.sorting.direction,
      },
      pagination: {
        page: write.pagination.page,
        pageSize: write.pagination.pageSize,
      },
      showTrash: write.showTrash,
      selectedEntityId: write.selectedEntity?.id || null,
      activeTab: write.activeTab,
    };

    if (urlStateManager.current) {
      await urlStateManager.current.saveState(currentState);

      if (write.view === "list" && isListStateModified()) {
        const currentHash = new URLSearchParams(window.location.search).get(
          "state"
        );
        if (currentHash) {
          write.currentListStateHash = currentHash;
        }
      }
    } else if (urlState?.baseUrl) {
      try {
        const storageKey = `ecrud-state-${urlState.baseUrl.replace(
          /[^a-zA-Z0-9]/g,
          "-"
        )}`;
        localStorage.setItem(storageKey, JSON.stringify(currentState));
      } catch (error) {
        console.warn("Failed to save state to localStorage:", error);
      }
    }
  }, [write, urlState, urlStateManager]);

  // Check if current list state is modified
  const isListStateModified = useCallback(() => {
    const hasFilters = Object.keys(write.filters).length > 0;
    const hasSorting = write.sorting.field !== null;
    const hasCustomPagination = write.pagination.page !== 1;
    const isTrashMode = write.showTrash;

    return hasFilters || hasSorting || hasCustomPagination || isTrashMode;
  }, [write.filters, write.sorting, write.pagination, write.showTrash]);

  // Generate descriptive label for current list state
  const getListStateLabel = useCallback(() => {
    const parts: string[] = [];

    if (write.showTrash) {
      parts.push("Data Terhapus");
    }

    if (Object.keys(write.filters).length > 0) {
      parts.push("Filter");
    }

    if (write.sorting.field) {
      function capitalize(val: any) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
      }
      parts.push(`Urut ${capitalize(write.sorting.field as string)}`);
    }

    if (write.pagination.page > 1) {
      parts.push(`Halaman ${write.pagination.page}`);
    }

    return parts.length > 0 ? parts.join(" • ") : "List";
  }, [write.showTrash, write.filters, write.sorting, write.pagination]);

  // Initialize state from URL
  useEffect(() => {
    const initializeFromURL = async () => {
      const defaultState: ECrudState = {
        view: "list",
        formMode: null,
        filters: {},
        sorting: {
          field: null,
          direction: null,
        },
        pagination: {
          page: 1,
          pageSize: 50,
        },
        showTrash: false,
        selectedEntityId: null,
        activeTab: "main",
      };

      let restoredState = defaultState;

      if (urlStateManager.current) {
        restoredState = await urlStateManager.current.initializeState(
          defaultState
        );
      } else if (urlState?.baseUrl) {
        try {
          const storageKey = `ecrud-state-${urlState.baseUrl.replace(
            /[^a-zA-Z0-9]/g,
            "-"
          )}`;
          const storedStateStr = localStorage.getItem(storageKey);
          if (storedStateStr) {
            const storedState = JSON.parse(storedStateStr);
            restoredState = { ...defaultState, ...storedState };
          }
        } catch (error) {
          console.warn("Failed to restore state from localStorage:", error);
        }
      }

      // Apply restored state
      write.view = restoredState.view;
      write.formMode = restoredState.formMode;
      write.filters = restoredState.filters;
      write.sorting = {
        field: restoredState.sorting.field as keyof T | null,
        direction: restoredState.sorting.direction || null,
      };
      write.pagination = { ...write.pagination, ...restoredState.pagination };
      write.showTrash = restoredState.showTrash;
      write.activeTab = restoredState.activeTab || "main";

      // Load defaultData if available
      if (urlStateManager.current) {
        try {
          const defaultData = await urlStateManager.current.getDefaultData();
          write.defaultData = defaultData;
        } catch (error) {
          console.warn("Failed to load defaultData:", error);
        }
      }

      if (restoredState.selectedEntityId && restoredState.view !== "list") {
        write.loading.form = true;
        try {
          let selectedEntity: T | null = null;
          const result = await (write.showTrash
            ? onLoadTrashData
            : onLoadData)?.(write.filters, write.pagination, write.sorting);

          if (result) {
            write.entities = result.data;
            write.totalCount = result.total;
            write.pagination.totalPages = Math.ceil(
              result.total / write.pagination.pageSize
            );
            const foundEntity = result.data.find(
              (e) => e.id === restoredState.selectedEntityId
            );
            selectedEntity = foundEntity || null;
          }

          if (selectedEntity) {
            write.selectedEntity = selectedEntity;
          } else {
            write.view = "list";
            write.formMode = null;
            write.selectedEntity = null;
          }
        } catch (error) {
          write.view = "list";
          write.formMode = null;
          write.selectedEntity = null;
        } finally {
          write.loading.form = false;
        }
      }

      // Load default data from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const defaultDataHash = urlParams.get("defaultData");
      if (defaultDataHash && onGetState) {
        try {
          const defaultDataState = await onGetState(defaultDataHash);
          if (defaultDataState && defaultDataState.defaultData) {
            write.defaultData = defaultDataState.defaultData;
          }
        } catch (error) {
          console.warn("Failed to load default data from URL:", error);
        }
      }

      if (onLoadData || onLoadTrashData) {
        loadEntities();
      }
    };

    initializeFromURL();
  }, []);

  // Load entities from API
  const loadEntities = useCallback(async () => {
    if (!onLoadData && !onLoadTrashData) return;

    write.loading.list = true;
    write.errors.list = null;

    try {
      const loader = write.showTrash ? onLoadTrashData : onLoadData;
      if (!loader) return;

      const result = await loader(
        write.filters,
        write.pagination,
        write.sorting
      );
      write.entities = result.data;
      write.totalCount = result.total;
      write.pagination.totalPages = Math.ceil(
        result.total / write.pagination.pageSize
      );
      write.lastFetch = Date.now();
    } catch (error) {
      console.error(error);
      write.errors.list = error as Error;
      toast.error("Failed to load data");
    } finally {
      write.loading.list = false;
    }
  }, [onLoadData, onLoadTrashData, write]);

  // Cleanup undo delete timeouts on unmount
  useEffect(() => {
    return () => {
      write.undoDelete.timeouts.forEach((timeout) => clearTimeout(timeout));
      write.undoDelete.timeouts = [];
    };
  }, []);

  // Sync with external data changes
  useEffect(() => {
    if (!onLoadData) {
      write.entities = [...data];
      write.totalCount = data.length;
      write.pagination.totalPages = Math.ceil(
        data.length / write.pagination.pageSize
      );
    }
  }, [data, onLoadData]);

  return {
    write,
    read,
    urlStateManager: urlStateManager.current,
    saveStateToURL,
    isListStateModified,
    getListStateLabel,
    loadEntities,
  };
};
