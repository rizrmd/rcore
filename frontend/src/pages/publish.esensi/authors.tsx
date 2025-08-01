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
import type { author, author_address, book } from "shared/models";

// Author Address CRUD Configuration
const authorAddressCRUDConfig: CRUDConfig<author_address> = {
  entityName: "Alamat",
  entityNamePlural: "Alamat",
  columns: [
    { key: "address", label: "Alamat", sortable: true },
    { key: "city", label: "Kota", sortable: true },
    { key: "province", label: "Provinsi", sortable: true },
    {
      key: "is_primary",
      label: "Utama",
      sortable: true,
      render: (value) => (value ? "Ya" : "Tidak"),
    },
  ],
  filters: [
    { key: "address", label: "Alamat", type: "text" },
    { key: "city", label: "Kota", type: "text" },
    { key: "province", label: "Provinsi", type: "text" },
  ],
  formFields: [
    {
      name: "address",
      label: "Alamat",
      type: "textarea",
      required: true,
      width: "full",
    },
    {
      name: "city",
      label: "Kota",
      type: "text",
      required: true,
      width: "1/3",
    },
    {
      name: "province",
      label: "Provinsi",
      type: "text",
      required: true,
      width: "1/3",
    },
    {
      name: "postal_code",
      label: "Kode Pos",
      type: "text",
      required: true,
      width: "1/3",
    },
    {
      name: "regency",
      label: "Kabupaten",
      type: "text",
      width: "1/2",
    },
    {
      name: "village",
      label: "Kelurahan/Desa",
      type: "text",
      width: "1/2",
    },
    {
      name: "is_primary",
      label: "Alamat Utama",
      type: "checkbox",
      width: "1/4",
    },
    {
      name: "notes",
      label: "Catatan",
      type: "textarea",
      width: "3/4",
    },
    {
      name: "id_subdistrict",
      label: "ID Kecamatan",
      type: "text",
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
      pagination: false,
      bulkSelect: true,
      viewTrash: false,
    },
  },
};

// Book CRUD Configuration (for nested view)
const bookCRUDConfig: CRUDConfig<book> = {
  entityName: "Buku",
  entityNamePlural: "Buku",
  columns: [
    { key: "name", label: "Judul", sortable: true },
    { key: "status", label: "Status", sortable: true, width: 120 },
    { key: "submitted_price", label: "Harga", sortable: true, width: 120 },
    {
      key: "is_chapter",
      label: "Tipe",
      sortable: true,
      width: 100,
      render: (value) => (value ? "Per Chapter" : "Buku Penuh"),
    },
    { key: "name", label: "Nama", sortable: true, width: 150 },
  ],
  filters: [
    { key: "name", label: "Judul", type: "text" },
    { key: "status", label: "Status", type: "text" },
  ],
  formFields: [
    {
      name: "name",
      label: "Judul Buku",
      type: "text",
      required: true,
      width: "2/3",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      width: "1/3",
    },
    {
      name: "desc",
      label: "Deskripsi",
      type: "textarea",
      width: "full",
    },
    {
      name: "submitted_price",
      label: "Harga",
      type: "number",
      required: true,
      width: "1/2",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      width: "1/2",
      options: [
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Diajukan" },
        { value: "published", label: "Diterbitkan" },
        { value: "rejected", label: "Ditolak" },
      ],
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
    { key: "name", label: "Nama", sortable: true, width: 150 },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    { key: "biography", label: "Biografi", type: "text" },
  ],
  formFields: ({ showTrash, formMode }) => {
    const baseFields: FormFieldConfig<author>[] = [
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
        width: "full",
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
      title: "Buku",
      config: bookCRUDConfig,
      parentField: "id",
      nestedParentField: "id_author",
      model: "book",
      showInForm: false,
      showInDetail: true,
      position: "tab",
    },
    {
      title: "Alamat",
      config: authorAddressCRUDConfig,
      parentField: "id",
      nestedParentField: "id_author",
      model: "author_address",
      showInForm: true,
      showInDetail: true,
      position: "tab",
    },
  ],
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
      <MenuBarPublish />
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
