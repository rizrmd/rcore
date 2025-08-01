import type {
  CRUDConfig,
} from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { useCrud } from "@/lib/crud-hook";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/internal.esensi";
import type { customer } from "shared/models";

const customerCRUDConfig: CRUDConfig<customer> = {
  entityName: "Pelanggan",
  entityNamePlural: "Pelanggan",
  columns: [
    { key: "name", label: "Nama", sortable: true },
    { key: "email", label: "Email", sortable: true, width: 200 },
    { key: "whatsapp", label: "WhatsApp", sortable: true, width: 150 },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "whatsapp", label: "WhatsApp", type: "text" },
  ],
  formFields: [
    {
      name: "name",
      label: "Nama",
      type: "text",
      required: true,
      width: "1/2",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      width: "1/2",
    },
    {
      name: "whatsapp",
      label: "WhatsApp",
      type: "text",
      required: true,
      width: "1/2",
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
  const crud = useCrud<customer>(api.customers, {
    breadcrumbConfig: {
      renderNameLabel: async (customer) => {
        return customer.name || customer.email || "Pelanggan Tanpa Nama";
      },
    },
  });

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1 flex p-4">
        <ECrud
          config={customerCRUDConfig}
          urlState={{ baseUrl: "/customers" }}
          apiFunction={api.customers}
          {...crud}
        />
      </main>
    </Layout>
  );
};