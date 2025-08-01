import type { RelationComboBoxOption } from "@/components/ui/relation-combobox";
import type { ReactNode } from "react";
import type { EFieldType } from "../eform/efield";
import type { FilterConfig, FilterPreset } from "../elist/efilter";

export interface BaseEntity {
  id: string | number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Use BaseEntity as the standard entity type for ECrud
export type FlexibleEntity = BaseEntity;

// Smart relation config that automatically infers types from model name
// Usage: Just specify the model and TypeScript will handle the rest
// relationConfig: {
//   type: "model",
//   model: "customer_address",
//   labelFields: ["address", "city", "province"], // Fields for backend to load
//   renderLabel: (item) => `${item.address}, ${item.city} - ${item.province}`, // Function to compose display label
//   filters: { deleted_at: null }, // Auto-typed for the model
//   include: ["user", "city"] // Auto-typed relations
// }
export interface ModelRelationConfig {
  type: "model";
  model: string;
  labelFields: string[]; // Fields to load from backend (supports dot notation)
  renderLabel: (item: any) => string; // Function to compose the display label
  filters?: Record<string, any>;
  include?: string[];
  pageSize?: number; // Default: 100
  enableSearch?: boolean; // Default: true
  joinTable?: {
    model: string;
    parentField: string;
    childField: string;
  };
}

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

export interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (args: { value: any; entity: T; isSelected?: boolean }) => ReactNode;
  relationConfig?: ModelRelationConfig; // For relation columns that need to load and display related data
  className?: string;
  hidden?: boolean;
  minWidth?: string | number;
  maxWidth?: string | number;
  noWrap?: boolean;
  ellipsis?: boolean;
  hiddenOnMobile?: boolean;
}

export interface FormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: EFieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string | boolean; label: string; description?: string }[];
  validation?: (value: any) => string | null;
  maxLength?: number;
  width?: "1/2" | "1/3" | "2/3" | "1/4" | "3/4" | "full";
  defaultValue?: any;
  hidden?: boolean | ((data: T) => boolean);
  disabled?: boolean | ((data: T) => boolean);
  section?: string;
  multiple?: boolean;
  fileUploadConfig?: {
    accept?: string;
    maxFiles?: number;
    maxSize?: number;
  };
  relationConfig?: // Simple model relation (uses parent entity) - can be extended with Prisma types
  | ModelRelationConfig
    // Simple API endpoint relation
    | {
        type: "api";
        endpoint: string; // API endpoint to load options
        labelFields: string[]; // Fields to load from backend
        renderLabel?: (item: any) => string; // Function to compose display label
        valueField?: string; // Default: "id"
        searchField?: string; // Field to search on
        pageSize?: number; // Default: 100
        enableSearch?: boolean; // Default: true
      }
    // Advanced custom relation (current format)
    | {
        type: "custom";
        loadOptions: (params: {
          entity?: T;
          search?: string;
          page?: number;
          pageSize?: number;
        }) => Promise<{
          data: RelationComboBoxOption[];
          total: number;
          hasMore: boolean;
        }>;
        resolve?: (params: {
          entity?: T;
          value: string | number;
          options: RelationComboBoxOption[];
        }) => RelationComboBoxOption | null;
        pageSize?: number; // Default: 100
        enableSearch?: boolean; // Default: true
      };
  // Custom component support for type: "custom"
  customComponent?: React.ComponentType<{
    value: any;
    onChange: (value: any) => void;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    name: string;
    [key: string]: any;
  }>;
  customProps?: Record<string, any>;
}

export interface APIConfig<T> {
  endpoints: {
    list: string | ((filters: any) => string);
    get: string | ((id: string) => string);
    create: string;
    update: string | ((id: string) => string);
    delete: string | ((id: string) => string);
  };
  headers?: () => Record<string, string>;
  transformRequest?: (data: T) => any;
  transformResponse?: (data: any) => T;
}

export interface NestedECrudConfig<
  TParent extends FlexibleEntity,
  TNested extends FlexibleEntity
> {
  title: string;
  config: CRUDConfig<TNested>;
  parentField: keyof TParent;
  nestedParentField: keyof TNested;
  model: string; // The nested model name (e.g., "customer_address")
  position?: "tab" | "section";
  showInForm?: boolean | ((data: TParent) => boolean);
  showInDetail?: boolean | ((data: TParent) => boolean);
  // Layout configuration for nested ECrud
  layout?: "default" | "side-by-side";
  sideWidth?: {
    left?: string;
    right?: string;
  };
  // Optional custom handlers for advanced use cases
  onLoadNestedData?: (
    parentId: string | number
  ) => Promise<{ data: TNested[]; total: number }>;
  onSaveNested?: (
    parentId: string | number,
    entity: TNested,
    mode: "create" | "edit"
  ) => Promise<TNested>;
  onDeleteNested?: (
    parentId: string | number,
    entity: TNested
  ) => Promise<void>;
  onEntityRestore?: (
    entity: TNested,
    apiFunction: any,
    parentId: string | number
  ) => Promise<any>;
  customListRender?: (props: {
    parentId: string | number;
    entities: TNested[];
    loading: boolean;
    onRefresh: () => void;
  }) => React.ReactNode;
  customFormRenderer?: (props: {
    entity: TNested | null;
    formMode: "create" | "edit" | null;
    loading: boolean;
    onSave: (formData: any, returnToList?: boolean) => void | Promise<void>;
    onCancel: () => void;
    onDelete?: (entity: TNested) => Promise<void>;
    breadcrumbs: BreadcrumbItem[];
    onBreadcrumbClick: (url: string) => void;
    OriginalForm: React.ForwardRefExoticComponent<any>;
  }) => React.ReactNode;
  customActions?: {
    list?: (props: {
      entity: TNested;
      entities: TNested[];
      selectedIds: (string | number)[];
      actions: {
        refresh: () => void;
        create: () => void;
        edit: (entity: TNested) => void;
        delete: (entity: TNested) => void;
        view: (entity: TNested) => void;
        bulkDelete: (ids: (string | number)[]) => void;
      };
    }) => React.ReactNode;

    form?: (props: {
      entity: TNested;
      formData: any;
      actions: {
        save: (data: any) => void;
        cancel: () => void;
        delete: (entity: TNested) => void;
      };
    }) => React.ReactNode;

    detail?: (props: {
      entity: TNested;
      actions: {
        edit: (entity: TNested) => void;
        delete: (entity: TNested) => void;
      };
    }) => React.ReactNode;
  };
}

export interface CRUDConfig<T extends FlexibleEntity> {
  entityName: string;
  entityNamePlural?: string;
  api?: APIConfig<T>;
  columns: ColumnConfig<T>[];
  filters: FilterConfig[];
  formFields:
    | FormFieldConfig<T>[]
    | ((state: {
        showTrash: boolean;
        formMode: "create" | "edit" | null;
      }) => FormFieldConfig<T>[]);
  actions?: {
    list?: {
      // Data management
      create?: boolean;
      search?: boolean;
      filter?: boolean;
      sort?: boolean;
      pagination?: boolean;
      refresh?: boolean;

      // Item actions
      view?: boolean;
      edit?: boolean;
      delete?: boolean;

      // Bulk actions
      bulkSelect?: boolean;
      bulkDelete?: boolean;

      // Trash management (only shown when softDelete.enabled = true)
      viewTrash?: boolean; // Show button to view deleted items
      restore?: boolean; // Restore individual items
      bulkRestore?: boolean; // Restore multiple items
    };

    form?: {
      save?: boolean;
      cancel?: boolean;
      delete?: boolean; // Delete button in form
      prevNextLink?: boolean; // Previous/next navigation arrows
    };

    detail?: {
      edit?: boolean;
      delete?: boolean;
      prevNextLink?: boolean; // Previous/next navigation arrows
    };
  };
  softDelete?: {
    enabled: boolean;
    field: string;
  };
  nested?: NestedECrudConfig<T, any>[];
  breadcrumbExtra?: (entity: T) => ReactNode;
  renderRow?: (args: {
    entity: T;
    isSelected?: boolean;
    onClick?: () => void;
  }) => ReactNode;
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    defaultOpen?: boolean;
  }>;
}

export interface ECrudProps<T extends FlexibleEntity> {
  config: CRUDConfig<T>;
  data?: T[];
  onDataChange?: (data: T[]) => void;
  onEntitySelect?: (entity: T | null) => void;
  onEntitySave?: (entity: T, mode: "create" | "edit") => Promise<T>;
  onEntityDelete?: (entity: T) => Promise<void>;
  onBulkDelete?: (ids: (string | number)[]) => Promise<void>;
  onLoadData?: (
    filters: any,
    pagination: any,
    sorting?: any
  ) => Promise<{ data: T[]; total: number }>;
  onLoadTrashData?: (
    filters: any,
    pagination: any,
    sorting?: any
  ) => Promise<{ data: T[]; total: number }>;
  onLoadAllIds?: (filters: any, sorting?: any) => Promise<(string | number)[]>;
  onLoadAllTrashIds?: (
    filters: any,
    sorting?: any
  ) => Promise<(string | number)[]>;
  onEntityRestore?: (entity: T) => Promise<void>;
  onBulkRestore?: (ids: (string | number)[]) => Promise<void>;
  onStoreState?: (state: any) => Promise<string>;
  onGetState?: (hash: string) => Promise<any | null>;
  onUpdateState?: (hash: string, state: any) => Promise<string>;
  apiFunction?: (params: any) => Promise<{
    success: boolean;
    data?: any;
    total?: number;
    message?: any;
    status?: any;
  }>; // For simple relation configs
  className?: string;
  layout?: "default" | "side-by-side" | "modal";
  sideWidth?: Partial<{
    left: string | number;
    right: string | number;
  }>;
  emptySelectionMessage?: string;
  filterPresets?: FilterPreset[];
  onSaveFilterPreset?: (preset: FilterPreset) => void;
  urlState?: {
    baseUrl: string;
  };
  breadcrumbs?:
    | BreadcrumbItem[]
    | ((state: {
        view: "list" | "form" | "detail";
        formMode: "create" | "edit" | null;
        entityName: string;
        selectedEntity?: any;
        showTrash: boolean;
      }) => BreadcrumbItem[]);
  breadcrumbConfig?: {
    basePath?: BreadcrumbItem[];
    entityNameField?: string;
    renderNameLabel?: (entity: T) => Promise<string>;
  };
  breadcrumbExtra?: (entity: T) => ReactNode;
  customActions?: {
    list?: (props: {
      entity: T;
      entities: T[];
      selectedIds: (string | number)[];
      actions: {
        refresh: () => void;
        create: () => void;
        edit: (entity: T) => void;
        delete: (entity: T) => void;
        view: (entity: T) => void;
        bulkDelete: (ids: (string | number)[]) => void;
      };
    }) => React.ReactNode;

    form?: (props: {
      entity: T;
      formData: any;
      actions: {
        save: (data: any) => void;
        cancel: () => void;
        delete: (entity: T) => void;
      };
    }) => React.ReactNode;

    detail?: (props: {
      entity: T;
      actions: {
        edit: (entity: T) => void;
        delete: (entity: T) => void;
      };
    }) => React.ReactNode;
  };
  customFormRenderer?: (props: {
    entity: T | null;
    formMode: "create" | "edit" | null;
    loading: boolean;
    onSave: (formData: any, returnToList?: boolean) => void | Promise<void>;
    onCancel: () => void;
    onDelete?: (entity: T) => Promise<void>;
    breadcrumbs: BreadcrumbItem[];
    onBreadcrumbClick: (url: string) => void;
    OriginalForm: React.ForwardRefExoticComponent<any>;
  }) => React.ReactNode;
  customListRender?: (props: {
    entities: T[];
    loading: boolean;
    pagination: any;
    sorting: any;
    filters: any;
    onEntitySelect: (entity: T) => void;
    onEntityCreate: () => void;
    onEntityDelete: (entity: T) => void;
    onPageChange: (page: number) => void;
    onSort: (field: keyof T, direction: "asc" | "desc") => void;
    onFilterApply: (filters: any) => void;
    onRefresh: () => void;
    breadcrumbs: BreadcrumbItem[];
    onBreadcrumbClick: (url: string) => void;
  }) => React.ReactNode;
  api?: any;
}
