import type {
  CRUDConfig,
} from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { useCrud } from "@/lib/crud-hook";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/internal.esensi";
import type { book } from "shared/models";

const bookCRUDConfig: CRUDConfig<book> = {
  entityName: "Buku",
  entityNamePlural: "Buku",
  columns: [
    {
      key: "cover",
      label: "Cover",
      sortable: false,
      width: 80,
      render: ({ value }) =>
        value ? (
          <img
            src={value}
            alt="Cover"
            className="w-12 h-16 rounded object-cover"
          />
        ) : (
          <div className="w-12 h-16 rounded bg-gray-200"></div>
        ),
    },
    { key: "name", label: "Judul", sortable: true },
    { key: "status", label: "Status", sortable: true, width: 120 },
    { key: "submitted_price", label: "Harga", sortable: true, width: 100 },
    {
      key: "is_chapter",
      label: "Tipe",
      sortable: true,
      width: 100,
      render: ({ value }) => (value ? "Per Chapter" : "Buku Penuh"),
    },
    { key: "published_date", label: "Tanggal Terbit", sortable: true, width: 130 },
  ],
  filters: [
    { key: "name", label: "Judul", type: "text" },
    { 
      key: "status", 
      label: "Status", 
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Diajukan" },
        { value: "published", label: "Diterbitkan" },
        { value: "rejected", label: "Ditolak" },
      ]
    },
    { key: "is_chapter", label: "Per Chapter", type: "boolean" },
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
      width: "1/3",
      options: [
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Diajukan" },
        { value: "published", label: "Diterbitkan" },
        { value: "rejected", label: "Ditolak" },
      ],
    },
    {
      name: "currency",
      label: "Mata Uang",
      type: "select",
      required: true,
      width: "1/3",
      options: [
        { value: "IDR", label: "IDR" },
        { value: "USD", label: "USD" },
      ],
    },
    {
      name: "is_chapter",
      label: "Per Chapter",
      type: "checkbox",
      width: "1/3",
    },
    {
      name: "cover",
      label: "Cover Buku",
      type: "file",
      width: "1/2",
    },
    {
      name: "product_file",
      label: "File Produk",
      type: "file",
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
  const crud = useCrud<book>(api.books, {
    breadcrumbConfig: {
      renderNameLabel: async (book) => {
        return book.name || "Buku Tanpa Judul";
      },
    },
  });

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1 flex p-4">
        <ECrud
          config={bookCRUDConfig}
          urlState={{ baseUrl: "/books" }}
          apiFunction={api.books}
          {...crud}
        />
      </main>
    </Layout>
  );
};