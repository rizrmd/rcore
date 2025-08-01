import type { Prisma } from "shared/models";

function isObject(item: any) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function deepMerge(target: any, source: any) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function filterOutRelationFields(data: any) {
  if (!isObject(data)) return data;

  const filtered = { ...data };

  // Remove fields that are clearly relation data or undefined values
  Object.keys(filtered).forEach((key) => {
    const value = filtered[key];

    // Remove undefined values to let Prisma use schema defaults
    if (value === undefined) {
      delete filtered[key];
      return;
    }

    // Convert "null" string to actual null for UUID fields to prevent invalid UUID errors
    if (key.toLowerCase().includes('id') && value === "null") {
      filtered[key] = null;
      return;
    }

    // Remove _count fields (Prisma aggregate fields)
    if (key === "_count" || key.startsWith("_count")) {
      delete filtered[key];
      return;
    }

    // Remove arrays of objects that look like relation data
    if (Array.isArray(value) && value.length > 0 && isObject(value[0])) {
      // Check if the first object has an 'id' field, indicating it's relation data
      if (value[0].id !== undefined) {
        delete filtered[key];
      }
    }

    // Remove single objects that look like relation data (have id field)
    if (isObject(value) && value.id !== undefined && key !== "data") {
      // Exception for 'data' field which might legitimately have an id field in JSON content
      delete filtered[key];
    }
  });

  return filtered;
}

function buildFilterCondition(key: string, value: any) {
  // Skip filtering entirely if value is null/undefined/"null" for ID fields
  // as primary keys can't be null, and "null" string indicates no filter should be applied
  if (
    (value === "null" || value === null || value === undefined || value === "") &&
    key.toLowerCase().includes("id")
  ) {
    return undefined;
  }

  // UUID pattern: 8-4-4-4-12 characters
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    );

  // If the field name suggests it's an ID field or the value looks like a UUID, use equals
  if (key.toLowerCase().includes("id") || isUuid) {
    return { equals: value };
  }

  // For boolean fields, use equals
  if (typeof value === "boolean" || value === "true" || value === "false") {
    const boolValue = typeof value === "boolean" ? value : value === "true";
    return { equals: boolValue };
  }

  // For number fields, use equals
  if (
    typeof value === "number" ||
    (!isNaN(Number(value)) && !isNaN(parseFloat(value)))
  ) {
    return { equals: Number(value) };
  }

  // For regular text fields, use contains with case insensitive mode
  return { contains: value, mode: "insensitive" };
}

type PrismaModelName = Prisma.ModelName;
type BeforeHook<T> = (params: T) => Promise<T | void> | T | void;
type AfterHook<T> = (result: T) => Promise<void> | void;

interface CrudRequestBody {
  action:
    | "list"
    | "get"
    | "create"
    | "update"
    | "delete"
    | "bulkDelete"
    | "listIds"
    | "listTrash"
    | "listTrashIds"
    | "restore"
    | "bulkRestore"
    | "storeState"
    | "getState"
    | "updateState"
    | "nested_list"
    | "nested_get"
    | "nested_create"
    | "nested_update"
    | "nested_delete"
    | "nested_restore";
  nested_model?: string; // Required for nested operations
  parent_id?: string | number; // Required for nested operations
  [key: string]: any; // Allow any other properties for the payload
}

export interface CrudApiOptions {
  primaryKey?: string; // Primary key field name (default: "id")
  list?: { prisma?: any; before?: BeforeHook<any>; after?: AfterHook<any> };
  get?: { prisma?: any; before?: BeforeHook<any>; after?: AfterHook<any> };
  create?: { prisma?: any; before?: BeforeHook<any>; after?: AfterHook<any> };
  update?: { prisma?: any; before?: BeforeHook<any>; after?: AfterHook<any> };
  delete?: { prisma?: any; before?: BeforeHook<any>; after?: AfterHook<any> };
  bulkDelete?: {
    prisma?: any;
    before?: BeforeHook<any>;
    after?: AfterHook<any>;
  };
  softDelete?: {
    enabled: boolean;
    field: string; // e.g., 'deletedAt', 'isDeleted', 'status'
    method:
      | "null_is_deleted"
      | "null_is_available"
      | "true_is_deleted"
      | "value_is_deleted";
    deletedValue?: any; // value to set when deleting (for value_is_deleted method)
  };
  nested?: {
    [modelName: string]: {
      parentField: string; // Field that links to parent (e.g., 'id_customer')
      model: PrismaModelName; // Nested model name
      softDelete?: {
        enabled: boolean;
        field: string; // Field to use for soft delete (e.g., 'deleted_at')
        method:
          | "null_is_deleted"
          | "null_is_available"
          | "true_is_deleted"
          | "value_is_deleted";
        deletedValue?: any; // value to set when deleting (for value_is_deleted method)
      };
      list?: { prisma?: any; before?: BeforeHook<any>; after?: AfterHook<any> };
      get?: { prisma?: any; before?: BeforeHook<any>; after?: AfterHook<any> };
      create?: {
        prisma?: any;
        before?: BeforeHook<any>;
        after?: AfterHook<any>;
      };
      update?: {
        prisma?: any;
        before?: BeforeHook<any>;
        after?: AfterHook<any>;
      };
      delete?: {
        prisma?: any;
        before?: BeforeHook<any>;
        after?: AfterHook<any>;
      };
    };
  };
}

function toCamelCase(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Simple in-memory state storage (for production, use a database table)
const stateStorage = new Map<string, { state: any; ttl: number }>();

// Generate a unique hash for state storage
function generateStateHash(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Clean up expired states
function cleanupExpiredStates() {
  const now = Date.now();
  for (const [hash, data] of stateStorage.entries()) {
    if (now > data.ttl) {
      stateStorage.delete(hash);
    }
  }
}

// Helper function to build soft delete where clause
function buildSoftDeleteWhere(softDeleteConfig?: CrudApiOptions["softDelete"]) {
  if (!softDeleteConfig?.enabled) return {};

  const { field, method } = softDeleteConfig;

  switch (method) {
    case "null_is_deleted":
      return { [field]: { not: null } }; // null means deleted, so show non-null (active)
    case "null_is_available":
      return { [field]: null }; // null means available, so show null (active)
    case "true_is_deleted":
      return { [field]: false }; // true means deleted, so show false (active)
    case "value_is_deleted":
      return { [field]: { not: softDeleteConfig.deletedValue } };
    default:
      return {};
  }
}

// Helper function to build soft delete update data
function buildSoftDeleteData(softDeleteConfig?: CrudApiOptions["softDelete"]) {
  if (!softDeleteConfig?.enabled) return {};

  const { field, method, deletedValue } = softDeleteConfig;

  switch (method) {
    case "null_is_deleted":
      return { [field]: new Date() }; // Set current timestamp for deletedAt
    case "null_is_available":
      return { [field]: new Date() }; // Set current timestamp when deleting
    case "true_is_deleted":
      return { [field]: true };
    case "value_is_deleted":
      return { [field]: deletedValue };
    default:
      return {};
  }
}

// Helper function to build trash where clause (opposite of buildSoftDeleteWhere)
function buildTrashWhere(softDeleteConfig?: CrudApiOptions["softDelete"]) {
  if (!softDeleteConfig?.enabled) return {};

  const { field, method } = softDeleteConfig;

  switch (method) {
    case "null_is_deleted":
      return { [field]: null }; // null means deleted, so show null (trashed)
    case "null_is_available":
      return { [field]: { not: null } }; // null means available, so show not-null (trashed)
    case "true_is_deleted":
      return { [field]: true }; // true means deleted, so show true (trashed)
    case "value_is_deleted":
      return { [field]: softDeleteConfig.deletedValue };
    default:
      return {};
  }
}

// Helper function to build restore data (opposite of buildSoftDeleteData)
function buildRestoreData(softDeleteConfig?: CrudApiOptions["softDelete"]) {
  if (!softDeleteConfig?.enabled) return {};

  const { field, method } = softDeleteConfig;

  switch (method) {
    case "null_is_deleted":
      return { [field]: null };
    case "null_is_available":
      return { [field]: null };
    case "true_is_deleted":
      return { [field]: false };
    case "value_is_deleted":
      return { [field]: null }; // or some default "available" value
    default:
      return {};
  }
}

// Helper function to sanitize where clause by removing invalid UUID values
function sanitizeWhereClause(where: any): any {
  if (!where || typeof where !== 'object') return where;
  
  const sanitized = { ...where };
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    
    // Remove "null" string values from ID fields
    if (key.toLowerCase().includes('id') && value === "null") {
      delete sanitized[key];
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeWhereClause(value);
    }
  });
  
  return sanitized;
}

export function crudHandler(
  modelName: PrismaModelName,
  options: CrudApiOptions = {}
) {
  return async function ({
    action,
    nested_model,
    parent_id,
    ...payload
  }: CrudRequestBody) {
    // Get the primary key field name (default to "id")
    const primaryKey = options.primaryKey || "id";
    // Handle nested operations
    if (action.startsWith("nested_") && nested_model && parent_id) {
      const nestedConfig = options.nested?.[nested_model];
      if (!nestedConfig) {
        return {
          success: false,
          message: `Nested model ${nested_model} not configured`,
          status: 404,
        };
      }

      const nestedModelCamel = toCamelCase(nestedConfig.model);
      const nestedModelObj = (db as any)[nestedModelCamel];

      if (!nestedModelObj) {
        return {
          success: false,
          message: `Nested model ${nestedConfig.model} not found`,
          status: 404,
        };
      }

      const nestedAction = action.replace("nested_", "");

      try {
        switch (nestedAction) {
          case "list": {
            const opts = nestedConfig.list || {};
            if (opts.before) await opts.before(payload);

            // Special case: if parent_id is "filter", load all records (for filter dropdowns)
            let where: any = {};
            if (parent_id !== "filter") {
              where = { [nestedConfig.parentField]: parent_id };
            }

            // Add any additional filters from payload
            const {
              page = "1",
              limit = "10",
              pageSize = "10",
              sort,
              order = "asc",
              fields, // Field selection for optimization
              include, // Include related models
              search, // Search query
              ...filters
            } = payload;

            // Add search functionality
            if (search && search.trim()) {
              // Dynamic text search across fields specified in the request
              if (fields) {
                const fieldList = fields
                  .split(",")
                  .map((f: string) => f.trim());
                where.OR = fieldList.map((field: string) => ({
                  [field]: { contains: search, mode: "insensitive" },
                }));
              } else {
                // Fallback to common text fields if no specific fields provided
                const commonTextFields = [
                  "name",
                  "title",
                  "address",
                  "city",
                  "province",
                  "description",
                ];
                where.OR = commonTextFields.map((field: string) => ({
                  [field]: { contains: search, mode: "insensitive" },
                }));
              }
            }

            // Add other filters
            Object.keys(filters).forEach((key) => {
              if (
                filters[key] !== undefined &&
                filters[key] !== null &&
                filters[key] !== ""
              ) {
                const condition = buildFilterCondition(key, filters[key]);
                if (condition !== undefined) {
                  where[key] = condition;
                }
              }
            });

            // Add soft delete filter for nested model
            if (nestedConfig.softDelete?.enabled) {
              const softDeleteWhere = buildSoftDeleteWhere(
                nestedConfig.softDelete
              );
              Object.assign(where, softDeleteWhere);
            }

            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(pageSize || limit, 10);

            const defaultPrismaArgs: any = {
              where,
              skip: (pageNum - 1) * limitNum,
              take: limitNum,
              orderBy: sort ? { [sort]: order || "asc" } : undefined,
            };

            // Handle field selection and includes (can't use both select and include in Prisma)
            if (include) {
              // When using include, we can't use select - include takes priority
              const includeList = include
                .split(",")
                .map((i: string) => i.trim());
              const includeObj: any = {};
              includeList.forEach((inc: string) => {
                includeObj[inc] = true;
              });
              defaultPrismaArgs.include = includeObj;
            } else if (fields) {
              // Only use select when include is not specified
              const fieldList = fields.split(",").map((f: string) => f.trim());
              const select: any = { id: true }; // Always include id
              fieldList.forEach((field: string) => {
                select[field] = true;
              });
              defaultPrismaArgs.select = select;
            }

            const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});

            // If sort is provided from request, override any default orderBy
            if (sort) {
              prismaArgs.orderBy = { [sort]: order || "asc" };
            }

            // Sanitize the where clause to remove any "null" strings from UUID fields
            if (prismaArgs.where) {
              prismaArgs.where = sanitizeWhereClause(prismaArgs.where);
            }

            const data = await nestedModelObj.findMany(prismaArgs);
            const total = await nestedModelObj.count({
              where: prismaArgs.where,
            });

            if (opts.after) await opts.after(data);
            return { success: true, data, total };
          }

          case "create": {
            const opts = nestedConfig.create || {};
            let processedPayload = {
              ...payload,
              [nestedConfig.parentField]: parent_id,
            };

            if (opts.before) {
              const result = await opts.before(processedPayload);
              if (result) processedPayload = result;
            }

            // Process fields for database storage
            const jsonFields = ["info", "cfg"];
            const fileFields = ["cover", "product_file"];

            // Serialize JSON fields
            jsonFields.forEach((field) => {
              if (
                processedPayload[field] &&
                typeof processedPayload[field] === "object" &&
                !Buffer.isBuffer(processedPayload[field])
              ) {
                processedPayload[field] = JSON.stringify(
                  processedPayload[field]
                );
              }
            });

            // Handle file fields - convert to JSON string format
            fileFields.forEach((field) => {
              if (
                processedPayload[field] &&
                Array.isArray(processedPayload[field])
              ) {
                // Array of file paths (already uploaded)
                processedPayload[field] = JSON.stringify(
                  processedPayload[field]
                );
              } else if (
                processedPayload[field] &&
                typeof processedPayload[field] === "string" &&
                processedPayload[field].startsWith("_file/")
              ) {
                // Single file path
                processedPayload[field] = JSON.stringify([
                  processedPayload[field],
                ]);
              }
            });

            const defaultPrismaArgs = { data: processedPayload };
            const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});

            const data = await nestedModelObj.create(prismaArgs);

            if (opts.after) await opts.after(data);
            return { success: true, data };
          }

          case "update": {
            const opts = nestedConfig.update || {};
            const { id, ...updateData } = payload;

            if (!id) {
              return { success: false, message: "ID is required for update" };
            }

            let processedPayload = updateData;
            if (opts.before) {
              const result = await opts.before(processedPayload);
              if (result) processedPayload = result;
            }

            // Filter out Prisma read-only fields that cannot be updated
            const { _count, ...dataForUpdate } = processedPayload;

            // Process fields for database storage
            const jsonFields = ["info", "cfg"];
            const fileFields = ["cover", "product_file"];

            // Serialize JSON fields
            jsonFields.forEach((field) => {
              if (
                dataForUpdate[field] &&
                typeof dataForUpdate[field] === "object" &&
                !Buffer.isBuffer(dataForUpdate[field])
              ) {
                dataForUpdate[field] = JSON.stringify(dataForUpdate[field]);
              }
            });

            // Handle file fields - convert to JSON string format
            fileFields.forEach((field) => {
              if (dataForUpdate[field] && Array.isArray(dataForUpdate[field])) {
                // Array of file paths (already uploaded)
                dataForUpdate[field] = JSON.stringify(dataForUpdate[field]);
              } else if (
                dataForUpdate[field] &&
                typeof dataForUpdate[field] === "string" &&
                dataForUpdate[field].startsWith("_file/")
              ) {
                // Single file path
                dataForUpdate[field] = JSON.stringify([dataForUpdate[field]]);
              }
            });

            const defaultPrismaArgs = {
              where: { id, [nestedConfig.parentField]: parent_id },
              data: dataForUpdate,
            };
            const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});

            const data = await nestedModelObj.update(prismaArgs);

            if (opts.after) await opts.after(data);
            return { success: true, data };
          }

          case "delete": {
            const opts = nestedConfig.delete || {};
            const { id } = payload;

            if (!id) {
              return { success: false, message: "ID is required for delete" };
            }

            if (opts.before) await opts.before(payload);

            let result;
            if (nestedConfig.softDelete?.enabled) {
              // Soft delete - update the record
              const softDeleteData = buildSoftDeleteData(
                nestedConfig.softDelete
              );
              const defaultPrismaArgs = {
                where: { id, [nestedConfig.parentField]: parent_id },
                data: softDeleteData,
              };
              const prismaArgs = deepMerge(
                defaultPrismaArgs,
                opts.prisma || {}
              );
              result = await nestedModelObj.update(prismaArgs);
            } else {
              // Hard delete - actually delete the record
              const defaultPrismaArgs = {
                where: { id, [nestedConfig.parentField]: parent_id },
              };
              const prismaArgs = deepMerge(
                defaultPrismaArgs,
                opts.prisma || {}
              );
              result = await nestedModelObj.delete(prismaArgs);
            }

            if (opts.after) await opts.after(result);
            return { success: true, data: result };
          }

          case "restore": {
            const softDeleteConfig = nestedConfig.softDelete;
            if (!softDeleteConfig?.enabled) {
              return {
                success: false,
                message: "Soft delete is not enabled for this nested model",
                status: 400,
              };
            }

            const opts = nestedConfig.update || {};
            const { id } = payload;

            if (!id) {
              return { success: false, message: "ID is required for restore" };
            }

            if (opts.before) await opts.before(payload);

            const restoreData = buildRestoreData(softDeleteConfig);
            const trashWhere = buildTrashWhere(softDeleteConfig);
            const defaultPrismaArgs = {
              where: {
                id,
                [nestedConfig.parentField]: parent_id,
                ...trashWhere,
              },
              data: restoreData,
            };
            const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});

            const data = await nestedModelObj.update(prismaArgs);

            if (opts.after) await opts.after(data);
            return { success: true, data };
          }

          default:
            return {
              success: false,
              message: `Nested action ${nestedAction} not supported`,
              status: 400,
            };
        }
      } catch (error: any) {
        console.error(`Error in nested ${nestedAction}:`, error);
        return { success: false, message: error.message, status: 500 };
      }
    }

    const model = (db as any)[toCamelCase(modelName)];

    if (!model) {
      return {
        success: false,
        message: `Model ${modelName} not found`,
        status: 404,
      };
    }

    try {
      switch (action) {
        case "list": {
          const opts = options.list || {};
          if (opts.before) await opts.before(payload);

          const {
            page = "1",
            limit = "10",
            pageSize = "10",
            sort,
            order = "asc",
            totalPages, // Exclude from filters
            ...filters
          } = payload;
          const pageNum = parseInt(page, 10);
          const limitNum = parseInt(pageSize || limit, 10);

          const defaultWhere: any = {};
          const filterKeys = Object.keys(filters).filter(
            (k) => !["page", "limit", "pageSize", "sort", "order"].includes(k)
          );
          for (const key of filterKeys) {
            const condition = buildFilterCondition(key, filters[key]);
            if (condition !== undefined) {
              defaultWhere[key] = condition;
            }
          }

          // Add soft delete filter
          const softDeleteWhere = buildSoftDeleteWhere(options.softDelete);
          Object.assign(defaultWhere, softDeleteWhere);

          const defaultPrismaArgs: any = {
            where: defaultWhere,
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
          };

          // Handle orderBy merging and dynamic where clauses
          let basePrismaArgs = opts.prisma || {};

          // Merge base prisma args where clause
          if (basePrismaArgs.where) {
            const sanitizedWhere = sanitizeWhereClause(basePrismaArgs.where);
            Object.assign(defaultWhere, sanitizedWhere);
            const { where, ...restBasePrismaArgs } = basePrismaArgs;
            basePrismaArgs = restBasePrismaArgs;
          }

          let prismaArgs;

          if (sort) {
            // If there's an existing orderBy, we need to handle it properly
            if (basePrismaArgs.orderBy) {
              if (Array.isArray(basePrismaArgs.orderBy)) {
                // Prepend the sort to existing array
                defaultPrismaArgs.orderBy = [
                  { [sort]: order },
                  ...basePrismaArgs.orderBy,
                ];
              } else {
                // Convert existing object to array and prepend
                defaultPrismaArgs.orderBy = [
                  { [sort]: order },
                  basePrismaArgs.orderBy,
                ];
              }
              // Remove orderBy from basePrismaArgs to avoid double merge
              const { orderBy, ...restPrismaArgs } = basePrismaArgs;
              prismaArgs = deepMerge(defaultPrismaArgs, restPrismaArgs);
            } else {
              defaultPrismaArgs.orderBy = { [sort]: order };
              prismaArgs = deepMerge(defaultPrismaArgs, basePrismaArgs);
            }
          } else {
            prismaArgs = deepMerge(defaultPrismaArgs, basePrismaArgs);
          }

          const [data, total] = await Promise.all([
            model.findMany(prismaArgs),
            model.count({ where: defaultWhere }),
          ]);

          // Convert story_tags comma-separated string back to array for UI
          if (data && Array.isArray(data)) {
            data.forEach((record) => {
              if (record.story_tags && typeof record.story_tags === "string") {
                record.story_tags = record.story_tags
                  .split(", ")
                  .filter((tag: string) => tag.trim() !== "");
              }
            });
          }

          const result = { data, total };
          if (opts.after) await opts.after(result);
          return { success: true, data: result };
        }
        case "get": {
          const opts = options.get || {};
          if (opts.before) await opts.before(payload);

          // Handle "new" case - return empty record template for form initialization
          if (payload[primaryKey] === "new") {
            return { success: true, data: null };
          }

          const defaultPrismaArgs = {
            where: { [primaryKey]: payload[primaryKey] },
          };
          let basePrismaArgs = opts.prisma || {};

          // Merge base prisma args where clause
          if (basePrismaArgs.where) {
            defaultPrismaArgs.where = {
              ...defaultPrismaArgs.where,
              ...basePrismaArgs.where,
            };
            const { where, ...restBasePrismaArgs } = basePrismaArgs;
            basePrismaArgs = restBasePrismaArgs;
          }

          const prismaArgs = deepMerge(defaultPrismaArgs, basePrismaArgs);
          const record = await model.findUnique(prismaArgs);

          if (!record) {
            return { success: false, message: "Record not found", status: 404 };
          }

          // Convert story_tags comma-separated string back to array for UI
          if (record.story_tags && typeof record.story_tags === "string") {
            record.story_tags = record.story_tags
              .split(", ")
              .filter((tag: string) => tag.trim() !== "");
          }

          if (opts.after) await opts.after(record);
          return { success: true, data: record };
        }
        case "create": {
          const opts = options.create || {};
          let data = filterOutRelationFields(payload);
          if (opts.before) {
            const modifiedData = await opts.before(data);
            data = modifiedData || data;
          }

          // Filter out undefined values again after the before hook
          data = filterOutRelationFields(data);

          // Process fields for database storage
          const jsonFields = ["info", "cfg"];
          const fileFields = ["cover", "product_file"];

          // Serialize JSON fields
          jsonFields.forEach((field) => {
            if (
              data[field] &&
              typeof data[field] === "object" &&
              !Buffer.isBuffer(data[field])
            ) {
              data[field] = JSON.stringify(data[field]);
            }
          });

          // Handle file fields - convert to JSON string format
          fileFields.forEach((field) => {
            if (data[field] && Array.isArray(data[field])) {
              // Array of file paths (already uploaded)
              data[field] = JSON.stringify(data[field]);
            } else if (
              data[field] &&
              typeof data[field] === "string" &&
              data[field].startsWith("_file/")
            ) {
              // Single file path
              data[field] = JSON.stringify([data[field]]);
            }
          });

          // Convert story_tags array to comma-separated string
          if (data["story_tags"] && Array.isArray(data["story_tags"])) {
            data["story_tags"] = data["story_tags"].join(", ");
          }

          const defaultPrismaArgs = { data };
          const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});

          const record = await model.create(prismaArgs);

          if (opts.after) await opts.after(record);
          return { success: true, data: record, status: 201 };
        }
        case "update": {
          const opts = options.update || {};
          const primaryKeyValue = payload[primaryKey];
          const data = { ...payload };
          delete data[primaryKey]; // Always remove primary key from update data

          if (!primaryKeyValue) {
            return {
              success: false,
              message: `${primaryKey} is required for update`,
              status: 400,
            };
          }

          let updateData = filterOutRelationFields(data);
          if (opts.before) {
            const modifiedData = await opts.before(updateData);
            updateData = modifiedData || updateData;
          }

          // Filter out undefined values again after the before hook
          updateData = filterOutRelationFields(updateData);

          // Process fields for database storage
          const jsonFields = ["info", "cfg"];
          const fileFields = ["cover", "product_file"];

          // Serialize JSON fields
          jsonFields.forEach((field) => {
            if (
              updateData[field] &&
              typeof updateData[field] === "object" &&
              !Buffer.isBuffer(updateData[field])
            ) {
              updateData[field] = JSON.stringify(updateData[field]);
            }
          });

          // Convert story_tags array to comma-separated string
          if (
            updateData["story_tags"] &&
            Array.isArray(updateData["story_tags"])
          ) {
            updateData["story_tags"] = updateData["story_tags"].join(", ");
          }

          // Extract file paths from file fields
          fileFields.forEach((field) => {
            if (updateData[field] && Array.isArray(updateData[field])) {
              const filePaths = updateData[field]
                .map((file: any) => {
                  if (typeof file === "string") return file; // Already a path
                  if (file && file._fileStoreKey) {
                    // Extract uploaded file path from metadata
                    return `_file/upload/${file._fileStoreKey}`;
                  }
                  return file;
                })
                .filter(Boolean);
              updateData[field] = JSON.stringify(filePaths);
            } else if (
              updateData[field] &&
              typeof updateData[field] === "object" &&
              updateData[field]._fileStoreKey
            ) {
              // Single file object
              updateData[field] = JSON.stringify([
                `_file/upload/${updateData[field]._fileStoreKey}`,
              ]);
            }
          });

          const defaultPrismaArgs = {
            where: { [primaryKey]: primaryKeyValue },
            data: updateData,
          };
          const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});
          const record = await model.update(prismaArgs);

          if (opts.after) await opts.after(record);
          return { success: true, data: record };
        }
        case "delete": {
          const opts = options.delete || {};
          const primaryKeyValue = payload[primaryKey];
          if (!primaryKeyValue) {
            return {
              success: false,
              message: `${primaryKey} is required for delete`,
              status: 400,
            };
          }

          if (opts.before) await opts.before({ [primaryKey]: primaryKeyValue });

          let result;
          if (options.softDelete?.enabled) {
            // Soft delete - update the record
            const softDeleteData = buildSoftDeleteData(options.softDelete);
            const defaultPrismaArgs = {
              where: { [primaryKey]: primaryKeyValue },
              data: softDeleteData,
            };
            const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});
            result = await model.update(prismaArgs);
          } else {
            // Hard delete - actually delete the record
            const defaultPrismaArgs = {
              where: { [primaryKey]: primaryKeyValue },
            };
            const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});
            result = await model.delete(prismaArgs);
          }

          if (opts.after) await opts.after(result);
          return { success: true, data: result, status: 204 };
        }
        case "bulkDelete": {
          const opts = options.bulkDelete || {};
          const { ids } = payload;
          if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return {
              success: false,
              message: `${primaryKey}s array is required for bulk delete`,
              status: 400,
            };
          }

          if (opts.before) await opts.before({ ids });

          let result;
          if (options.softDelete?.enabled) {
            // Soft delete - update the records
            const softDeleteData = buildSoftDeleteData(options.softDelete);
            const defaultPrismaArgs = {
              where: { [primaryKey]: { in: ids } },
              data: softDeleteData,
            };
            const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});
            result = await model.updateMany(prismaArgs);
          } else {
            // Hard delete - actually delete the records
            const defaultPrismaArgs = { where: { [primaryKey]: { in: ids } } };
            const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});
            result = await model.deleteMany(prismaArgs);
          }

          if (opts.after) await opts.after(result);
          return { success: true, data: result, status: 200 };
        }
        case "listIds": {
          const opts = options.list || {};
          if (opts.before) await opts.before(payload);

          const { sort, order = "asc", ...filters } = payload;

          const defaultWhere: any = {};
          const filterKeys = Object.keys(filters).filter(
            (k) => !["page", "limit", "pageSize", "sort", "order"].includes(k)
          );
          for (const key of filterKeys) {
            const condition = buildFilterCondition(key, filters[key]);
            if (condition !== undefined) {
              defaultWhere[key] = condition;
            }
          }

          // Add soft delete filter
          const softDeleteWhere = buildSoftDeleteWhere(options.softDelete);
          Object.assign(defaultWhere, softDeleteWhere);

          const defaultPrismaArgs = {
            where: defaultWhere,
            orderBy: sort ? { [sort]: order } : undefined,
            select: { [primaryKey]: true },
          };

          const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});

          const records = await model.findMany(prismaArgs);
          const ids = records.map((record: any) => record[primaryKey]);

          if (opts.after) await opts.after(ids);
          return { success: true, data: ids };
        }
        case "listTrash": {
          if (!options.softDelete?.enabled) {
            return {
              success: false,
              message: "Soft delete is not enabled for this model",
              status: 400,
            };
          }

          const opts = options.list || {};
          if (opts.before) await opts.before(payload);

          const {
            page = "1",
            limit = "10",
            pageSize = "10",
            sort,
            order = "asc",
            totalPages, // Exclude from filters
            ...filters
          } = payload;
          const pageNum = parseInt(page, 10);
          const limitNum = parseInt(pageSize || limit, 10);

          const defaultWhere: any = {};
          const filterKeys = Object.keys(filters).filter(
            (k) => !["page", "limit", "pageSize", "sort", "order"].includes(k)
          );
          for (const key of filterKeys) {
            const condition = buildFilterCondition(key, filters[key]);
            if (condition !== undefined) {
              defaultWhere[key] = condition;
            }
          }

          // Add trash filter (opposite of soft delete filter)
          const trashWhere = buildTrashWhere(options.softDelete);
          Object.assign(defaultWhere, trashWhere);

          const defaultPrismaArgs: any = {
            where: defaultWhere,
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
          };

          // Only add orderBy if sort is provided
          if (sort) {
            defaultPrismaArgs.orderBy = { [sort]: order };
          }

          const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});

          // For listTrash, ensure trash filter overrides any default where clause
          const trashWhereOverride = buildTrashWhere(options.softDelete);
          if (
            trashWhereOverride &&
            Object.keys(trashWhereOverride).length > 0
          ) {
            prismaArgs.where = { ...prismaArgs.where, ...trashWhereOverride };
          }

          const [data, total] = await Promise.all([
            model.findMany(prismaArgs),
            model.count({ where: prismaArgs.where }),
          ]);

          const result = { data, total };
          if (opts.after) await opts.after(result);
          return { success: true, data: result };
        }
        case "listTrashIds": {
          if (!options.softDelete?.enabled) {
            return {
              success: false,
              message: "Soft delete is not enabled for this model",
              status: 400,
            };
          }

          const opts = options.list || {};
          if (opts.before) await opts.before(payload);

          const { sort, order = "asc", ...filters } = payload;

          const defaultWhere: any = {};
          const filterKeys = Object.keys(filters).filter(
            (k) => !["page", "limit", "pageSize", "sort", "order"].includes(k)
          );
          for (const key of filterKeys) {
            const condition = buildFilterCondition(key, filters[key]);
            if (condition !== undefined) {
              defaultWhere[key] = condition;
            }
          }

          // Add trash filter (opposite of soft delete filter)
          const trashWhere = buildTrashWhere(options.softDelete);
          Object.assign(defaultWhere, trashWhere);

          const defaultPrismaArgs = {
            where: defaultWhere,
            orderBy: sort ? { [sort]: order } : undefined,
            select: { [primaryKey]: true },
          };

          const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});

          const records = await model.findMany(prismaArgs);
          const ids = records.map((record: any) => record[primaryKey]);

          if (opts.after) await opts.after(ids);
          return { success: true, data: ids };
        }
        case "restore": {
          if (!options.softDelete?.enabled) {
            return {
              success: false,
              message: "Soft delete is not enabled for this model",
              status: 400,
            };
          }

          const opts = options.update || {};
          const primaryKeyValue = payload[primaryKey];
          if (!primaryKeyValue) {
            return {
              success: false,
              message: `${primaryKey} is required for restore`,
              status: 400,
            };
          }

          if (opts.before) await opts.before({ [primaryKey]: primaryKeyValue });

          const restoreData = buildRestoreData(options.softDelete);
          const defaultPrismaArgs = {
            where: { [primaryKey]: primaryKeyValue },
            data: restoreData,
          };
          const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});
          const result = await model.update(prismaArgs);

          if (opts.after) await opts.after(result);
          return { success: true, data: result };
        }
        case "bulkRestore": {
          if (!options.softDelete?.enabled) {
            return {
              success: false,
              message: "Soft delete is not enabled for this model",
              status: 400,
            };
          }

          const opts = options.update || {};
          const { ids } = payload;
          if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return {
              success: false,
              message: `${primaryKey}s array is required for bulk restore`,
              status: 400,
            };
          }

          if (opts.before) await opts.before({ ids });

          const restoreData = buildRestoreData(options.softDelete);
          const defaultPrismaArgs = {
            where: { [primaryKey]: { in: ids } },
            data: restoreData,
          };
          const prismaArgs = deepMerge(defaultPrismaArgs, opts.prisma || {});
          const result = await model.updateMany(prismaArgs);

          if (opts.after) await opts.after(result);
          return { success: true, data: result, status: 200 };
        }
        case "storeState": {
          const { state, ttl = 1000 * 60 * 60 * 24 } = payload; // Default 1 day TTL
          if (!state) {
            return {
              success: false,
              message: "State is required",
              status: 400,
            };
          }

          // Clean up expired states periodically
          cleanupExpiredStates();

          const hash = generateStateHash();
          const expiresAt = Date.now() + ttl;

          stateStorage.set(hash, { state, ttl: expiresAt });

          return { success: true, data: { hash }, status: 201 };
        }
        case "getState": {
          const { hash } = payload;
          if (!hash) {
            return { success: false, message: "Hash is required", status: 400 };
          }

          cleanupExpiredStates();

          const stored = stateStorage.get(hash);
          if (!stored) {
            return {
              success: false,
              message: "State not found or expired",
              status: 404,
            };
          }

          return { success: true, data: stored.state };
        }
        case "updateState": {
          const { hash, state } = payload;
          if (!hash || !state) {
            return {
              success: false,
              message: "Hash and state are required",
              status: 400,
            };
          }

          cleanupExpiredStates();

          const stored = stateStorage.get(hash);
          if (!stored) {
            return {
              success: false,
              message: "State not found or expired",
              status: 404,
            };
          }

          // Update the state but keep the same TTL
          stateStorage.set(hash, { state, ttl: stored.ttl });

          return { success: true, data: { hash } };
        }
        default:
          return {
            success: false,
            message: `Invalid action: ${action}`,
            status: 400,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "An internal server error occurred",
        status: error.statusCode || 500,
      };
    }
  };
}
