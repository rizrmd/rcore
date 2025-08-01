import { defineAPI } from "rlib/server";
import { crudHandler, type CrudApiOptions } from "../../lib/crud-handler";

const cfgCrudOptions: CrudApiOptions = {
  // Specify that this table uses 'key' as primary key instead of 'id'
  primaryKey: "key",

  list: {
    prisma: {
      orderBy: { key: "asc" },
    },
  },
  get: {
    prisma: {},
  },
  create: {
    before: async (data) => {
      let processedValue = data.value || "";

      // Handle JSONB-like processing for string column - store compactly
      if (typeof processedValue === "string") {
        processedValue = processedValue.trim();

        // If the value is not empty, try to compact JSON for storage
        if (processedValue && processedValue !== "") {
          try {
            // Try to parse and re-stringify without formatting (compact storage)
            const parsed = JSON.parse(processedValue);
            processedValue = JSON.stringify(parsed); // Compact format
          } catch {
            // If not valid JSON, it's a plain string - keep as is
          }
        }
      }

      return {
        key: data.key?.trim() || "",
        value: processedValue,
      };
    },
  },
  update: {
    before: async (data) => {
      // For cfg table, we only allow updating the value field
      // The key field should not be updated as it's the primary key
      let processedValue = data.value || "";

      // Handle JSONB-like processing for string column - store compactly
      if (typeof processedValue === "string") {
        processedValue = processedValue.trim();

        // If the value is not empty, try to compact JSON for storage
        if (processedValue && processedValue !== "") {
          try {
            // Try to parse and re-stringify without formatting (compact storage)
            const parsed = JSON.parse(processedValue);
            processedValue = JSON.stringify(parsed); // Compact format
          } catch {
            // If not valid JSON, it's a plain string - keep as is
          }
        }
      }

      return {
        value: processedValue,
      };
    },
  },
  // Note: cfg table doesn't use soft delete, so no softDelete configuration
};

export default defineAPI({
  name: "cfg",
  url: "/api/internal/cfg",
  async handler(payload: any) {
    try {
      // Call the CRUD handler
      const handler = crudHandler("cfg", cfgCrudOptions);
      return await handler.call(this, payload);
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Authentication failed",
        status: 401,
      };
    }
  },
});
