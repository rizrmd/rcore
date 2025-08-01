import type { BaseEntity, BreadcrumbItem, CRUDConfig } from "../types";

export interface BreadcrumbConfig<T extends BaseEntity> {
  basePath?: BreadcrumbItem[];
  entityNameField?: string;
  renderNameLabel?: (entity: T) => Promise<string>;
}

export interface BreadcrumbState {
  view: "list" | "form" | "detail";
  formMode: "create" | "edit" | null;
  selectedEntity: any;
  showTrash: boolean;
  parentListStateHash?: string;
  parentListStateLabel?: string;
  filters: Record<string, any>;
  sorting: {
    field: any;
    direction: "asc" | "desc" | null;
  };
  pagination: {
    page: number;
  };
}

export const isListStateModified = (state: BreadcrumbState): boolean => {
  const hasFilters = Object.keys(state.filters).length > 0;
  const hasSorting = state.sorting.field !== null && state.sorting.direction !== null;
  const hasCustomPagination = state.pagination.page !== 1;
  const isTrashMode = state.showTrash;

  return hasFilters || hasSorting || hasCustomPagination || isTrashMode;
};

export const getListStateLabel = (state: BreadcrumbState): string => {
  const parts: string[] = [];

  if (state.showTrash) {
    parts.push("Data Terhapus");
  }

  if (Object.keys(state.filters).length > 0) {
    parts.push("Filter");
  }

  if (state.sorting.field && state.sorting.direction) {
    function capitalize(val: any) {
      return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
    parts.push(`Urut ${capitalize(state.sorting.field as string)}`);
  }

  if (state.pagination.page > 1) {
    parts.push(`Halaman ${state.pagination.page}`);
  }

  return parts.length > 0 ? parts.join(" • ") : "List";
};

export const generateSmartBreadcrumbs = async <T extends BaseEntity>(
  config: CRUDConfig<T>,
  state: BreadcrumbState,
  breadcrumbConfig?: BreadcrumbConfig<T>,
  urlState?: { baseUrl: string }
): Promise<BreadcrumbItem[]> => {
  const breadcrumbs: BreadcrumbItem[] = [
    ...(breadcrumbConfig?.basePath || []),
  ];

  // Add entity list breadcrumb
  const entityListItem: BreadcrumbItem = {
    label: config.entityNamePlural || `${config.entityName}s`,
  };

  // Check if we'll have multiple breadcrumbs
  const willHaveMultipleBreadcrumbs =
    (state.view === "list" && isListStateModified(state)) ||
    (state.view === "form" && state.parentListStateHash);

  // Add URL for navigation
  if (state.view !== "list" || willHaveMultipleBreadcrumbs) {
    if (willHaveMultipleBreadcrumbs) {
      entityListItem.url = urlState?.baseUrl || "#";
    } else {
      let url = urlState?.baseUrl || "#";
      if (state.parentListStateHash && urlState?.baseUrl) {
        url = `${urlState.baseUrl}?state=${state.parentListStateHash}`;
      }
      entityListItem.url = url;
    }
  }

  breadcrumbs.push(entityListItem);

  // Add current list state breadcrumb if list is modified
  if (state.view === "list" && isListStateModified(state)) {
    breadcrumbs.push({
      label: getListStateLabel(state),
    });
  }
  // Add stored parent list state breadcrumb if we're in form mode
  else if (
    state.view === "form" &&
    state.parentListStateHash &&
    state.parentListStateLabel
  ) {
    const listStateUrl = `${urlState?.baseUrl}?state=${state.parentListStateHash}`;

    breadcrumbs.push({
      label: state.parentListStateLabel,
      url: listStateUrl,
    });
  }
  // Fallback: Add trash indicator if in trash mode
  else if (state.showTrash) {
    const shouldAddUrl = state.view !== "list";

    let trashListUrl = urlState?.baseUrl || "#";
    if (state.parentListStateHash && urlState?.baseUrl) {
      trashListUrl = `${urlState.baseUrl}?state=${state.parentListStateHash}`;
    }

    breadcrumbs.push({
      label: "Data Terhapus",
      ...(shouldAddUrl && { url: trashListUrl }),
    });
  }

  // Add context-specific breadcrumbs
  if (state.view === "form") {
    if (state.formMode === "create") {
      breadcrumbs.push({ label: "Tambah" });
    } else if (state.formMode === "edit" && state.selectedEntity) {
      let entityName: string;
      if (breadcrumbConfig?.renderNameLabel) {
        entityName = await breadcrumbConfig.renderNameLabel(state.selectedEntity);
      } else {
        const nameField = breadcrumbConfig?.entityNameField || "name";
        entityName = state.selectedEntity[nameField] || config.entityName;
      }
      breadcrumbs.push({ label: entityName });
    }
  } else if (state.view === "detail" && state.selectedEntity) {
    let entityName: string;
    if (breadcrumbConfig?.renderNameLabel) {
      entityName = await breadcrumbConfig.renderNameLabel(state.selectedEntity);
    } else {
      const nameField = breadcrumbConfig?.entityNameField || "name";
      entityName = state.selectedEntity[nameField] || config.entityName;
    }
    breadcrumbs.push({ label: entityName });
  }

  return breadcrumbs;
};

export interface BreadcrumbHandlers {
  handleBreadcrumbClick: (url: string) => Promise<void>;
}

export const createBreadcrumbHandlers = (
  urlState?: { baseUrl: string },
  urlStateManager?: any,
  callbacks?: {
    onGetState?: (hash: string) => Promise<any>;
    onLoadData?: () => Promise<void>;
    onResetState: () => void;
    onRestoreState: (state: any) => Promise<void>;
  }
): BreadcrumbHandlers => {
  const handleBreadcrumbClick = async (url: string) => {
    // If URL has state parameter, load that state directly
    if (url.includes("?state=")) {
      const urlObj = new URL(url, window.location.origin);
      const stateHash = urlObj.searchParams.get("state");

      const urlWithoutParams = url.split("?")[0];
      const currentBaseUrl = urlState?.baseUrl;

      if (
        stateHash &&
        urlStateManager &&
        urlWithoutParams === currentBaseUrl &&
        callbacks?.onGetState &&
        callbacks?.onRestoreState
      ) {
        try {
          const storedState = await callbacks.onGetState(stateHash);
          if (storedState) {
            await callbacks.onRestoreState(storedState);

            // Update URL with the state hash
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set("state", stateHash);
            window.history.replaceState({}, "", newUrl.toString());

            if (callbacks?.onLoadData) {
              await callbacks.onLoadData();
            }
            return;
          }
        } catch (error) {
          console.warn("Failed to load state from hash:", error);
        }
      }
    }

    if (url === urlState?.baseUrl || url === "#") {
      // Reset to original/default state
      callbacks?.onResetState();

      // Clear server state and update URL
      if (urlStateManager) {
        urlStateManager.clearState();
      }

      if (callbacks?.onLoadData) {
        await callbacks.onLoadData();
      }
    }
  };

  return {
    handleBreadcrumbClick,
  };
};