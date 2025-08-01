import type {
  CRUDConfig,
  FormFieldConfig,
} from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { Layout } from "@/components/ext/layout/internal.esensi";
import { MenuBarInternal } from "@/components/ext/menu-bar/internal";
import { useCrud } from "@/lib/crud-hook";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/internal.esensi";
import { BundleStatus } from "shared/types";
import type {
  bundle,
  bundle_product,
  product,
  bundle_category,
  category,
} from "shared/models";

// Bundle Product CRUD Configuration
const bundleProductCRUDConfig: CRUDConfig<bundle_product> = {
  entityName: "Produk",
  entityNamePlural: "Produk",
  columns: [
    {
      key: "id_product",
      label: "Produk",
      sortable: true,
      relationConfig: {
        type: "model",
        model: "product",
        labelFields: ["name", "real_price"],
        renderLabel: (product: product) =>
          `${product.name} - ${new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(Number(product.real_price) || 0)}`,
      },
    },
    { key: "qty", label: "Jumlah", sortable: true, width: 100 },
  ],
  filters: [
    {
      key: "id_product",
      label: "Produk",
      type: "relation",
      relationConfig: {
        type: "model",
        model: "product",
        labelFields: ["name"],
        renderLabel: (product: product) => product.name,
      },
    },
  ],
  formFields: [
    {
      name: "id_product",
      label: "Produk",
      type: "relation",
      required: true,
      width: "1/2",
      relationConfig: {
        type: "model",
        model: "product",
        labelFields: ["name", "real_price"],
        renderLabel: (product: product) =>
          `${product.name} - ${new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(Number(product.real_price) || 0)}`,
        filters: { deleted_at: null },
      },
    },
    {
      name: "qty",
      label: "Jumlah",
      type: "number",
      required: true,
      width: "1/4",
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

// Bundle Category CRUD Configuration
const bundleCategoryCRUDConfig: CRUDConfig<bundle_category> = {
  entityName: "Kategori",
  entityNamePlural: "Kategori",
  columns: [
    {
      key: "id_category",
      label: "Kategori",
      sortable: true,
      relationConfig: {
        type: "model",
        model: "category",
        labelFields: ["name"],
        renderLabel: (category: category) => category.name,
      },
    },
    { key: "id_bundle", label: "ID Bundel", sortable: true, width: 150 },
  ],
  filters: [
    {
      key: "id_category",
      label: "Kategori",
      type: "relation",
      relationConfig: {
        type: "model",
        model: "category",
        labelFields: ["name"],
        renderLabel: (category: category) => category.name,
      },
    },
  ],
  formFields: [
    {
      name: "id_category",
      label: "Kategori",
      type: "relation",
      required: true,
      width: "full",
      relationConfig: {
        type: "model",
        model: "category",
        labelFields: ["name", "slug"],
        renderLabel: (category: category) => category.name,
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

const bundleCRUDConfig: CRUDConfig<bundle> = {
  entityName: "Bundel",
  entityNamePlural: "Bundel",
  columns: [
    { key: "name", label: "Nama", sortable: true },
    {
      key: "real_price",
      label: "Harga",
      sortable: true,
      width: 120,
      render: ({ value }) =>
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(Number(value) || 0),
    },
    { 
      key: "strike_price", 
      label: "Harga Coret", 
      sortable: true, 
      width: 120,
      render: ({ value }) =>
        value ? new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(Number(value)) : "-",
    },
    { key: "status", label: "Status", sortable: true, width: 120 },
    { key: "sku", label: "SKU", sortable: true, width: 100 },
    { key: "created_at", label: "Dibuat", sortable: true, width: 150 },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: BundleStatus.DRAFT, label: "Draft" },
        { value: BundleStatus.PUBLISHED, label: "Diterbitkan" },
      ],
    },
    { key: "sku", label: "SKU", type: "text" },
    {
      key: "id_author",
      label: "Penulis",
      type: "relation",
      relationConfig: {
        type: "model",
        model: "author",
        labelFields: ["name"],
        renderLabel: (author: any) => author.name,
      },
    },
  ],
  formFields: ({ showTrash, formMode }) => {
    const baseFields: FormFieldConfig<bundle>[] = [
      {
        name: "name",
        label: "Nama Bundel",
        type: "text",
        required: true,
        width: "2/3",
        section: "basic",
      },
      {
        name: "slug",
        label: "Slug",
        type: "text",
        width: "1/3",
        section: "basic",
      },
      {
        name: "desc",
        label: "Deskripsi",
        type: "textarea",
        width: "full",
        section: "basic",
      },
      {
        name: "real_price",
        label: "Harga Bundel",
        type: "number",
        required: true,
        width: "1/3",
        section: "pricing",
      },
      {
        name: "strike_price",
        label: "Harga Coret",
        type: "number",
        width: "1/3",
        section: "pricing",
      },
      {
        name: "sku",
        label: "SKU",
        type: "text",
        width: "1/3",
        section: "pricing",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        width: "1/2",
        section: "settings",
        options: [
          { value: "draft", label: "Draft" },
          { value: "published", label: "Diterbitkan" },
        ],
      },
      {
        name: "cover",
        label: "Sampul Bundel",
        type: "file",
        width: "1/2",
        section: "media",
      },
      {
        name: "id_author",
        label: "Penulis",
        type: "relation",
        width: "full",
        section: "settings",
        relationConfig: {
          type: "model",
          model: "author",
          labelFields: ["name"],
          renderLabel: (author: any) => author.name,
          filters: { deleted_at: null },
        },
      },
    ];

    return baseFields;
  },
  sections: [
    { id: "basic", title: "Informasi Dasar", description: "Detail utama bundel" },
    {
      id: "pricing",
      title: "Harga & SKU",
      description: "Informasi harga dan kode produk",
    },
    { id: "media", title: "Media", description: "Gambar sampul bundel" },
    {
      id: "settings",
      title: "Pengaturan",
      description: "Status dan penulis bundel",
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
  nested: [
    {
      title: "Produk",
      config: bundleProductCRUDConfig,
      parentField: "id",
      nestedParentField: "id_bundle",
      model: "bundle_product",
      showInForm: true,
      showInDetail: true,
      position: "tab",
    },
    {
      title: "Kategori",
      config: bundleCategoryCRUDConfig,
      parentField: "id",
      nestedParentField: "id_bundle",
      model: "bundle_category",
      showInForm: true,
      showInDetail: true,
      position: "tab",
    },
  ],
};

export default () => {
  const local = useLocal({ loading: false });
  const crud = useCrud<bundle>(api.bundles, {
    breadcrumbConfig: {
      renderNameLabel: async (bundle) => {
        return bundle.name || "Bundel Tanpa Nama";
      },
    },
  });

  return (
    <Layout loading={local.loading}>
      <MenuBarInternal />
      <main className="flex-1 flex p-4">
        <ECrud
          config={bundleCRUDConfig}
          urlState={{ baseUrl: "/bundles" }}
          apiFunction={api.bundles}
          {...crud}
        />
      </main>
    </Layout>
  );
};