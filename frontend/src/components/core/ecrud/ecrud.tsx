import { Card } from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import type { RelationComboBoxOption } from "@/components/ui/relation-combobox";
import { toast } from "sonner";
import { useIsMobile } from "@/lib/hooks/use-mobile";

// Import modular components and hooks
import { useECrudState } from "./hooks/use-ecrud-state";
import { useECrudActions } from "./hooks/use-ecrud-actions";
import { ECrudListView } from "./components/ecrud-list-view";
import {
  ECrudFormView,
  createRelationHandlers,
} from "./components/ecrud-form-view";
import { ECrudDetailView } from "./components/ecrud-detail-view";
import { getNavigationInfo, createNavigationActions } from "./utils/navigation";
import {
  generateSmartBreadcrumbs,
  createBreadcrumbHandlers,
} from "./utils/breadcrumbs";
import type {
  FlexibleEntity,
  BreadcrumbItem,
  CRUDConfig,
  ECrudProps,
  ColumnConfig,
  FormFieldConfig,
  NestedECrudConfig,
  APIConfig,
} from "./types";

// Export types from the types file for backward compatibility
export type {
  BaseEntity,
  FlexibleEntity,
  BreadcrumbItem,
  ColumnConfig,
  FormFieldConfig,
  APIConfig,
  NestedECrudConfig,
  CRUDConfig,
  ECrudProps,
} from "./types";

export const ECrud = <T extends FlexibleEntity>(props: ECrudProps<T>) => {
  const { config, breadcrumbs, breadcrumbConfig, customFormRenderer, customListRender } = props;
  const isMobile = useIsMobile();
  
  // Keep side-by-side layout but adjust behavior for mobile
  const effectiveLayout = props.layout;

  // Use the modular state management hook
  const {
    write,
    read,
    urlStateManager,
    saveStateToURL,
    isListStateModified,
    getListStateLabel,
    loadEntities,
  } = useECrudState(config, props);

  // Use the modular actions hook
  const actions = useECrudActions(
    config,
    props,
    { write, read },
    {
      saveStateToURL,
      isListStateModified,
      getListStateLabel,
      loadEntities,
      urlStateManager,
    }
  );

  // State for storing resolved breadcrumbs
  const [resolvedBreadcrumbs, setResolvedBreadcrumbs] = useState<
    BreadcrumbItem[]
  >([]);

  // State to trigger nested ECrud refresh
  const [nestedRefreshKey, setNestedRefreshKey] = useState(0);

  // State for relation field options
  const [relationOptions, setRelationOptions] = useState<
    Record<string, RelationComboBoxOption[]>
  >({});
  const [relationOptionsLoading, setRelationOptionsLoading] = useState<
    Record<string, boolean>
  >({});

  // Handle pending navigation after entities are loaded
  useEffect(() => {
    if (
      write.pendingNavigation &&
      read.entities.length > 0 &&
      !read.loading.list
    ) {
      const { targetIndex } = write.pendingNavigation;

      if (read.entities.length > targetIndex) {
        const targetEntity = { ...read.entities[targetIndex] } as T;
        write.selectedEntity = targetEntity;
        props.onEntitySelect?.(targetEntity);
        saveStateToURL();
      }

      // Clear pending navigation
      write.pendingNavigation = null;
    }
  }, [read.entities, read.loading.list, write.pendingNavigation]);

  useEffect(() => {
    // Sync tempFilters with filters when filters change
    write.tempFilters = { ...write.filters };
  }, [write.filters]);

  // Handle URL navigation (like breadcrumb clicks and programmatic navigation)
  useEffect(() => {
    const handleNavigation = async () => {
      if (!props.urlState?.baseUrl) return;
      
      const currentPath = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const stateHash = urlParams.get("state");
      
      // If we're on the base URL and there's a state hash, restore the state
      if (currentPath === props.urlState.baseUrl && stateHash) {
        try {
          if (urlStateManager && props.onGetState) {
            const storedState = await props.onGetState(stateHash);
            if (storedState) {
              // Restore the state from URL
              write.view = storedState.view;
              write.formMode = storedState.formMode;
              write.filters = storedState.filters;
              write.sorting = storedState.sorting;
              write.pagination = { ...write.pagination, ...storedState.pagination };
              write.showTrash = storedState.showTrash;
              // If there's a selected entity ID, load it first
              if (storedState.selectedEntityId && props.apiFunction) {
                try {
                  write.loading.form = true;
                  
                  const response = await props.apiFunction({
                    action: "get",
                    id: storedState.selectedEntityId,
                  });
                  
                  if (response.success && response.data) {
                    write.selectedEntity = response.data;
                    props.onEntitySelect?.(response.data);
                    
                    // Set the activeTab after entity is loaded to ensure proper rendering
                    setTimeout(() => {
                      write.activeTab = storedState.activeTab || "main";
                    }, 100);
                  } else {
                    write.activeTab = storedState.activeTab || "main";
                  }
                } catch (error) {
                  console.error("Failed to load selected entity:", error);
                  write.activeTab = storedState.activeTab || "main";
                } finally {
                  write.loading.form = false;
                }
              } else {
                write.activeTab = storedState.activeTab || "main";
              }
              
              return;
            }
          }
        } catch (error) {
          console.error("Failed to restore state from URL:", error);
        }
      }
      
      // If we're on the base URL without state parameters, reset to list view
      if (currentPath === props.urlState.baseUrl && !stateHash) {
        write.view = "list";
        write.formMode = null;
        write.selectedEntity = null;
        write.showTrash = false;
        write.activeTab = "main";

        if (urlStateManager) {
          urlStateManager.clearState();
        }

        if (props.onLoadData) {
          loadEntities();
        }
      }
    };

    // Handle both popstate and initial load
    handleNavigation();
    window.addEventListener("popstate", handleNavigation);
    
    return () => {
      window.removeEventListener("popstate", handleNavigation);
    };
  }, [props.urlState?.baseUrl, urlStateManager, props.onGetState, props.onLoadData, props.onEntitySelect]);

  // Get form fields based on current state
  const getFormFields = () => {
    if (typeof config.formFields === "function") {
      return config.formFields({
        showTrash: write.showTrash,
        formMode: write.formMode,
      });
    }
    return config.formFields;
  };

  // Load relation options for a specific field
  const loadRelationOptions = useCallback(
    async (
      fieldName: string,
      relationConfig: NonNullable<FormFieldConfig<T>["relationConfig"]>,
      entity?: T
    ) => {
      try {
        setRelationOptionsLoading((prev) => ({ ...prev, [fieldName]: true }));

        // Use createRelationHandlers to get the proper loadOptions function
        const handlers = createRelationHandlers(
          relationConfig,
          props.apiFunction
        );

        if (handlers && handlers.loadOptions) {
          const result = await handlers.loadOptions({ entity });
          setRelationOptions((prev) => ({
            ...prev,
            [fieldName]: result.data,
          }));
        } else {
          // Handle custom relation config
          if (relationConfig.type === "custom" && relationConfig.loadOptions) {
            const result = await relationConfig.loadOptions({ entity });
            setRelationOptions((prev) => ({
              ...prev,
              [fieldName]: result.data,
            }));
          }
        }
      } catch (error) {
        console.error(
          `Failed to load options for relation field ${fieldName}:`,
          error
        );
        setRelationOptions((prev) => ({
          ...prev,
          [fieldName]: [],
        }));
      } finally {
        setRelationOptionsLoading((prev) => ({ ...prev, [fieldName]: false }));
      }
    },
    [props.apiFunction]
  );

  // Create breadcrumb handlers
  const breadcrumbHandlers = createBreadcrumbHandlers(
    props.urlState,
    urlStateManager,
    {
      onGetState: props.onGetState,
      onLoadData: loadEntities,
      onResetState: () => {
        write.view = "list";
        write.formMode = null;
        write.selectedEntity = null;
        write.showTrash = false;
        write.filters = {};
        write.tempFilters = {};
        write.activeFilters = [];
        write.sorting = {
          field: null,
          direction: null,
        };
        write.pagination.page = 1;
        write.parentListStateHash = undefined;
        write.parentListStateLabel = undefined;
        write.currentListStateHash = undefined;
      },
      onRestoreState: async (storedState) => {
        write.view = storedState.view;
        write.formMode = storedState.formMode;
        write.selectedEntity = null;
        write.filters = storedState.filters;
        write.sorting = {
          field: storedState.sorting.field as keyof T | null,
          direction: storedState.sorting.direction,
        };
        write.pagination = {
          ...write.pagination,
          page: storedState.pagination.page,
          pageSize: storedState.pagination.pageSize,
        };
        write.showTrash = storedState.showTrash;
        write.activeTab = storedState.activeTab || "main";
      },
    }
  );

  // Create navigation actions
  const navigationActions = createNavigationActions(
    () =>
      getNavigationInfo(
        write.selectedEntity,
        write.entities,
        write.totalCount,
        write.pagination
      ),
    write.entities,
    write.pagination,
    {
      onEntitySelect: (entity) => {
        write.selectedEntity = entity;
        props.onEntitySelect?.(entity);
      },
      onPageChange: (page) => {
        write.pagination.page = page;
      },
      loadEntities,
      saveStateToURL,
      setPendingNavigation: (navigation) => {
        write.pendingNavigation = navigation;
      },
    }
  );

  // Update resolved breadcrumbs when state changes
  useEffect(() => {
    if (breadcrumbConfig) {
      const updateBreadcrumbs = async () => {
        const breadcrumbState = {
          view: write.view,
          formMode: write.formMode,
          selectedEntity: write.selectedEntity,
          showTrash: write.showTrash,
          parentListStateHash: write.parentListStateHash,
          parentListStateLabel: write.parentListStateLabel,
          filters: write.filters,
          sorting: write.sorting,
          pagination: write.pagination,
        };
        const smartBreadcrumbs = await generateSmartBreadcrumbs(
          config,
          breadcrumbState,
          breadcrumbConfig,
          props.urlState
        );
        setResolvedBreadcrumbs(smartBreadcrumbs);
      };
      updateBreadcrumbs();
    }
  }, [
    write.view,
    write.formMode,
    write.selectedEntity,
    write.showTrash,
    write.parentListStateHash,
    write.parentListStateLabel,
    JSON.stringify(write.filters),
    write.sorting.field,
    write.sorting.direction,
    write.pagination.page,
  ]);

  // Handle tab changes
  const handleTabChange = async (tab: string) => {
    write.activeTab = tab;
    await saveStateToURL();
  };

  // Get current navigation info
  const currentNavigationInfo = getNavigationInfo(
    read.selectedEntity,
    [...read.entities],
    read.totalCount,
    read.pagination
  );

  // Load relation options when entering form mode
  useEffect(() => {
    if (write.view === "form") {
      const formFields = getFormFields();
      formFields.forEach((field) => {
        if (field.type === "relation" && field.relationConfig) {
          loadRelationOptions(
            field.name as string,
            field.relationConfig,
            write.selectedEntity || undefined
          );
        }
      });
    }
  }, [write.view, write.formMode, write.selectedEntity, loadRelationOptions]);

  // Nested CRUD handlers with automatic API integration
  const nestedHandlers = {
    onLoadNestedData: async (
      parentId: string | number,
      nestedConfig: any,
      filters?: any,
      pagination?: { page: number; limit: number },
      sorting?: { field: string; order: 'asc' | 'desc' }
    ) => {
      if (nestedConfig.onLoadNestedData) {
        return await nestedConfig.onLoadNestedData(parentId, filters, pagination, sorting);
      }

      // Default: use the simple nested API approach
      if (nestedConfig.model && props.apiFunction) {
        try {
          const response = await props.apiFunction({
            action: "nested_list",
            nested_model: nestedConfig.model,
            parent_id: parentId.toString(),
            ...(filters && filters),
            ...(pagination && {
              page: pagination.page,
              limit: pagination.limit,
            }),
            ...(sorting && {
              sort: sorting.field,
              order: sorting.order,
            }),
          });
          if (response.success) {
            return { data: response.data || [], total: response.total || 0 };
          }
        } catch (error) {
          console.error(`Error loading nested ${nestedConfig.model}:`, error);
        }
      }

      return { data: [], total: 0 };
    },
    onSaveNested: async (
      parentId: string | number,
      entity: any,
      mode: "create" | "edit",
      nestedConfig: any
    ) => {
      if (nestedConfig.onSaveNested) {
        const result = await nestedConfig.onSaveNested(parentId, entity, mode);
        // Don't increment refresh key here - let the nested ECrud manage its own state
        return result;
      }

      // Default: use the simple nested API approach
      if (nestedConfig.model && props.apiFunction) {
        try {
          const action = mode === "create" ? "nested_create" : "nested_update";
          const params: any = {
            action,
            nested_model: nestedConfig.model,
            parent_id: parentId.toString(),
            ...entity,
          };

          if (mode === "edit" && entity.id) {
            params.id = entity.id;
          }

          const response = await props.apiFunction(params);
          if (response.success) {
            // Don't increment refresh key here - let the nested ECrud manage its own state
            // The nested ECrud will refresh its own data through its internal mechanisms
            return response.data;
          }
          throw new Error(
            response.message || `Failed to ${mode} ${nestedConfig.model}`
          );
        } catch (error) {
          console.error(`Error ${mode} nested ${nestedConfig.model}:`, error);
          throw error;
        }
      }

      throw new Error("Save handler not configured");
    },
    onDeleteNested: async (
      parentId: string | number,
      entity: any,
      nestedConfig: any
    ) => {
      if (nestedConfig.onDeleteNested) {
        const result = await nestedConfig.onDeleteNested(parentId, entity);
        setNestedRefreshKey((prev) => prev + 1);
        return result;
      }

      // Default: use the simple nested API approach
      if (nestedConfig.model && props.apiFunction) {
        try {
          const response = await props.apiFunction({
            action: "nested_delete",
            nested_model: nestedConfig.model,
            parent_id: parentId.toString(),
            id: entity.id,
          });
          if (!response.success) {
            throw new Error(
              response.message || `Failed to delete ${nestedConfig.model}`
            );
          }
          setNestedRefreshKey((prev) => prev + 1);
          
          // Show undo toast for nested entities since main handler can't restore nested entities
          if (nestedConfig.config?.softDelete?.enabled) {
            const handleUndoDelete = async (entityId: string | number) => {
              try {
                let undoResponse;
                if (nestedConfig.onEntityRestore) {
                  // Use custom restore handler
                  undoResponse = await nestedConfig.onEntityRestore(entity, props.apiFunction, parentId);
                } else {
                  // Use default API approach
                  undoResponse = await props.apiFunction?.({
                    action: "nested_restore",
                    nested_model: nestedConfig.model,
                    parent_id: parentId.toString(),
                    id: entityId,
                  });
                }
                
                if (undoResponse.success) {
                  // Refresh the nested data to show the restored item
                  setNestedRefreshKey((prev) => prev + 1);
                  
                  // Also refresh the main list if we have a load function
                  if (props.onLoadData) {
                    await loadEntities();
                  }
                  
                  toast.success(`${nestedConfig.config.entityName} berhasil dipulihkan`);
                } else {
                  toast.error(`Gagal memulihkan ${nestedConfig.config.entityName}`);
                }
              } catch (error) {
                console.error(`Error restoring nested ${nestedConfig.model}:`, error);
                toast.error(`Gagal memulihkan ${nestedConfig.config.entityName}`);
              }
            };

            toast.success(
              `${nestedConfig.config.entityName} berhasil dihapus`,
              {
                action: {
                  label: "Undo Hapus",
                  onClick: () => handleUndoDelete(entity.id),
                },
                duration: 10000,
              }
            );
          }
        } catch (error) {
          console.error(`Error deleting nested ${nestedConfig.model}:`, error);
          throw error;
        }
        return;
      }

      throw new Error("Delete handler not configured");
    },
  };

  // Get breadcrumbs based on current state
  const getBreadcrumbs = () => {
    if (breadcrumbs) {
      if (typeof breadcrumbs === "function") {
        return breadcrumbs({
          view: write.view,
          formMode: write.formMode,
          entityName: config.entityName,
          selectedEntity: write.selectedEntity,
          showTrash: write.showTrash,
        });
      }
      return breadcrumbs;
    }

    if (breadcrumbConfig) {
      return resolvedBreadcrumbs;
    }

    return [];
  };

  return (
    <Card className={`flex-1 flex ${
      effectiveLayout === "side-by-side" ? "flex-row" : "flex-col"
    }`}>
      {effectiveLayout === "side-by-side" ? (
        <>
          {/* Left side: List view */}
          <div 
            className={`${!isMobile ? 'border-r' : ''} flex flex-col min-w-0 ${isMobile && read.view !== 'list' ? 'hidden' : ''}`}
            style={{ 
              width: isMobile ? "100%" : (props.sideWidth?.left || "40%"),
              flexShrink: 0
            }}
          >
            {customListRender ? (
              customListRender({
                entities: [...read.entities] as T[],
                loading: read.loading.list,
                pagination: read.pagination,
                sorting: read.sorting,
                filters: read.filters,
                onEntitySelect: actions.handleEntitySelect,
                onEntityCreate: actions.handleEntityCreate,
                onEntityDelete: actions.handleEntityDelete,
                onPageChange: actions.handlePageChange,
                onSort: actions.handleSort,
                onFilterApply: actions.handleFilterApply,
                onRefresh: loadEntities,
                breadcrumbs: getBreadcrumbs(),
                onBreadcrumbClick: breadcrumbHandlers.handleBreadcrumbClick,
              })
            ) : (
              <ECrudListView
                config={config}
                state={write}
                breadcrumbs={getBreadcrumbs()}
                displayMode={isMobile ? "card" : "compact"}
                onSort={actions.handleSort}
                onPageChange={actions.handlePageChange}
                onPageSizeChange={actions.handlePageSizeChange}
                onLoadMore={async () => {
                  // Load next page for infinite scroll - append data
                  if (write.pagination.page < write.pagination.totalPages && !read.loading.list && props.onLoadData) {
                    try {
                      write.loading.list = true;
                      const nextPage = write.pagination.page + 1;
                      
                      const response = await props.onLoadData(
                        read.filters,
                        { ...read.pagination, page: nextPage },
                        read.sorting
                      );

                      if (response && (response as any).data) {
                        // Append new data to existing entities
                        const newEntities = Array.isArray((response as any).data) ? (response as any).data : (response as any).data.data || [];
                        write.entities = [...write.entities, ...newEntities];
                        write.pagination.page = nextPage;
                        write.totalCount = (response as any).total || read.totalCount;
                        
                        // Update pagination info
                        write.pagination.totalPages = Math.ceil(write.totalCount / read.pagination.pageSize);
                      }
                    } catch (error) {
                      console.error('Failed to load more data:', error);
                    } finally {
                      write.loading.list = false;
                    }
                  }
                }}
                onFilterApply={actions.handleFilterApply}
                onFilterReset={actions.handleFilterReset}
                onRemoveFilter={actions.handleRemoveFilter}
                onEntityCreate={actions.handleEntityCreate}
                onEntitySelect={actions.handleEntitySelect}
                onEntityView={actions.handleEntityView}
                onEntityDelete={actions.handleEntityDelete}
                onEntityRestore={async (entity) => {
                  if (!props.onEntityRestore) return;
                  try {
                    await props.onEntityRestore(entity);
                    write.entities = write.entities.filter((e) => e.id !== entity.id);
                    await loadEntities();
                    saveStateToURL();
                  } catch (error) {
                    console.error("Failed to restore entity:", error);
                  }
                }}
                onBulkDelete={async () => {
                  // Implementation handled in actions
                }}
                onBulkRestore={async () => {
                  // Implementation handled in actions
                }}
                onBulkSelectionChange={actions.handleBulkSelectionChange}
                onSelectAllRecords={actions.handleSelectAllRecords}
                onClearSelection={actions.handleClearSelection}
                onToggleTrash={actions.handleToggleTrash}
                onRefresh={loadEntities}
                onBreadcrumbClick={breadcrumbHandlers.handleBreadcrumbClick}
                hasLoadAllIds={!!props.onLoadAllIds}
                apiFunction={props.apiFunction}
                customActions={props.customActions}
              />
            )}
          </div>
          {/* Right side: Form or Detail view */}
          <div 
            className={`flex flex-col min-w-0 ${isMobile && read.view === 'list' ? 'hidden' : ''}`}
            style={{ 
              width: isMobile ? "100%" : (props.sideWidth?.right || "60%"),
              flexShrink: 0
            }}
          >
            {read.view === "form" && (
              <ECrudFormView
                config={config}
                state={write}
                breadcrumbs={isMobile ? getBreadcrumbs() : []} // Show breadcrumbs on mobile for navigation
                nestedRefreshKey={nestedRefreshKey}
                relationOptions={relationOptions}
                relationOptionsLoading={relationOptionsLoading}
                onSave={(formData, returnToList) => actions.handleEntitySave(formData, returnToList)}
                onCancel={actions.handleBackToList}
                onEntityDelete={actions.handleEntityDelete}
                onBreadcrumbClick={breadcrumbHandlers.handleBreadcrumbClick}
                onTabChange={handleTabChange}
                onNavigateToPrevious={navigationActions.handleNavigateToPrevious}
                onNavigateToNext={navigationActions.handleNavigateToNext}
                navigationInfo={currentNavigationInfo}
                urlState={props.urlState}
                apiFunction={props.apiFunction}
                customFormRenderer={customFormRenderer}
                nestedHandlers={nestedHandlers}
              />
            )}
            {read.view === "detail" && read.selectedEntity && (
              <ECrudDetailView
                config={config}
                state={write}
                breadcrumbs={isMobile ? getBreadcrumbs() : []} // Show breadcrumbs on mobile for navigation
                onBreadcrumbClick={breadcrumbHandlers.handleBreadcrumbClick}
                onNavigateToPrevious={navigationActions.handleNavigateToPrevious}
                onNavigateToNext={navigationActions.handleNavigateToNext}
                navigationInfo={currentNavigationInfo}
              />
            )}
            {read.view === "list" && !isMobile && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p>{props.emptySelectionMessage || "Pilih item dari daftar untuk melihat atau mengedit"}</p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Default layout: Single view */
        <>
          {read.view === "list" && (
            <>
              {customListRender ? (
                customListRender({
                  entities: [...read.entities] as T[],
                  loading: read.loading.list,
                  pagination: read.pagination,
                  sorting: read.sorting,
                  filters: read.filters,
                  onEntitySelect: actions.handleEntitySelect,
                  onEntityCreate: actions.handleEntityCreate,
                  onEntityDelete: actions.handleEntityDelete,
                  onPageChange: actions.handlePageChange,
                  onSort: actions.handleSort,
                  onFilterApply: actions.handleFilterApply,
                  onRefresh: loadEntities,
                  breadcrumbs: getBreadcrumbs(),
                  onBreadcrumbClick: breadcrumbHandlers.handleBreadcrumbClick,
                })
              ) : (
                <ECrudListView
                  config={config}
                  state={write}
                  breadcrumbs={getBreadcrumbs()}
                  onSort={actions.handleSort}
                  onPageChange={actions.handlePageChange}
                  onPageSizeChange={actions.handlePageSizeChange}
                  onFilterApply={actions.handleFilterApply}
                  onFilterReset={actions.handleFilterReset}
                  onRemoveFilter={actions.handleRemoveFilter}
                  onEntityCreate={actions.handleEntityCreate}
                  onEntitySelect={actions.handleEntitySelect}
                  onEntityView={actions.handleEntityView}
                  onEntityDelete={actions.handleEntityDelete}
                  onEntityRestore={async (entity) => {
                    if (!props.onEntityRestore) return;
                    try {
                      await props.onEntityRestore(entity);
                      write.entities = write.entities.filter((e) => e.id !== entity.id);
                      await loadEntities();
                      saveStateToURL();
                    } catch (error) {
                      console.error("Failed to restore entity:", error);
                    }
                  }}
                  onBulkDelete={async () => {
                    // Implementation handled in actions
                  }}
                  onBulkRestore={async () => {
                    // Implementation handled in actions
                  }}
                  onBulkSelectionChange={actions.handleBulkSelectionChange}
                  onSelectAllRecords={actions.handleSelectAllRecords}
                  onClearSelection={actions.handleClearSelection}
                  onToggleTrash={actions.handleToggleTrash}
                  onRefresh={loadEntities}
                  onBreadcrumbClick={breadcrumbHandlers.handleBreadcrumbClick}
                  hasLoadAllIds={!!props.onLoadAllIds}
                  apiFunction={props.apiFunction}
                  customActions={props.customActions}
                />
              )}
            </>
          )}

          {read.view === "form" && (
            <ECrudFormView
              config={config}
              state={write}
              breadcrumbs={getBreadcrumbs()}
              nestedRefreshKey={nestedRefreshKey}
              relationOptions={relationOptions}
              relationOptionsLoading={relationOptionsLoading}
              onSave={(formData, returnToList) => actions.handleEntitySave(formData, returnToList)}
              onCancel={actions.handleBackToList}
              onEntityDelete={actions.handleEntityDelete}
              onBreadcrumbClick={breadcrumbHandlers.handleBreadcrumbClick}
              onTabChange={handleTabChange}
              onNavigateToPrevious={navigationActions.handleNavigateToPrevious}
              onNavigateToNext={navigationActions.handleNavigateToNext}
              navigationInfo={currentNavigationInfo}
              urlState={props.urlState}
              apiFunction={props.apiFunction}
              customFormRenderer={customFormRenderer}
              nestedHandlers={nestedHandlers}
            />
          )}

          {read.view === "detail" && read.selectedEntity && (
            <ECrudDetailView
              config={config}
              state={write}
              breadcrumbs={getBreadcrumbs()}
              onBreadcrumbClick={breadcrumbHandlers.handleBreadcrumbClick}
              onNavigateToPrevious={navigationActions.handleNavigateToPrevious}
              onNavigateToNext={navigationActions.handleNavigateToNext}
              navigationInfo={currentNavigationInfo}
            />
          )}
        </>
      )}
    </Card>
  );
};
