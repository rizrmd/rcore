import type { FlexibleEntity } from "@/components/core/ecrud/types";

// ECrud state interface for URL persistence
// Only stores selectors/identifiers, not actual data
export interface ECrudState {
  view: 'list' | 'form' | 'detail';
  formMode: 'create' | 'edit' | null;
  filters: Record<string, any>; // Filter criteria, not filtered data
  sorting: {
    field: string | null;
    direction: 'asc' | 'desc' | null;
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  showTrash: boolean;
  selectedEntityId?: string | number | null; // Only the ID, not the entity data
  activeTab?: string; // Active tab for forms with nested ECrud
}

interface BreadcrumbItem {
  label: string;
  url?: string;
}

interface CrudNavigateOptions {
  view?: 'list' | 'form' | 'detail';
  formMode?: 'create' | 'edit';
  defaultData?: Record<string, any>;
  filters?: Record<string, any>;
  selectedEntityId?: string | number | null;
  activeTab?: string;
  baseUrl: string;
  navigate: (url: string) => void;
}

interface CrudHandlers<T extends FlexibleEntity> {
  onLoadData: (filters: any, pagination: any, sorting?: any) => Promise<{ data: T[]; total: number }>;
  onLoadTrashData: (filters: any, pagination: any, sorting?: any) => Promise<{ data: T[]; total: number }>;
  onLoadAllIds: (filters: any, sorting?: any) => Promise<(string | number)[]>;
  onLoadAllTrashIds: (filters: any, sorting?: any) => Promise<(string | number)[]>;
  onEntitySave: (entity: T, mode: "create" | "edit") => Promise<T>;
  onEntityDelete: (entity: T) => Promise<void>;
  onBulkDelete: (ids: (string | number)[]) => Promise<void>;
  onEntityRestore: (entity: T) => Promise<void>;
  onBulkRestore: (ids: (string | number)[]) => Promise<void>;
  // State management functions
  onStoreState: (state: ECrudState, ttl?: number) => Promise<string>;
  onGetState: (hash: string) => Promise<ECrudState | null>;
  onUpdateState: (hash: string, state: ECrudState) => Promise<string>;
  // Smart breadcrumb configuration
  breadcrumbConfig: {
    basePath?: BreadcrumbItem[];
    entityNameField?: string;
    renderNameLabel?: (entity: T) => Promise<string>;
  };
}

export const useCrud = <T extends FlexibleEntity>(
  apiFunction: (params: any) => Promise<{ success: boolean; data?: any; message?: any; status?: any }>,
  options?: {
    primaryKey?: string; // Primary key field name (default: "id")
    breadcrumbConfig?: {
      basePath?: BreadcrumbItem[];
      entityNameField?: string;
      renderNameLabel?: (entity: T) => Promise<string>;
    };
  }
): CrudHandlers<T> => {
  const callApi = async (action: string, params: any = {}) => {
    const payload = { action, ...params };
    const res = await apiFunction(payload);
    if (!res.success) {
      throw new Error(res.message || `Failed to ${action}`);
    }
    return res.data || null;
  };

  const buildParams = (filters: any, pagination?: any, sorting?: any) => {
    const params: any = { ...filters };
    
    if (pagination) {
      Object.assign(params, pagination);
    }
    
    if (sorting?.field && sorting?.direction && sorting.direction !== null) {
      params.sort = sorting.field;
      params.order = sorting.direction;
    }
    
    return params;
  };

  return {
    onLoadData: async (filters: any, pagination: any, sorting?: any) => {
      const params = buildParams(filters, pagination, sorting);
      return callApi('list', params);
    },

    onLoadTrashData: async (filters: any, pagination: any, sorting?: any) => {
      const params = buildParams(filters, pagination, sorting);
      return callApi('listTrash', params);
    },

    onLoadAllIds: async (filters: any, sorting?: any) => {
      const params = buildParams(filters, undefined, sorting);
      return callApi('listIds', params);
    },

    onLoadAllTrashIds: async (filters: any, sorting?: any) => {
      const params = buildParams(filters, undefined, sorting);
      return callApi('listTrashIds', params);
    },

    onEntitySave: async (entity: T, mode: "create" | "edit") => {
      const action = mode === "create" ? "create" : "update";
      // Ensure we're only sending the entity data, not wrapped in read/write
      const cleanEntity = typeof entity === 'object' && entity !== null && 'write' in entity 
        ? (entity as any).write 
        : entity;
      return callApi(action, cleanEntity);
    },

    onEntityDelete: async (entity: T) => {
      const primaryKeyField = options?.primaryKey || 'id';
      const primaryKeyValue = (entity as any)[primaryKeyField];
      return callApi('delete', { [primaryKeyField]: primaryKeyValue });
    },

    onBulkDelete: async (ids: (string | number)[]) => {
      return callApi('bulkDelete', { ids });
    },

    onEntityRestore: async (entity: T) => {
      const primaryKeyField = options?.primaryKey || 'id';
      const primaryKeyValue = (entity as any)[primaryKeyField];
      return callApi('restore', { [primaryKeyField]: primaryKeyValue });
    },

    onBulkRestore: async (ids: (string | number)[]) => {
      return callApi('bulkRestore', { ids });
    },

    // State management functions
    onStoreState: async (state: ECrudState, ttl?: number) => {
      const result = await callApi('storeState', { state, ttl });
      return result.hash;
    },

    onGetState: async (hash: string) => {
      try {
        return await callApi('getState', { hash });
      } catch (error) {
        // Return null if state not found or expired
        return null;
      }
    },

    onUpdateState: async (hash: string, state: ECrudState) => {
      const result = await callApi('updateState', { hash, state });
      return result.hash;
    },

    // Smart breadcrumb configuration
    breadcrumbConfig: {
      basePath: options?.breadcrumbConfig?.basePath || [],
      entityNameField: options?.breadcrumbConfig?.entityNameField || 'name',
      renderNameLabel: options?.breadcrumbConfig?.renderNameLabel
    }
  };
};

export const crudNavigate = async <T extends FlexibleEntity>(
  apiFunction: (params: any) => Promise<{ success: boolean; data?: any; message?: any; status?: any }>,
  options: CrudNavigateOptions
) => {
  const {
    view = 'form',
    formMode = 'create',
    defaultData = {},
    filters = {},
    selectedEntityId = null,
    activeTab,
    baseUrl,
    navigate
  } = options;

  // Create the CRUD state
  const state: ECrudState = {
    view,
    formMode,
    filters,
    sorting: {
      field: null,
      direction: null
    },
    pagination: {
      page: 1,
      pageSize: 10
    },
    showTrash: false,
    selectedEntityId,
    activeTab
  };

  // Use the CRUD handlers to store state
  const crudHandlers = useCrud<T>(apiFunction);
  
  try {
    // Store the main state
    const stateHash = await crudHandlers.onStoreState(state);
    
    // Store default data separately if provided
    let defaultDataHash = null;
    if (Object.keys(defaultData).length > 0) {
      const defaultDataResult = await apiFunction({
        action: 'storeState',
        state: { defaultData },
        ttl: 3600 // 1 hour TTL for default data
      });
      if (defaultDataResult.success) {
        defaultDataHash = defaultDataResult.data.hash;
      }
    }

    // Construct the navigation URL
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('state', stateHash);
    if (defaultDataHash) {
      url.searchParams.set('defaultData', defaultDataHash);
    }

    // Navigate to the URL
    navigate(url.pathname + url.search);
    
    return { stateHash, defaultDataHash };
  } catch (error) {
    console.error('Failed to navigate with CRUD state:', error);
    // Fallback navigation without state
    navigate(baseUrl);
    throw error;
  }
};