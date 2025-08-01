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
import { ProductStatus } from "shared/types";
import type {
  product,
  product_category,
  category,
  product_rating,
  customer,
} from "shared/models";

// Product Category CRUD Configuration
const productCategoryCRUDConfig: CRUDConfig<product_category> = {
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
    { key: "id_product", label: "ID Produk", sortable: true, width: 150 },
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

// Product Rating CRUD Configuration
const productRatingCRUDConfig: CRUDConfig<product_rating> = {
  entityName: "Rating",
  entityNamePlural: "Rating",
  columns: [
    {
      key: "customer_id",
      label: "Pelanggan",
      sortable: true,
      relationConfig: {
        type: "model",
        model: "customer",
        labelFields: ["name"],
        renderLabel: (customer: customer) => customer.name,
      },
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      width: 100,
      render: (value) => `★ ${value}/5`,
    },
    { key: "created_at", label: "Tanggal", sortable: true, width: 150 },
  ],
  filters: [{ key: "rating", label: "Rating", type: "number" }],
  formFields: [
    {
      name: "customer_id",
      label: "Pelanggan",
      type: "relation",
      required: true,
      width: "1/2",
      relationConfig: {
        type: "model",
        model: "customer",
        labelFields: ["name", "email"],
        renderLabel: (customer: customer) =>
          `${customer.name} (${customer.email})`,
      },
    },
    {
      name: "rating",
      label: "Rating (1-5)",
      type: "number",
      required: true,
      width: "1/2",
    },
  ],
  actions: {
    list: {
      create: false, // Usually created by customers
      view: true,
      edit: false,
      delete: true,
      search: true,
      filter: true,
      sort: true,
      pagination: false,
      bulkSelect: false,
      viewTrash: false,
    },
  },
};

const productCRUDConfig: CRUDConfig<product> = {
  entityName: "Produk",
  entityNamePlural: "Produk",
  columns: [
    { key: "name", label: "Nama", sortable: true },
    { key: "id_author", label: "Penulis", sortable: true },
    {
      key: "real_price",
      label: "Harga",
      sortable: true,
      width: 120,
      render: ({ value }) =>
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(value || 0),
    },
    { key: "status", label: "Status", sortable: true, width: 120 },
    {
      key: "is_physical",
      label: "Tipe",
      sortable: true,
      width: 100,
      render: (value) => (value ? "Fisik" : "Digital"),
    },
  ],
  filters: [
    { key: "name", label: "Nama", type: "text" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: ProductStatus.PUBLISHED, label: "Diterbitkan" },
        { value: ProductStatus.PAUSED, label: "Dijeda" },
        { value: ProductStatus.DISCONTINUED, label: "Dihentikan" },
      ],
    },
    {
      key: "is_physical",
      label: "Tipe Produk",
      type: "select",
      options: [
        { value: "true", label: "Fisik" },
        { value: "false", label: "Digital" },
      ],
    },
  ],
  formFields: ({ showTrash, formMode }) => {
    const baseFields: FormFieldConfig<product>[] = [
      {
        name: "name",
        label: "Nama Produk",
        type: "text",
        required: true,
        width: "2/3",
      },
      {
        name: "sku",
        label: "SKU",
        type: "text",
        width: "1/3",
      },
      {
        name: "desc",
        label: "Deskripsi",
        type: "textarea",
        width: "full",
      },
      {
        name: "real_price",
        label: "Harga",
        type: "number",
        required: true,
        width: "1/4",
      },
      {
        name: "strike_price",
        label: "Harga Coret",
        type: "number",
        width: "1/4",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        width: "1/4",
        options: [
          { value: "published", label: "Diterbitkan" },
          { value: "paused", label: "Dijeda" },
          { value: "discontinued", label: "Dihentikan" },
        ],
      },
      {
        name: "is_physical",
        label: "Produk Fisik",
        type: "checkbox",
        width: "1/3",
      },
      {
        name: "weight",
        label: "Berat (gram)",
        type: "number",
        width: "1/4",
      },
      {
        name: "slug",
        label: "Slug",
        type: "text",
        width: "1/4",
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
      title: "Kategori",
      config: productCategoryCRUDConfig,
      parentField: "id",
      nestedParentField: "id_product",
      model: "product_category",
      showInForm: true,
      showInDetail: true,
      position: "tab",
    },
    {
      title: "Rating & Ulasan",
      config: productRatingCRUDConfig,
      parentField: "id",
      nestedParentField: "id_product",
      model: "product_rating",
      showInForm: false,
      showInDetail: true,
      position: "tab",
    },
  ],
};

export default () => {
  const local = useLocal({ loading: false });
  const crud = useCrud<product>(api.products, {
    breadcrumbConfig: {
      renderNameLabel: async (product) => {
        return product.name || "Produk Tanpa Nama";
      },
    },
  });

  return (
    <Layout loading={local.loading}>
      <MenuBarPublish />
      <main className="flex-1 flex p-4">
        <ECrud
          config={productCRUDConfig}
          urlState={{ baseUrl: "/products" }}
          apiFunction={api.products}
          {...crud}
        />
      </main>
    </Layout>
  );
};
