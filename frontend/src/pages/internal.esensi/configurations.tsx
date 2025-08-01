import { ECrud } from "@/components/core/ecrud/ecrud";
import type {
  CRUDConfig,
  FormFieldConfig,
} from "@/components/core/ecrud/types";
import {
  Layout,
  current as layoutCurrent,
} from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import NoAccess from "@/components/ext/no-access";
import { useCrud } from "@/lib/crud-hook";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import type { cfg } from "shared/models";
import type { BaseEntity } from "@/components/core/ecrud/types";

// Extend cfg to be compatible with BaseEntity by treating key as id
type ConfigurationEntity = cfg & BaseEntity & {
  id: string; // Use key as id for BaseEntity compatibility
};

const configurationsCRUDConfig: CRUDConfig<ConfigurationEntity> = {
  entityName: "Configuration",
  entityNamePlural: "Configurations",
  columns: [
    { key: "key", label: "Key", sortable: true, width: 200 },
    {
      key: "value",
      label: "Value",
      sortable: true,
      render: ({ value }) => {
        if (!value) return "";

        try {
          // Try to parse and format JSON for beautiful display
          const parsed = JSON.parse(value);
          return (
            <pre className="text-xs font-mono bg-gray-50 p-2 rounded max-w-md overflow-auto">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          );
        } catch {
          // If not valid JSON, display as plain text with ellipsis if too long
          const displayValue =
            value.length > 100 ? value.substring(0, 100) + "..." : value;
          return (
            <span className="text-sm" title={value}>
              {displayValue}
            </span>
          );
        }
      },
    },
  ],
  filters: [
    { key: "key", label: "Key", type: "text" },
    { key: "value", label: "Value", type: "text" },
  ],
  formFields: ({ formMode }) => {
    const baseFields: FormFieldConfig<cfg>[] = [
      {
        name: "key",
        label: "Key",
        type: "text",
        required: true,
        width: "1/2",
        section: "basic",
        disabled: formMode === "edit", // Disable editing key in edit mode since it's the primary key
      },
      {
        name: "value",
        label: "Value",
        type: "jsonb",
        required: true,
        width: "1/2",
        section: "basic",
      },
    ];

    return baseFields;
  },
  sections: [
    {
      id: "basic",
      title: "Configuration Details",
      description: "Key-value configuration settings",
    },
  ],
  actions: {
    list: {
      create: true,
      view: true,
      edit: true,
      delete: false,
      search: true,
      filter: true,
      sort: true,
      pagination: true,
      bulkSelect: true,
      viewTrash: false,
    },
  },
};

export default () => {
  const local = useLocal({ loading: false });
  const crud = useCrud<ConfigurationEntity>(api.cfg, {
    primaryKey: "key", // cfg table uses 'key' as primary key instead of 'id'
    breadcrumbConfig: {
      renderNameLabel: async (config) => {
        return config.key || "Configuration";
      },
    },
  });

  // Check if user has IT or management access
  const currentUser = layoutCurrent.user;
  if (!currentUser?.internal?.is_it && !currentUser?.internal?.is_management) {
    return <NoAccess />;
  }

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1 flex p-4">
        <ECrud
          config={configurationsCRUDConfig}
          urlState={{ baseUrl: "/configurations" }}
          apiFunction={api.cfg}
          {...crud}
        />
      </main>
    </Layout>
  );
};
