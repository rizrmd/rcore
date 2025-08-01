import type {
  CRUDConfig,
  FormFieldConfig,
} from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { Layout } from "@/components/ext/layout/publish.esensi";
import { MenuBarPublish } from "@/components/ext/menu-bar/publish";
import { useCrud } from "@/lib/crud-hook";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/publish.esensi";
import type { publisher, publisher_author, author } from "shared/models";

// Publisher Author CRUD Configuration
const publisherAuthorCRUDConfig: CRUDConfig<publisher_author> = {
  entityName: "Relasi Penulis",
  entityNamePlural: "Relasi Penulis",
  columns: [
    {
      key: "author_id",
      label: "Penulis",
      sortable: true,
      relationConfig: {
        type: "model",
        model: "author",
        labelFields: ["name"],
        renderLabel: (author: author) => author.name,
      },
    },
  ],
  filters: [
    {
      key: "author_id",
      label: "Penulis",
      type: "relation",
      relationConfig: {
        type: "model",
        model: "author",
        labelFields: ["name"],
        renderLabel: (author: author) => author.name,
      },
    },
  ],
  formFields: [
    {
      name: "author_id",
      label: "Penulis",
      type: "relation",
      required: true,
      width: "full",
      relationConfig: {
        type: "model",
        model: "author",
        labelFields: ["name", "avatar"],
        renderLabel: (author: author) => author.name,
        filters: { deleted_at: null },
      },
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
      pagination: false,
      bulkSelect: true,
      viewTrash: false,
    },
  },
};

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
      key: "website",
      label: "Website",
      sortable: false,
      render: ({ value }) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {value.length > 30 ? value.substring(0, 30) + "..." : value}
          </a>
        ) : (
          "-"
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
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    { key: "description", label: "Deskripsi", type: "text" },
    { key: "website", label: "Website", type: "text" },
  ],
  formFields: ({ showTrash, formMode }) => {
    const baseFields: FormFieldConfig<publisher>[] = [
      {
        name: "name",
        label: "Nama Penerbit",
        type: "text",
        required: true,
        width: "2/3",
      },
      {
        name: "logo",
        label: "Logo",
        type: "file",
        width: "1/3",
      },
      {
        name: "description",
        label: "Deskripsi",
        type: "textarea",
        width: "full",
      },
      {
        name: "website",
        label: "URL Website",
        type: "url",
        width: "1/2",
      },
      {
        name: "address",
        label: "Alamat",
        type: "textarea",
        width: "1/2",
      },
    ];

    return baseFields;
  },
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
  nested: [
    {
      title: "Penulis",
      config: publisherAuthorCRUDConfig,
      parentField: "id",
      nestedParentField: "publisher_id",
      model: "publisher_author",
      showInForm: true,
      showInDetail: true,
      position: "tab",
    },
  ],
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
      <MenuBarPublish />
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
