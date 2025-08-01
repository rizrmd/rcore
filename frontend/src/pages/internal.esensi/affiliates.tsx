import type {
  CRUDConfig,
} from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { useCrud } from "@/lib/crud-hook";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/internal.esensi";
import type { affiliate } from "shared/models";

const affiliateCRUDConfig: CRUDConfig<affiliate> = {
  entityName: "Affiliate",
  entityNamePlural: "Affiliate",
  columns: [
    { key: "name", label: "Nama", sortable: true },
    { 
      key: "created_at", 
      label: "Tanggal Dibuat", 
      sortable: true, 
      width: 150,
      render: ({ value }) => 
        value ? new Date(value).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) : "-"
    },
    { 
      key: "updated_at", 
      label: "Terakhir Diperbarui", 
      sortable: true, 
      width: 150,
      render: ({ value }) => 
        value ? new Date(value).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) : "-"
    },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    { key: "created_at", label: "Tanggal Dibuat", type: "daterange" },
    { key: "deleted_at", label: "Tanggal Dihapus", type: "daterange" },
  ],
  formFields: [
    {
      name: "name",
      label: "Nama Affiliate",
      type: "text",
      required: true,
      width: "full",
    },
  ],
  actions: {
    list: {
      create: true,
      view: true,
      edit: true,
      delete: true,
      search: true,
      filter: true,
      sort: true,
      pagination: true,
      bulkSelect: true,
      viewTrash: true,
    },
  },
  softDelete: {
    enabled: true,
    field: "deleted_at",
  },
};

export default () => {
  const local = useLocal({ loading: false });
  const crud = useCrud<affiliate>(api.asc, {
    breadcrumbConfig: {
      renderNameLabel: async (affiliate) => {
        return affiliate.name || "Affiliate Tanpa Nama";
      },
    },
  });

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1 flex p-4">
        <ECrud
          config={affiliateCRUDConfig}
          urlState={{ baseUrl: "/affiliates" }}
          apiFunction={api.asc}
          {...crud}
        />
      </main>
    </Layout>
  );
};