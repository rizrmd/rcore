import { Breadcrumbs } from "@/components/esensi/navigation/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { RelationComboBoxOption } from "@/components/ui/relation-combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { css } from "goober";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { EForm } from "../../eform/eform";
import { ECrud } from "../ecrud";
import type {
  BaseEntity,
  BreadcrumbItem,
  CRUDConfig,
  FormFieldConfig,
} from "../types";

// Props interface for OriginalForm component
export interface OriginalFormProps {
  showHeader?: boolean;
  showSubmit?: boolean;
  showReturnCheckbox?: boolean;
  className?: string;
  onSave?: (formData: any, returnToList?: boolean) => Promise<void>;
  ref?: React.Ref<HTMLFormElement>;
}

// Utility function to convert simple relation configs to full loadOptions/resolve
export const createRelationHandlers = <T extends BaseEntity>(
  relationConfig: FormFieldConfig<T>["relationConfig"],
  apiFunction?: any // Should be passed from ECrud props
) => {
  if (!relationConfig) return null;

  const defaultPageSize = relationConfig.pageSize || 100;
  const defaultEnableSearch = relationConfig.enableSearch !== false;

  if (relationConfig.type === "model") {
    const { model, labelFields, renderLabel, filters, include } =
      relationConfig;

    return {
      loadOptions: async ({
        entity,
        search,
        page = 1,
        pageSize = defaultPageSize,
      }: any) => {
        if (!entity?.id || !apiFunction) {
          return { data: [], total: 0, hasMore: false };
        }

        try {
          const params: any = {
            action: "nested_list",
            nested_model: model,
            parent_id: entity.id.toString(),
            search: search || "",
            page,
            limit: pageSize,
            // Include labelFields so backend knows what to load
            fields: labelFields.join(","),
          };

          // Add additional filters if specified
          if (filters) {
            Object.assign(params, filters);
          }

          // Add include for related models if specified
          if (include && include.length > 0) {
            params.include = include.join(",");
          }

          const response = await apiFunction(params);

          if (response.success && response.data) {
            const options = response.data.map((item: any) => ({
              value: String(item.id),
              label: renderLabel(item), // Use the custom render function
            }));

            return {
              data: options,
              total: response.total || options.length,
              hasMore: page * pageSize < (response.total || options.length),
            };
          }
        } catch (error) {
          console.error(`Failed to load ${model} options:`, error);
        }

        return { data: [], total: 0, hasMore: false };
      },

      resolve: ({ value, options }: any) => {
        if (!value) return null;
        const found = options?.find(
          (opt: any) => String(opt.value) === String(value)
        );
        if (found) {
          return { value: found.value, label: found.label };
        }
        return null;
      },

      pageSize: defaultPageSize,
      enableSearch: defaultEnableSearch,
    };
  }

  if (relationConfig.type === "api") {
    const {
      endpoint,
      labelFields,
      renderLabel,
      valueField = "id",
      searchField = labelFields[0],
    } = relationConfig;

    return {
      loadOptions: async ({
        search,
        page = 1,
        pageSize = defaultPageSize,
      }: any) => {
        if (!apiFunction) {
          return { data: [], total: 0, hasMore: false };
        }

        try {
          const params: any = {
            page,
            limit: pageSize,
            fields: labelFields.join(","), // Include labelFields so backend knows what to load
          };
          if (search && searchField) {
            params[searchField] = search;
          }

          const response = await apiFunction({
            action: endpoint,
            ...params,
          });

          if (response.success && response.data) {
            const options = response.data.map((item: any) => ({
              value: String(item[valueField]),
              label: renderLabel
                ? renderLabel(item)
                : labelFields
                    .map((field) => item[field])
                    .filter(Boolean)
                    .join(", "),
            }));

            return {
              data: options,
              total: response.total || options.length,
              hasMore: page * pageSize < (response.total || options.length),
            };
          }
        } catch (error) {
          console.error(`Failed to load ${endpoint} options:`, error);
        }

        return { data: [], total: 0, hasMore: false };
      },

      resolve: ({ value, options }: any) => {
        if (!value) return null;
        const found = options?.find(
          (opt: any) => String(opt.value) === String(value)
        );
        if (found) {
          return { value: found.value, label: found.label };
        }
        return null;
      },

      pageSize: defaultPageSize,
      enableSearch: defaultEnableSearch,
    };
  }

  if (relationConfig.type === "custom") {
    return {
      loadOptions: relationConfig.loadOptions,
      resolve: relationConfig.resolve,
      pageSize: relationConfig.pageSize || defaultPageSize,
      enableSearch: relationConfig.enableSearch !== false,
    };
  }

  return null;
};

// Internal component for rendering form fields with sections
interface FormFieldsRendererProps<T extends BaseEntity> {
  fields: FormFieldConfig<T>[];
  Field: any;
  formData: any;
  relationOptions: Record<string, RelationComboBoxOption[]>;
  relationOptionsLoading: Record<string, boolean>;
  apiFunction?: any;
  selectedEntity?: T | null;
  loading: boolean;
  returnToList: boolean;
  onReturnToListChange: (value: boolean) => void;
  getWidthClass: (width?: string) => string;
  showReturnCheckbox?: boolean;
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    defaultOpen?: boolean;
  }>;
  showSubmit?: boolean;
  config?: any;
  formMode?: "create" | "edit" | null;
  onEntityDelete?: (entity: T) => Promise<void>;
}

const FormFieldsRenderer = <T extends BaseEntity>({
  fields,
  Field,
  formData,
  relationOptions,
  relationOptionsLoading,
  apiFunction,
  selectedEntity,
  loading,
  returnToList,
  onReturnToListChange,
  getWidthClass,
  showReturnCheckbox = true,
  sections,
  showSubmit = true,
  config,
  formMode,
  onEntityDelete,
}: FormFieldsRendererProps<T>) => {
  const filteredFields = fields.filter((field) => {
    if (typeof field.hidden === "function") {
      return !field.hidden(formData as any);
    }
    return !field.hidden;
  });

  // Group fields by section
  const fieldsBySection = filteredFields.reduce((acc, field) => {
    const sectionName = field.section || "main";
    if (!acc[sectionName]) {
      acc[sectionName] = [];
    }
    acc[sectionName].push(field);
    return acc;
  }, {} as Record<string, typeof filteredFields>);

  const sectionKeys = Object.keys(fieldsBySection);

  // State to track collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => {
      const collapsed = new Set<string>();
      sections?.forEach((section) => {
        if (section.defaultOpen === false) {
          collapsed.add(section.id);
        }
      });
      return collapsed;
    }
  );

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getSectionInfo = (sectionId: string) => {
    const sectionConfig = sections?.find((s) => s.id === sectionId);
    return (
      sectionConfig || {
        id: sectionId,
        title: sectionId.replace(/([A-Z])/g, " $1").trim(),
        defaultOpen: true,
      }
    );
  };

  const renderField = (field: any) => {
    const isDisabled =
      typeof field.disabled === "function"
        ? field.disabled(formData as any)
        : field.disabled;

    return (
      <div
        key={field.name as string}
        className={cn(
          field.type === "hidden" ? "hidden" : getWidthClass(field.width)
        )}
      >
        <Field
          name={field.name as string}
          label={field.label}
          type={field.type as any}
          required={field.required}
          disabled={isDisabled}
          input={
            field.maxLength
              ? { maxLength: field.maxLength, placeholder: field.placeholder }
              : field.placeholder
              ? { placeholder: field.placeholder }
              : undefined
          }
          options={
            field.type === "relation"
              ? relationOptions[field.name as string] || []
              : field.options
          }
          relationLoading={
            field.type === "relation"
              ? relationOptionsLoading[field.name as string] || false
              : false
          }
          relationConfig={
            field.type === "relation" && field.relationConfig
              ? (() => {
                  const handlers = createRelationHandlers(
                    field.relationConfig,
                    apiFunction
                  );
                  return handlers
                    ? {
                        pageSize: handlers.pageSize,
                        enableSearch: handlers.enableSearch,
                        loadOptions: (params: any) =>
                          handlers.loadOptions({
                            ...params,
                            entity: selectedEntity || undefined,
                          }),
                        resolve: handlers.resolve,
                      }
                    : undefined;
                })()
              : undefined
          }
          fileUploadConfig={field.fileUploadConfig}
          customComponent={field.customComponent}
          customProps={field.customProps}
        />
      </div>
    );
  };

  return (
    <div className="max-w-[600px] mx-auto">
      {sectionKeys.length === 1 && sectionKeys[0] === "main" ? (
        <div className="grid grid-cols-12 gap-4">
          {fieldsBySection.main.map(renderField)}
        </div>
      ) : (
        sectionKeys.map((sectionName) => {
          const sectionInfo = getSectionInfo(sectionName);
          const isCollapsed = collapsedSections.has(sectionName);
          return (
            <div key={sectionName} className="">
              {sectionName !== "main" && (
                <div
                  onClick={() => toggleSection(sectionName)}
                  className="flex items-center cursor-pointer group select-none -mx-2 px-2 lg:-mx-4 lg:px-4 pt-4 border-b"
                >
                  <ChevronRight
                    className={cn(
                      "-ml-2 mr-2 mb-1 transition-transform duration-200 group-hover:text-blue-500",
                      !isCollapsed && "rotate-90"
                    )}
                    size={20}
                    strokeWidth={1}
                  />
                  <div className="flex flex-col gap-2 justify-between ">
                    <h3 className="text-lg font-medium group-hover:text-blue-800">
                      {sectionInfo.title}
                    </h3>
                    {sectionInfo.description && (
                      <div className="text-sm text-muted-foreground -mt-2 mb-2 group-hover:text-blue-800/50">
                        {sectionInfo.description}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "transition-all duration-200 overflow-hidden pl-4",
                  sectionName !== "main" && isCollapsed && "max-h-0",
                  sectionName !== "main" && !isCollapsed && "max-h-[2000px] pt-4 pb-4"
                )}
              >
                <div
                  className={cn(
                    "grid grid-cols-12 gap-4",
                    css`
                      > div {
                        margin-top: 10px;
                        padding-left: 5px;
                        padding-right: 5px;
                        padding-bottom: 5px;
                      }
                    `
                  )}
                >
                  {fieldsBySection[sectionName].map(renderField)}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div className="flex justify-between items-center gap-2 mt-6 select-none">
        <div className="flex items-center gap-3 pl-5">
          {formMode === "edit" &&
            config?.actions?.form?.delete === true &&
            selectedEntity &&
            onEntityDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onEntityDelete(selectedEntity)}
                disabled={loading}
              >
                Hapus
              </Button>
            )}
        </div>
        <div className="flex items-center gap-3 pr-2">
          {showSubmit !== false && (
            <Button type="submit" disabled={loading}>
              {loading && <RefreshCw size={16} className="mr-2 animate-spin" />}
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          )}
          {showReturnCheckbox && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="return-to-list"
                checked={returnToList}
                className="ml-2"
                onCheckedChange={onReturnToListChange}
              />
              <div className="text-sm pl-0 p-2 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Kembali setelah simpan
              </div>
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

interface ECrudFormViewProps<T extends BaseEntity> {
  config: CRUDConfig<T>;
  state: any; // The valtio proxy state
  breadcrumbs: BreadcrumbItem[];
  nestedRefreshKey: number;
  relationOptions: Record<string, RelationComboBoxOption[]>;
  relationOptionsLoading: Record<string, boolean>;
  onSave: (formData: any, returnToList?: boolean) => void;
  onCancel: () => void;
  onEntityDelete?: (entity: T) => Promise<void>;
  onBreadcrumbClick: (url: string) => void;
  onTabChange: (tab: string) => void;
  onNavigateToPrevious: () => void;
  onNavigateToNext: () => void;
  navigationInfo: {
    currentPosition: number;
    totalCount: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  urlState?: { baseUrl: string };
  apiFunction?: any; // API function for simple relation configs
  customFormRenderer?: (props: {
    entity: T | null;
    formMode: "create" | "edit" | null;
    loading: boolean;
    onSave: (formData: any, returnToList?: boolean) => void;
    onCancel: () => void;
    onDelete?: (entity: T) => Promise<void>;
    breadcrumbs: BreadcrumbItem[];
    onBreadcrumbClick: (url: string) => void;
    OriginalForm: React.ForwardRefExoticComponent<
      OriginalFormProps & React.RefAttributes<HTMLFormElement>
    >;
  }) => React.ReactNode;
  nestedHandlers?: {
    onLoadNestedData: (
      parentId: string | number,
      nestedConfig: any,
      filters?: any,
      pagination?: { page: number; limit: number },
      sorting?: { field: string; order: "asc" | "desc" }
    ) => Promise<{ data: any[]; total: number }>;
    onSaveNested: (
      parentId: string | number,
      entity: any,
      mode: "create" | "edit",
      nestedConfig: any
    ) => Promise<any>;
    onDeleteNested: (
      parentId: string | number,
      entity: any,
      nestedConfig: any
    ) => Promise<void>;
  };
}

export const ECrudFormView = <T extends BaseEntity>({
  config,
  state,
  breadcrumbs,
  nestedRefreshKey,
  relationOptions,
  relationOptionsLoading,
  onSave,
  onCancel,
  onEntityDelete,
  onBreadcrumbClick,
  onTabChange,
  onNavigateToPrevious,
  onNavigateToNext,
  navigationInfo,
  urlState,
  apiFunction,
  customFormRenderer,
  nestedHandlers,
}: ECrudFormViewProps<T>) => {
  const read = useSnapshot(state);
  const [headerVisible, setHeaderVisible] = useState(true);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const scrollDistanceRef = useRef(0);

  // Handle scroll events to hide/show header in mobile view
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      const isMobile = window.innerWidth < 768; // Tailwind md breakpoint

      if (isMobile) {
        const scrollDelta = scrollTop - lastScrollTopRef.current;

        // Ignore very small movements to prevent flickering
        if (Math.abs(scrollDelta) < 2) {
          return;
        }

        // Check if at top or bottom to prevent flickering
        const isAtTop = scrollTop <= 10;
        const isAtBottom =
          scrollTop >=
          scrollElement.scrollHeight - scrollElement.clientHeight - 10;

        if (isAtTop) {
          setHeaderVisible(true);
          scrollDistanceRef.current = 0;
        } else if (isAtBottom) {
          // Don't change header visibility when at bottom to prevent flickering
          return;
        } else {
          // Normal scroll handling
          if (scrollDelta > 0) {
            // Scrolling down
            scrollDistanceRef.current += scrollDelta;
            if (scrollDistanceRef.current > 50) {
              setHeaderVisible(false);
            }
          } else {
            // Scrolling up
            setHeaderVisible(true);
            scrollDistanceRef.current = 0;
          }
        }

        lastScrollTopRef.current = scrollTop;
      } else {
        setHeaderVisible(true);
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);

    // Also listen for window resize to handle mobile/desktop transitions
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        setHeaderVisible(true);
      } else {
        handleScroll();
      }
    };

    window.addEventListener("resize", handleResize);

    // Initial check
    handleScroll();

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [scrollElementRef.current]);

  const getFormFields = (): FormFieldConfig<T>[] => {
    if (typeof config.formFields === "function") {
      return config.formFields({
        showTrash: read.showTrash,
        formMode: read.formMode,
      });
    }
    return config.formFields;
  };

  const getFormInitialData = () => {
    if (read.formMode === "edit" && read.selectedEntity) {
      return { ...read.selectedEntity };
    }

    // For edit mode, wait for selectedEntity to load instead of returning empty structure
    // This prevents image fields from initializing with empty values and losing reactivity
    if (read.formMode === "edit" && !read.selectedEntity) {
      // Return null to indicate data is still loading, preventing form render
      return null;
    }

    const initialData = {} as any;
    getFormFields().forEach((field) => {
      if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      } else if (field.type === "checkbox") {
        initialData[field.name] = false;
      } else if (field.type === "number") {
        initialData[field.name] = null;
      } else {
        initialData[field.name] = "";
      }
    });

    // Merge defaultData from URL if available
    if (read.formMode === "create" && read.defaultData) {
      Object.assign(initialData, read.defaultData);
    }

    return initialData;
  };

  const getWidthClass = (width?: string) => {
    switch (width) {
      case "1/2":
        return "col-span-12 md:col-span-6";
      case "1/3":
        return "col-span-12 md:col-span-4";
      case "2/3":
        return "col-span-12 md:col-span-8";
      case "1/4":
        return "col-span-12 sm:col-span-6 lg:col-span-3";
      case "3/4":
        return "col-span-12 lg:col-span-9";
      case "full":
      default:
        return "col-span-12";
    }
  };

  // localStorage key for "return to list" preference
  // Use a unique key based on the entity name and whether it's nested
  const isNested = !breadcrumbs || breadcrumbs.length === 0;
  const RETURN_TO_LIST_KEY = isNested
    ? `ecrud-return-to-list-nested-${config.entityName}`
    : `ecrud-return-to-list-${config.entityName}`;

  const shouldShowInForm = (nestedConfig: any, entityData: any) => {
    if (nestedConfig.showInForm === false) return false;
    if (typeof nestedConfig.showInForm === "function") {
      return nestedConfig.showInForm(entityData);
    }
    return nestedConfig.showInForm !== false;
  };

  const hasNestedTabs =
    config.nested &&
    read.formMode === "edit" &&
    read.selectedEntity &&
    config.nested.filter((n) => shouldShowInForm(n, read.selectedEntity))
      .length > 0;

  // State for "return to list" checkbox
  const [returnToList, setReturnToList] = useState(() => {
    const stored = localStorage.getItem(RETURN_TO_LIST_KEY);
    // If there are tabs and we're creating a new entry, default to false (stay on form)
    // Otherwise use stored preference or default to true
    if (hasNestedTabs && read.formMode === "create") {
      return false;
    }

    return stored ? JSON.parse(stored) : true; // default to true
  });

  // Save checkbox state to localStorage
  useEffect(() => {
    localStorage.setItem(RETURN_TO_LIST_KEY, JSON.stringify(returnToList));
  }, [returnToList]);

  // Create the original form component that can be reused
  const OriginalForm = forwardRef<HTMLFormElement, OriginalFormProps>(
    (
      {
        showHeader = true,
        showSubmit = true,
        showReturnCheckbox = true,
        className = "",
        onSave: customOnSave,
      },
      formRef
    ) => {
      if (showHeader) {
        // Return full form with header and card structure
        return (
          <>
            <CardHeader
              className={cn(
                "transition-all duration-300",
                !headerVisible && "py-0"
              )}
            >
              <div
                className={cn(
                  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-all duration-300 ease-in-out",
                  !headerVisible && "absolute inset-0 overflow-hidden h-0"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 md:grow-0 grow">
                  {breadcrumbs.length > 0 ? (
                    <div className="flex items-center gap-2 min-w-0 flex-1 md:justify-start justify-between">
                      <Breadcrumbs
                        data={breadcrumbs}
                        onClick={onBreadcrumbClick}
                      />
                      {config.breadcrumbExtra &&
                        getBreadcrumbExtraEntity() &&
                        config.breadcrumbExtra(getBreadcrumbExtraEntity()!)}
                    </div>
                  ) : (
                    <CardTitle className="flex items-center gap-2 min-w-0 flex-1 justify-between md:justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={read.loading.form}
                        className="flex-shrink-0"
                      >
                        <ArrowLeft size={16} />
                      </Button>
                      <span className="truncate">
                        {read.formMode === "create"
                          ? `Create ${config.entityName}`
                          : `Edit ${config.entityName}`}
                      </span>
                      {config.breadcrumbExtra &&
                        getBreadcrumbExtraEntity() &&
                        config.breadcrumbExtra(getBreadcrumbExtraEntity()!)}
                    </CardTitle>
                  )}
                </div>
                {read.formMode === "edit" && navigationInfo.totalCount > 1 && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      Data ke{" "}
                      <Badge variant={"outline"}>
                        {navigationInfo.currentPosition}
                      </Badge>{" "}
                      dari{" "}
                      <Badge variant={"outline"}>
                        {navigationInfo.totalCount}
                      </Badge>{" "}
                    </span>
                    <span className="text-sm text-muted-foreground sm:hidden">
                      Data ke {navigationInfo.currentPosition} dari{" "}
                      {navigationInfo.totalCount}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onNavigateToPrevious}
                        disabled={!navigationInfo.hasPrev}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onNavigateToNext}
                        disabled={!navigationInfo.hasNext}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative flex-1 flex">
              {read.loading.form && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading...
                  </div>
                </div>
              )}
              <div
                className="overflow-auto relative flex-1 -mx-3 border-t"
                ref={scrollElementRef}
              >
                <div className="flex flex-col absolute inset-0 px-3 pt-4">
                  {getFormInitialData() ? (
                    <EForm
                      ref={formRef}
                      key={`form-${read.selectedEntity?.id || "new"}`}
                      data={getFormInitialData()!}
                      onSubmit={({ write: formData }) =>
                        customOnSave
                          ? customOnSave(formData, returnToList)
                          : onSave(formData, returnToList)
                      }
                    >
                      {({ Field, read: formData }) => (
                        <FormFieldsRenderer
                          fields={getFormFields()}
                          Field={Field}
                          formData={formData}
                          relationOptions={relationOptions}
                          relationOptionsLoading={relationOptionsLoading}
                          apiFunction={apiFunction}
                          selectedEntity={read.selectedEntity}
                          loading={read.loading.form}
                          returnToList={returnToList}
                          onReturnToListChange={setReturnToList}
                          getWidthClass={getWidthClass}
                          showReturnCheckbox={showReturnCheckbox}
                          sections={config.sections}
                          showSubmit={showSubmit}
                          config={config}
                          formMode={read.formMode}
                          onEntityDelete={onEntityDelete}
                        />
                      )}
                    </EForm>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <RefreshCw size={16} className="animate-spin" />
                        Loading form data...
                      </div>
                    </div>
                  )}
                  <div className="pb-20"></div>
                </div>
              </div>
            </CardContent>
          </>
        );
      }

      // Return just the form content without header - optimized for tabs
      return (
        <div className={cn(className ? className : "relative h-full w-full")}>
          {read.loading.form && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw size={16} className="animate-spin" />
                Loading...
              </div>
            </div>
          )}
          <div className={"h-full overflow-auto p-4"}>
            {getFormInitialData() ? (
              <EForm
                ref={formRef}
                key={`form-${read.selectedEntity?.id || "new"}`}
                data={getFormInitialData()!}
                onSubmit={({ write: formData }) =>
                  customOnSave
                    ? customOnSave(formData, returnToList)
                    : onSave(formData, returnToList)
                }
              >
                {({ Field, read: formData }) => (
                  <FormFieldsRenderer
                    fields={getFormFields()}
                    Field={Field}
                    formData={formData}
                    relationOptions={relationOptions}
                    relationOptionsLoading={relationOptionsLoading}
                    apiFunction={apiFunction}
                    selectedEntity={read.selectedEntity}
                    loading={read.loading.form}
                    returnToList={returnToList}
                    onReturnToListChange={setReturnToList}
                    getWidthClass={getWidthClass}
                    showReturnCheckbox={showReturnCheckbox}
                    sections={config.sections}
                    showSubmit={showSubmit}
                    config={config}
                    formMode={read.formMode}
                    onEntityDelete={onEntityDelete}
                  />
                )}
              </EForm>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading form data...
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  );

  // Use custom form renderer if provided
  if (customFormRenderer) {
    return customFormRenderer({
      entity: read.selectedEntity ? ({ ...read.selectedEntity } as T) : null,
      formMode: read.formMode,
      loading: read.loading.form,
      onSave,
      onCancel,
      onDelete: onEntityDelete,
      breadcrumbs,
      onBreadcrumbClick,
      OriginalForm,
    });
  }

  const getBreadcrumbExtraEntity = (formData?: any) => {
    if (read.formMode === "edit" && read.selectedEntity) {
      return read.selectedEntity as T;
    }
    if (read.formMode === "create" && formData) {
      return formData as T;
    }
    if (read.formMode === "create") {
      const initialData = getFormInitialData();
      return initialData ? (initialData as T) : null;
    }
    return null;
  };

  return (
    <>
      <CardHeader
        className={cn("transition-all duration-300", !headerVisible && "py-0")}
      >
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-all duration-300 ease-in-out",
            !headerVisible && "absolute inset-0 overflow-hidden h-0"
          )}
        >
          <div className="flex items-center gap-2 min-w-0 md:grow-0 grow">
            {breadcrumbs.length > 0 ? (
              <div className="flex items-center gap-2 min-w-0 flex-1 md:justify-start justify-between">
                <Breadcrumbs data={breadcrumbs} onClick={onBreadcrumbClick} />
                {config.breadcrumbExtra &&
                  getBreadcrumbExtraEntity() &&
                  config.breadcrumbExtra(getBreadcrumbExtraEntity()!)}
              </div>
            ) : (
              <CardTitle className="flex items-center gap-2 min-w-0 flex-1 justify-between md:justify-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={read.loading.form}
                  className="flex-shrink-0"
                >
                  <ArrowLeft size={16} />
                </Button>
                <span className="truncate">
                  {read.formMode === "create"
                    ? `Create ${config.entityName}`
                    : `Edit ${config.entityName}`}
                </span>
                {config.breadcrumbExtra &&
                  getBreadcrumbExtraEntity() &&
                  config.breadcrumbExtra(getBreadcrumbExtraEntity()!)}
              </CardTitle>
            )}
          </div>
          {read.formMode === "edit" && navigationInfo.totalCount > 1 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Data ke{" "}
                <Badge variant={"outline"}>
                  {navigationInfo.currentPosition}
                </Badge>{" "}
                dari{" "}
                <Badge variant={"outline"}>{navigationInfo.totalCount}</Badge>{" "}
              </span>
              <span className="text-sm text-muted-foreground sm:hidden">
                Data ke {navigationInfo.currentPosition} dari{" "}
                {navigationInfo.totalCount}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToPrevious}
                  disabled={!navigationInfo.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToNext}
                  disabled={!navigationInfo.hasNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative flex-1 flex">
        {read.loading.form && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw size={16} className="animate-spin" />
              Loading...
            </div>
          </div>
        )}
        {hasNestedTabs ? (
          (() => {
            const nestedConfigs = config.nested!.filter((n) =>
              shouldShowInForm(n, read.selectedEntity)
            );
            const sectionConfigs = nestedConfigs.filter(
              (n) => n.position === "section"
            );
            const tabConfigs = nestedConfigs.filter(
              (n) => n.position !== "section"
            );

            if (sectionConfigs.length > 0) {
              return (
                <div className="flex flex-1 absolute inset-0">
                  <div
                    className="flex-1 flex px-4 overflow-auto border-r"
                    ref={scrollElementRef}
                  >
                    {getFormInitialData() ? (
                      <EForm
                        key={`form-${read.selectedEntity?.id || "new"}`}
                        className="inset-0 absolute px-4"
                        data={getFormInitialData()!}
                        onSubmit={({ write: formData }) =>
                          onSave(formData, returnToList)
                        }
                      >
                        {({ Field, read: formData }) => (
                          <div className="pb-20">
                            <FormFieldsRenderer
                              fields={getFormFields()}
                              Field={Field}
                              formData={formData}
                              relationOptions={relationOptions}
                              relationOptionsLoading={relationOptionsLoading}
                              apiFunction={apiFunction}
                              selectedEntity={read.selectedEntity}
                              loading={read.loading.form}
                              returnToList={returnToList}
                              onReturnToListChange={setReturnToList}
                              getWidthClass={getWidthClass}
                              showReturnCheckbox={true}
                              sections={config.sections}
                              config={config}
                              formMode={read.formMode}
                              onEntityDelete={onEntityDelete}
                            />
                          </div>
                        )}
                      </EForm>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <RefreshCw size={16} className="animate-spin" />
                          Loading form data...
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col">
                    {sectionConfigs.map((nestedConfig, index) => (
                      <div
                        key={`section-${index}`}
                        className="flex-1 flex px-4 py-4"
                      >
                        <div className="w-full">
                          <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                            {nestedConfig.title}
                          </h3>
                          <ECrud
                            key={`nested-section-${index}-${read.selectedEntity?.id}-${nestedRefreshKey}`}
                            config={{
                              ...nestedConfig.config,
                              actions: {
                                ...nestedConfig.config.actions,
                                list: {
                                  ...nestedConfig.config.actions?.list,
                                  pagination:
                                    nestedConfig.config.actions?.list
                                      ?.pagination ?? false,
                                },
                              },
                            }}
                            breadcrumbs={[]}
                            layout={nestedConfig.layout}
                            sideWidth={nestedConfig.sideWidth}
                            customFormRenderer={nestedConfig.customFormRenderer}
                            customActions={nestedConfig.customActions}
                            urlState={{
                              baseUrl: `${
                                urlState?.baseUrl || ""
                              }/nested/${nestedConfig.title
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`,
                            }}
                            customListRender={
                              nestedConfig.customListRender
                                ? (props) =>
                                    nestedConfig.customListRender!({
                                      parentId: read.selectedEntity?.id!,
                                      entities: props.entities,
                                      loading: props.loading,
                                      onRefresh: props.onRefresh,
                                    })
                                : undefined
                            }
                            onLoadData={
                              nestedHandlers
                                ? async (filters, pagination, sorting) => {
                                    if (read.selectedEntity?.id) {
                                      return await nestedHandlers.onLoadNestedData(
                                        read.selectedEntity.id,
                                        nestedConfig,
                                        filters,
                                        pagination,
                                        sorting
                                      );
                                    }
                                    return { data: [], total: 0 };
                                  }
                                : undefined
                            }
                            onEntitySave={
                              nestedHandlers
                                ? async (entityData, mode) => {
                                    if (read.selectedEntity?.id) {
                                      return await nestedHandlers.onSaveNested(
                                        read.selectedEntity.id,
                                        entityData,
                                        mode,
                                        nestedConfig
                                      );
                                    }
                                    throw new Error(
                                      "Save handler not configured"
                                    );
                                  }
                                : undefined
                            }
                            onEntityDelete={
                              nestedHandlers
                                ? async (entityData) => {
                                    if (read.selectedEntity?.id) {
                                      return await nestedHandlers.onDeleteNested(
                                        read.selectedEntity.id,
                                        entityData,
                                        nestedConfig
                                      );
                                    }
                                    throw new Error(
                                      "Delete handler not configured"
                                    );
                                  }
                                : undefined
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              return (
                <Tabs
                  value={read.activeTab}
                  onValueChange={onTabChange}
                  className="w-full absolute inset-0 flex flex-1 flex-col"
                >
                  <TabsList
                    className={cn(!headerVisible && "rounded-t-xl border-t-0")}
                  >
                    <TabsTrigger value="main">
                      Detail {config.entityName}
                    </TabsTrigger>
                    {tabConfigs.map((nestedConfig, index) => (
                      <TabsTrigger
                        key={`tab-${index}`}
                        value={`nested-${index}`}
                      >
                        {nestedConfig.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent
                    value="main"
                    className="flex-1 flex px-4 overflow-auto relative"
                    ref={scrollElementRef}
                  >
                    {getFormInitialData() ? (
                      <EForm
                        key={`form-${read.selectedEntity?.id || "new"}`}
                        className="inset-0 absolute px-4"
                        data={getFormInitialData()!}
                        onSubmit={({ write: formData }) =>
                          onSave(formData, returnToList)
                        }
                      >
                        {({ Field, read: formData }) => (
                          <div className="pb-20">
                            <FormFieldsRenderer
                              fields={getFormFields()}
                              Field={Field}
                              formData={formData}
                              relationOptions={relationOptions}
                              relationOptionsLoading={relationOptionsLoading}
                              apiFunction={apiFunction}
                              selectedEntity={read.selectedEntity}
                              loading={read.loading.form}
                              returnToList={returnToList}
                              onReturnToListChange={setReturnToList}
                              getWidthClass={getWidthClass}
                              showReturnCheckbox={true}
                              sections={config.sections}
                              config={config}
                              formMode={read.formMode}
                              onEntityDelete={onEntityDelete}
                            />
                          </div>
                        )}
                      </EForm>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <RefreshCw size={16} className="animate-spin" />
                          Loading form data...
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {tabConfigs.map((nestedConfig, index) => (
                    <TabsContent
                      key={`content-${index}`}
                      value={`nested-${index}`}
                      className="mt-4 flex-1 flex px-4 pb-4"
                    >
                      <ECrud
                        key={`nested-${index}-${read.selectedEntity?.id}-${nestedRefreshKey}`}
                        config={{
                          ...nestedConfig.config,
                          actions: {
                            ...nestedConfig.config.actions,
                            list: {
                              ...nestedConfig.config.actions?.list,
                              pagination:
                                nestedConfig.config.actions?.list?.pagination ??
                                false,
                            },
                          },
                        }}
                        breadcrumbs={[]}
                        layout={nestedConfig.layout}
                        sideWidth={nestedConfig.sideWidth}
                        customFormRenderer={nestedConfig.customFormRenderer}
                        customActions={nestedConfig.customActions}
                        urlState={{
                          baseUrl: `${
                            urlState?.baseUrl || ""
                          }/nested/${nestedConfig.title
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`,
                        }}
                        customListRender={
                          nestedConfig.customListRender
                            ? (props) =>
                                nestedConfig.customListRender!({
                                  parentId: read.selectedEntity?.id!,
                                  entities: props.entities,
                                  loading: props.loading,
                                  onRefresh: props.onRefresh,
                                })
                            : undefined
                        }
                        onLoadData={
                          nestedHandlers
                            ? async (filters, pagination, sorting) => {
                                if (read.selectedEntity?.id) {
                                  return await nestedHandlers.onLoadNestedData(
                                    read.selectedEntity.id,
                                    nestedConfig,
                                    filters,
                                    pagination,
                                    sorting
                                  );
                                }
                                return { data: [], total: 0 };
                              }
                            : undefined
                        }
                        onEntitySave={
                          nestedHandlers
                            ? async (entityData, mode) => {
                                if (read.selectedEntity?.id) {
                                  return await nestedHandlers.onSaveNested(
                                    read.selectedEntity.id,
                                    entityData,
                                    mode,
                                    nestedConfig
                                  );
                                }
                                throw new Error("Save handler not configured");
                              }
                            : undefined
                        }
                        onEntityDelete={
                          nestedHandlers
                            ? async (entityData) => {
                                if (read.selectedEntity?.id) {
                                  return await nestedHandlers.onDeleteNested(
                                    read.selectedEntity.id,
                                    entityData,
                                    nestedConfig
                                  );
                                }
                                throw new Error(
                                  "Delete handler not configured"
                                );
                              }
                            : undefined
                        }
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              );
            }
          })()
        ) : (
          <div
            className="overflow-auto relative flex-1 -mx-3 border-t "
            ref={scrollElementRef}
          >
            <div className="flex flex-col absolute inset-0 px-3 pt-4 ">
              {getFormInitialData() ? (
                <EForm
                  key={`form-${read.selectedEntity?.id || "new"}`}
                  data={getFormInitialData()!}
                  onSubmit={({ write: formData }) =>
                    onSave(formData, returnToList)
                  }
                >
                  {({ Field, read: formData }) => (
                    <FormFieldsRenderer
                      fields={getFormFields()}
                      Field={Field}
                      formData={formData}
                      relationOptions={relationOptions}
                      relationOptionsLoading={relationOptionsLoading}
                      apiFunction={apiFunction}
                      selectedEntity={read.selectedEntity}
                      loading={read.loading.form}
                      returnToList={returnToList}
                      onReturnToListChange={setReturnToList}
                      getWidthClass={getWidthClass}
                      showReturnCheckbox={true}
                      sections={config.sections}
                      config={config}
                      formMode={read.formMode}
                      onEntityDelete={onEntityDelete}
                    />
                  )}
                </EForm>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading form data...
                  </div>
                </div>
              )}
              <div className="pb-20"></div>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
};
