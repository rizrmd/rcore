import type {
  CRUDConfig,
} from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { useCrud } from "@/lib/crud-hook";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/internal.esensi";
import type { author } from "shared/models";

const authorCRUDConfig: CRUDConfig<author> = {
  entityName: "Penulis",
  entityNamePlural: "Penulis",
  columns: [
    { key: "name", label: "Nama", sortable: true },
    {
      key: "avatar",
      label: "Foto Profil",
      sortable: false,
      width: 80,
      render: ({ value }) =>
        value ? (
          <img
            src={value}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        ),
    },
    {
      key: "biography",
      label: "Biografi",
      sortable: false,
      render: ({ value }) =>
        value
          ? value.length > 100
            ? value.substring(0, 100) + "..."
            : value
          : "-",
    },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    { key: "biography", label: "Biografi", type: "text" },
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
      name: "avatar",
      label: "Foto Profil",
      type: "file",
      width: "1/2",
    },
    {
      name: "biography",
      label: "Biografi",
      type: "textarea",
      width: "full",
    },
    {
      name: "social_media",
      label: "Media Sosial (JSON)",
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
  const crud = useCrud<author>(api.authors, {
    breadcrumbConfig: {
      renderNameLabel: async (author) => {
        return author.name || "Penulis Tanpa Nama";
      },
    },
  });

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1 flex p-4">
        <ECrud
          config={authorCRUDConfig}
          urlState={{ baseUrl: "/authors" }}
          apiFunction={api.authors}
          {...crud}
        />
      </main>
    </Layout>
  );
};