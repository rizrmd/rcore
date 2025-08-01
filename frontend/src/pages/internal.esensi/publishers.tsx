import type {
  CRUDConfig,
} from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { useCrud } from "@/lib/crud-hook";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/internal.esensi";
import type { publisher } from "shared/models";

const publisherCRUDConfig: CRUDConfig<publisher> = {
  entityName: "Penerbit",
  entityNamePlural: "Penerbit",
  columns: [
    { key: "name", label: "Nama", sortable: true },
    {
      key: "logo",
      label: "Logo",
      sortable: false,
      width: 80,
      render: ({ value }) =>
        value ? (
          <img
            src={value}
            alt="Logo"
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-gray-200"></div>
        ),
    },
    {
      key: "description",
      label: "Deskripsi",
      sortable: false,
      render: ({ value }) =>
        value
          ? value.length > 100
            ? value.substring(0, 100) + "..."
            : value
          : "-",
    },
    { key: "website", label: "Website", sortable: false, width: 150 },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    { key: "description", label: "Deskripsi", type: "text" },
    { key: "website", label: "Website", type: "text" },
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
      name: "logo",
      label: "Logo",
      type: "file",
      width: "1/2",
    },
    {
      name: "description",
      label: "Deskripsi",
      type: "textarea",
      width: "full",
    },
    {
      name: "website",
      label: "Website",
      type: "url",
      width: "1/2",
    },
    {
      name: "address",
      label: "Alamat",
      type: "textarea",
      width: "1/2",
    },
    {
      name: "bank_account_number",
      label: "Nomor Rekening",
      type: "text",
      width: "1/3",
    },
    {
      name: "bank_account_provider",
      label: "Bank",
      type: "text",
      width: "1/3",
    },
    {
      name: "bank_account_holder",
      label: "Pemilik Rekening",
      type: "text",
      width: "1/3",
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
  const crud = useCrud<publisher>(api.publishers, {
    breadcrumbConfig: {
      renderNameLabel: async (publisher) => {
        return publisher.name || "Penerbit Tanpa Nama";
      },
    },
  });

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1 flex p-4">
        <ECrud
          config={publisherCRUDConfig}
          urlState={{ baseUrl: "/publishers" }}
          apiFunction={api.publishers}
          {...crud}
        />
      </main>
    </Layout>
  );
};