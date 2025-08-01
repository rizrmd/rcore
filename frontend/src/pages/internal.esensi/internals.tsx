import type {
  CRUDConfig,
} from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { useCrud } from "@/lib/crud-hook";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/internal.esensi";
import type { internal } from "shared/models";

const internalCRUDConfig: CRUDConfig<internal> = {
  entityName: "Staff Internal",
  entityNamePlural: "Staff Internal",
  columns: [
    { key: "name", label: "Nama", sortable: true },
    {
      key: "is_management",
      label: "Management",
      sortable: true,
      width: 100,
      render: ({ value }) => (value ? "✓" : "✗"),
    },
    {
      key: "is_it",
      label: "IT",
      sortable: true,
      width: 80,
      render: ({ value }) => (value ? "✓" : "✗"),
    },
    {
      key: "is_sales_and_marketing",
      label: "Sales & Marketing",
      sortable: true,
      width: 140,
      render: ({ value }) => (value ? "✓" : "✗"),
    },
    {
      key: "is_support",
      label: "Support",
      sortable: true,
      width: 100,
      render: ({ value }) => (value ? "✓" : "✗"),
    },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    { key: "is_management", label: "Management", type: "boolean" },
    { key: "is_it", label: "IT", type: "boolean" },
    { key: "is_sales_and_marketing", label: "Sales & Marketing", type: "boolean" },
    { key: "is_support", label: "Support", type: "boolean" },
  ],
  formFields: [
    {
      name: "user_email" as any,
      label: "Email User",
      type: "text",
      required: true,
      width: "1/2",
      placeholder: "user@domain.com",
      description: "Email user yang akan didaftarkan sebagai internal user",
    },
    {
      name: "name",
      label: "Nama Staff Internal",
      type: "text",
      required: true,
      width: "1/2",
      description: "Nama untuk ditampilkan dalam sistem internal",
    },
    {
      name: "is_management",
      label: "Management",
      type: "checkbox",
      width: "1/4",
      description: "Akses penuh untuk mengelola sistem",
    },
    {
      name: "is_it",
      label: "IT",
      type: "checkbox",
      width: "1/4",
      description: "Akses teknis dan konfigurasi sistem",
    },
    {
      name: "is_sales_and_marketing",
      label: "Sales & Marketing",
      type: "checkbox",
      width: "1/4",
      description: "Akses laporan penjualan dan marketing",
    },
    {
      name: "is_support",
      label: "Support",
      type: "checkbox",
      width: "1/4",
      description: "Akses untuk memberikan dukungan pelanggan",
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
  const crud = useCrud<internal>(api.internals, {
    breadcrumbConfig: {
      renderNameLabel: async (internal) => {
        return internal.name || "Staff Tanpa Nama";
      },
    },
  });

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1 flex p-4">
        <ECrud
          config={internalCRUDConfig}
          urlState={{ baseUrl: "/internals" }}
          apiFunction={api.internals}
          {...crud}
        />
      </main>
    </Layout>
  );
};