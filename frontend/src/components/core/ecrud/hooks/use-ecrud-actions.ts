import { Alert } from "@/components/ui/global-alert";
import { useCallback } from "react";
import { toast } from "sonner";
import type { BaseEntity, CRUDConfig, ECrudProps } from "../types";
import { baseUrl } from "@/lib/gen/base-url";
import { fileStore } from "../../eform/efield";

export const useECrudActions = <T extends BaseEntity>(
  config: CRUDConfig<T>,
  props: ECrudProps<T>,
  state: any,
  helpers: {
    saveStateToURL: () => Promise<void>;
    isListStateModified: () => boolean;
    getListStateLabel: () => string;
    loadEntities: () => Promise<void>;
    urlStateManager: any;
  }
) => {
  const {
    onEntitySave,
    onEntityDelete,
    onBulkDelete,
    onLoadAllIds,
    onLoadAllTrashIds,
    onEntityRestore,
    onBulkRestore,
    onDataChange,
    onEntitySelect,
    apiFunction,
  } = props;

  const { write, read } = state;
  const {
    saveStateToURL,
    isListStateModified,
    getListStateLabel,
    loadEntities,
    urlStateManager,
  } = helpers;

  // Filter handlers
  const handleFilterReset = useCallback(async () => {
    write.filters = {};
    write.tempFilters = {};
    write.pagination.page = 1;
    await loadEntities();
    saveStateToURL();
  }, [write, loadEntities, saveStateToURL]);

  const handleFilterApply = useCallback(
    async (formData: any) => {
      write.filters = { ...formData };
      write.tempFilters = { ...formData };
      write.pagination.page = 1;
      await loadEntities();
      saveStateToURL();
    },
    [write, loadEntities, saveStateToURL]
  );

  const handleRemoveFilter = useCallback(
    async (key: string) => {
      delete write.filters[key];
      delete write.tempFilters[key];
      write.pagination.page = 1;
      await loadEntities();
      saveStateToURL();
    },
    [write, loadEntities, saveStateToURL]
  );

  // Sorting handler - cycles through null -> asc -> desc -> null
  const handleSort = useCallback(
    async (field: keyof T) => {
      if (write.sorting.field === field) {
        // Same field clicked - cycle through states
        if (write.sorting.direction === null) {
          write.sorting.direction = "asc";
        } else if (write.sorting.direction === "asc") {
          write.sorting.direction = "desc";
        } else {
          // desc -> back to unsorted
          write.sorting.field = null;
          write.sorting.direction = null;
        }
      } else {
        // Different field clicked - start with asc
        write.sorting.field = field;
        write.sorting.direction = "asc";
      }
      await loadEntities();
      saveStateToURL();
    },
    [write, loadEntities, saveStateToURL]
  );

  // Pagination handlers
  const handlePageChange = useCallback(
    async (page: number) => {
      write.pagination.page = page;
      await loadEntities();
      saveStateToURL();
    },
    [write, loadEntities, saveStateToURL]
  );

  const handlePageSizeChange = useCallback(
    async (pageSize: number) => {
      write.pagination.pageSize = pageSize;
      write.pagination.page = 1;
      await loadEntities();
      saveStateToURL();
    },
    [write, loadEntities, saveStateToURL]
  );

  // Entity handlers
  const handleEntitySelect = useCallback(
    async (entity: T) => {
      if (isListStateModified()) {
        const currentStateHash =
          write.currentListStateHash ||
          new URLSearchParams(window.location.search).get("state");
        if (currentStateHash) {
          write.parentListStateHash = currentStateHash;
          write.parentListStateLabel = getListStateLabel();
        }
      } else {
        write.parentListStateHash = undefined;
        write.parentListStateLabel = undefined;
      }

      if (urlStateManager) {
        urlStateManager.clearState();
      }

      // Set initial entity data from list first
      write.selectedEntity = { ...entity };
      write.view = "form";
      write.formMode = "edit";
      write.activeTab = "main"; // Reset to first tab when clicking edit

      // If we have an API function and entity ID, load complete entity data
      if (apiFunction && entity.id) {
        write.loading.form = true;
        try {
          const response = await apiFunction({
            action: "get",
            id: entity.id,
          });

          if (response.success && response.data) {
            // Merge the complete entity data with existing data to preserve any client-side changes
            // This ensures image URLs and other async-loaded fields are properly updated
            write.selectedEntity = {
              ...write.selectedEntity,
              ...response.data,
            };
            onEntitySelect?.(write.selectedEntity);
          } else {
            onEntitySelect?.(write.selectedEntity);
          }
        } catch (error) {
          console.error("Failed to load complete entity data:", error);
          // Fall back to using the list entity data
          onEntitySelect?.(write.selectedEntity);
        } finally {
          write.loading.form = false;
        }
      } else {
        onEntitySelect?.(write.selectedEntity);
      }

      saveStateToURL();
    },
    [
      write,
      isListStateModified,
      getListStateLabel,
      urlStateManager,
      onEntitySelect,
      saveStateToURL,
      apiFunction,
    ]
  );

  const handleEntityCreate = useCallback(() => {
    write.selectedEntity = null;
    write.view = "form";
    write.formMode = "create";
    onEntitySelect?.(null);
    saveStateToURL();
  }, [write, onEntitySelect, saveStateToURL]);

  // Helper function to upload files and return their paths
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`${baseUrl.auth_esensi}/api/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload file: ${file.name}`);
      }
      
      const result = await response.json();
      // Remove leading slash from URL for consistent storage
      return result.url.startsWith('/') ? result.url.substring(1) : result.url;
    });
    
    return Promise.all(uploadPromises);
  };

  // Helper function to process file fields and upload files before saving
  const processFileFields = async (data: any): Promise<any> => {
    const processedData = { ...data };
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && Array.isArray(value)) {
        // Check if it's a file metadata array
        const hasFileStoreKey = value.some((item: any) => 
          item && typeof item === 'object' && item._fileStoreKey
        );
        
        if (hasFileStoreKey) {
          // Extract actual files from fileStore and upload them
          const filePaths: string[] = [];
          
          for (const fileMetadata of value) {
            if (fileMetadata && fileMetadata._fileStoreKey) {
              const storedFiles = fileStore.get(fileMetadata._fileStoreKey);
              if (storedFiles && storedFiles.length > fileMetadata._fileIndex) {
                const file = storedFiles[fileMetadata._fileIndex];
                if (file instanceof File) {
                  const uploadedPaths = await uploadFiles([file]);
                  filePaths.push(...uploadedPaths);
                }
              }
            }
          }
          
          // Replace the metadata array with the uploaded file paths
          processedData[key] = filePaths;
        }
      }
    }
    
    return processedData;
  };

  // Helper function to clean form data before sending to API
  const cleanFormData = (data: any): any => {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      // For file arrays, only convert to empty string if all files should be excluded
      if (data.length > 0 && data[0] instanceof File) {
        // Keep the file array as-is - the API should handle file uploads
        return data;
      }
      // If it's an empty array that might be from a file field, convert to empty string
      if (data.length === 0) {
        return "";
      }
      return data.map(cleanFormData);
    }

    if (
      typeof data === "object" &&
      !(data instanceof File) &&
      !(data instanceof Date)
    ) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip the cover field entirely - don't save uploaded images to cover
        if (
          key === "cover" &&
          (value instanceof File ||
            (Array.isArray(value) &&
              value.length > 0 &&
              value[0] instanceof File))
        ) {
          continue;
        }

        // For non-cover fields, preserve File objects for upload handling
        if (value instanceof File) {
          cleaned[key] = value;
          continue;
        }

        // Skip FileList objects and convert to File array or single File
        if (
          value &&
          typeof value === "object" &&
          "length" in value &&
          typeof (value as any).item === "function"
        ) {
          // Convert FileList to File array, but skip if it's the cover field
          if (key === "cover") {
            continue;
          }
          const fileArray = Array.from(value as FileList);
          cleaned[key] = fileArray.length === 1 ? fileArray[0] : fileArray;
          continue;
        }

        // Recursively clean nested objects
        cleaned[key] = cleanFormData(value);
      }
      return cleaned;
    }

    // For primitive types, return as-is
    return data;
  };

  const handleEntitySave = useCallback(
    async (formData: any, returnToList = true) => {
      if (!onEntitySave) return;

      write.loading.form = true;
      write.errors.form = null;

      try {
        // First, process file fields and upload files
        const processedFormData = await processFileFields(formData);
        
        // Then clean the form data to remove File objects and other problematic values
        const cleanedFormData = cleanFormData(processedFormData);

        const savedEntity = await onEntitySave(
          cleanedFormData,
          write.formMode!
        );

        if (write.formMode === "create") {
          write.entities.push(savedEntity);
          toast.success(`${config.entityName} berhasil dibuat`);
        } else {
          const index = write.entities.findIndex(
            (e) => e.id === savedEntity.id
          );
          if (index !== -1) {
            write.entities[index] = savedEntity;
          }
          toast.success(`${config.entityName} berhasil diperbarui`);
        }

        onDataChange?.(write.entities);

        if (props.onLoadData) {
          await loadEntities();
        }

        // Only navigate back to list if returnToList is true
        if (returnToList) {
          write.view = "list";
          write.formMode = null;
          write.selectedEntity = null;
        } else {
          // Stay on form view - if we just created a new entity, switch to edit mode
          if (write.formMode === "create") {
            write.formMode = "edit";
            write.selectedEntity = savedEntity;
            write.activeTab = "main"; // Reset to main tab after creation
            onEntitySelect?.(savedEntity);
          } else {
            // For edit mode, update selectedEntity with the saved data
            write.selectedEntity = savedEntity;
            onEntitySelect?.(savedEntity);
          }
        }
        write.dirty = false;

        saveStateToURL();
      } catch (error) {
        console.error("Save error:", error);
        write.errors.form = error as Error;

        // Show more specific error message
        let errorMessage = `Failed to save ${config.entityName.toLowerCase()}`;
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "message" in error
        ) {
          errorMessage = (error as any).message;
        }

        toast.error(errorMessage);

        // Keep the form open and preserve the data when there's an error
        // Don't change view or clear selectedEntity so user can fix and retry
        write.dirty = true; // Mark as dirty so user knows there are unsaved changes
      } finally {
        write.loading.form = false;
      }
    },
    [
      write,
      onEntitySave,
      config.entityName,
      onDataChange,
      props.onLoadData,
      loadEntities,
      saveStateToURL,
    ]
  );

  const handleEntityDelete = useCallback(
    async (entity: T) => {
      if (!onEntityDelete) return;

      // Prevent duplicate calls by checking if delete is already in progress or showing confirmation
      if (write.loading.delete || write.loading.deleteConfirmation) {
        console.log(
          "Delete already in progress or showing confirmation, ignoring duplicate call"
        );
        return;
      }

      // Set flag to prevent duplicate confirmation dialogs
      write.loading.deleteConfirmation = true;

      try {
        const confirmation = await Alert.confirm(
          `Apakah Anda yakin ingin menghapus ${config.entityName.toLowerCase()} ini?`
        );

        if (!confirmation.confirm) {
          return;
        }

        write.loading.delete = true;

        await onEntityDelete(entity);
        write.entities = write.entities.filter((e) => e.id !== entity.id);

        if (config.softDelete?.enabled) {
          write.undoDelete.entities.push(entity);

          // Only show toast if this is not a nested entity (nested entities handle their own toasts)
          if (config.entityName !== "Chapter") {
            const undoToast = toast.success(
              `${config.entityName} berhasil dihapus`,
              {
                action: {
                  label: "Undo Hapus",
                  onClick: () => handleUndoDelete(entity.id),
                },
                duration: 10000,
              }
            );

            const timeout = setTimeout(() => {
              write.undoDelete.entities = write.undoDelete.entities.filter(
                (e) => e.id !== entity.id
              );
              write.undoDelete.timeouts = write.undoDelete.timeouts.filter(
                (t) => t !== timeout
              );
            }, 10000);

            write.undoDelete.timeouts.push(timeout);
          }
        } else {
          // Only show simple success toast if this is not a nested entity
          if (config.entityName !== "Chapter") {
            toast.success(`${config.entityName} berhasil dihapus`);
          }
        }

        onDataChange?.(write.entities);

        // Always navigate back to list view after deletion
        write.view = "list";
        write.formMode = null;
        write.selectedEntity = null;
        write.errors.form = null;

        // Refresh the list from server to ensure consistency
        if (props.onLoadData) {
          await loadEntities();
        }

        // Save the state change to URL
        saveStateToURL();
      } catch (error) {
        write.errors.general = error as Error;
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to delete ${config.entityName.toLowerCase()}`;
        toast.error(errorMessage);
      } finally {
        write.loading.delete = false;
        write.loading.deleteConfirmation = false;
      }
    },
    [write, onEntityDelete, config, onDataChange]
  );

  const handleUndoDelete = useCallback(
    async (entityId: string | number) => {
      if (!onEntityRestore || !config.softDelete?.enabled) return;

      const entityToRestore = write.undoDelete.entities.find(
        (e) => e.id === entityId
      );
      if (!entityToRestore) return;

      try {
        await onEntityRestore(entityToRestore);
        write.undoDelete.entities = write.undoDelete.entities.filter(
          (e) => e.id !== entityId
        );

        const timeoutIndex = write.undoDelete.timeouts.findIndex((_, index) => {
          const entity = write.undoDelete.entities[index];
          return entity && entity.id === entityId;
        });
        if (timeoutIndex !== -1) {
          clearTimeout(write.undoDelete.timeouts[timeoutIndex]);
          write.undoDelete.timeouts.splice(timeoutIndex, 1);
        }

        write.entities.push(entityToRestore);

        if (props.onLoadData && !write.showTrash) {
          await loadEntities();
        }

        toast.success(`${config.entityName} berhasil dipulihkan`);
        onDataChange?.(write.entities);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to restore ${config.entityName.toLowerCase()}`;
        toast.error(errorMessage);
      }
    },
    [
      write,
      onEntityRestore,
      config,
      props.onLoadData,
      loadEntities,
      onDataChange,
    ]
  );

  // Navigation handlers
  const handleBackToList = useCallback(() => {
    write.view = "list";
    write.formMode = null;
    write.selectedEntity = null;
    write.errors.form = null;
    write.showTrash = false;
    saveStateToURL();
  }, [write, saveStateToURL]);

  const handleEntityView = useCallback(
    (entity: T) => {
      write.selectedEntity = entity;
      write.view = "detail";
      onEntitySelect?.(entity);
      saveStateToURL();
    },
    [write, onEntitySelect, saveStateToURL]
  );

  const handleToggleTrash = useCallback(async () => {
    write.showTrash = !write.showTrash;
    write.bulkSelection.selectedIds = [];
    write.bulkSelection.allRecordsSelected = false;
    write.pagination.page = 1;
    await loadEntities();
    saveStateToURL();
  }, [write, loadEntities, saveStateToURL]);

  // Bulk operations
  const handleBulkSelectionChange = useCallback(
    (selectedIds: (string | number)[]) => {
      write.bulkSelection.selectedIds = selectedIds;
      write.bulkSelection.allRecordsSelected = false;
    },
    [write]
  );

  const handleSelectAllRecords = useCallback(async () => {
    const loader = write.showTrash ? onLoadAllTrashIds : onLoadAllIds;
    if (!loader) return;

    write.bulkSelection.isSelectingAll = true;
    try {
      const allIds = await loader(write.filters, write.sorting);
      write.bulkSelection.selectedIds = allIds.filter(
        (id): id is string | number => id !== undefined
      );
      write.bulkSelection.allRecordsSelected = true;
    } catch (error) {
      write.errors.general = error as Error;
      toast.error("Failed to load all records");
    } finally {
      write.bulkSelection.isSelectingAll = false;
    }
  }, [write, onLoadAllTrashIds, onLoadAllIds]);

  const handleClearSelection = useCallback(() => {
    write.bulkSelection.selectedIds = [];
    write.bulkSelection.allRecordsSelected = false;
  }, [write]);

  return {
    handleFilterReset,
    handleFilterApply,
    handleRemoveFilter,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleEntitySelect,
    handleEntityCreate,
    handleEntitySave,
    handleEntityDelete,
    handleUndoDelete,
    handleBackToList,
    handleEntityView,
    handleToggleTrash,
    handleBulkSelectionChange,
    handleSelectAllRecords,
    handleClearSelection,
  };
};
