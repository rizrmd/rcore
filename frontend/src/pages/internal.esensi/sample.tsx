import type {
  CRUDConfig,
  FormFieldConfig,
} from "@/components/core/ecrud/ecrud";
import { ECrud } from "@/components/core/ecrud/ecrud";
import { useCrud } from "@/lib/crud-hook";
import { api } from "@/lib/gen/internal.esensi";
import type { customer, customer_address } from "shared/models";

// Customer Address CRUD Configuration
const customerAddressCRUDConfig: CRUDConfig<customer_address> = {
  entityName: "Address",
  entityNamePlural: "Addresses",
  columns: [
    { key: "address", label: "Address", sortable: true },
    { key: "city", label: "City", sortable: true },
    { key: "province", label: "Province", sortable: true },
    {
      key: "is_primary",
      label: "Primary",
      sortable: true,
      render: (value) => (value ? "Yes" : "No"),
    },
  ],
  filters: [
    { key: "address", label: "Address", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "province", label: "Province", type: "text" },
  ],
  formFields: [
    {
      name: "address",
      label: "Address",
      type: "textarea",
      required: true,
      width: "full",
    },
    {
      name: "city",
      label: "City",
      type: "text",
      required: true,
      width: "1/3",
    },
    {
      name: "province",
      label: "Province",
      type: "text",
      required: true,
      width: "1/3",
    },
    {
      name: "postal_code",
      label: "Postal Code",
      type: "text",
      required: true,
      width: "1/3",
    },
    {
      name: "regency",
      label: "Regency",
      type: "text",
      width: "1/2",
    },
    {
      name: "village",
      label: "Village",
      type: "text",
      width: "1/2",
    },
    {
      name: "is_primary",
      label: "Primary Address",
      type: "checkbox",
      width: "1/4",
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
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
      pagination: false,
      bulkSelect: true,
      viewTrash: false,
    },
  },
};

const customerCRUDConfig: CRUDConfig<customer> = {
  entityName: "Customer",
  entityNamePlural: "Customers",
  columns: [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "whatsapp", label: "Whatsapp", sortable: true },
    {
      key: "id_default_address",
      label: "Default Address",
      sortable: true,
      relationConfig: {
        type: "model",
        model: "customer_address",
        labelFields: ["address", "city", "province"],
        renderLabel: (item: customer_address) =>
          `${item.address}, ${item.city} - ${item.province}`,
        filters: {
          deleted_at: null, // Only show non-deleted addresses
        },
      },
    },
  ],
  filters: [
    { key: "name", label: "Name", type: "text" },
    { key: "email", label: "Email", type: "text" },
    {
      key: "id_default_address",
      label: "Default Address",
      type: "relation",
      relationConfig: {
        type: "model",
        model: "customer_address",
        labelFields: ["address", "city", "province"],
        renderLabel: (item: customer_address) =>
          `${item.address}, ${item.city} - ${item.province}`,
        filters: {
          deleted_at: null, // Only show non-deleted addresses
        },
      },
    },
    { key: "deleted_at", label: "Del At", type: "daterange" },
  ],
  formFields: ({ showTrash, formMode }) => {
    const baseFields: FormFieldConfig<customer>[] = [
      {
        name: "name",
        label: "Name",
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
        label: "Whatsapp",
        type: "text",
        required: true,
        width: "1/3",
      },
      {
        name: "id_default_address",
        label: "Default Address",
        type: "relation",
        required: false,
        width: "2/3",
        relationConfig: {
          type: "model",
          model: "customer_address",
          labelFields: ["address", "city", "province"], // Fields for backend to load
          renderLabel: (item: customer_address) =>
            `${item.address}, ${item.city} - ${item.province}`, // Custom label composition
          filters: {
            deleted_at: null, // Only show non-deleted addresses
          },
          pageSize: 50, // Custom page size (default: 100)
          enableSearch: true, // Enable search functionality (default: true)
        },
      },
    ];

    // Only show deleted_at field when in trash mode and editing
    if (showTrash && formMode === "edit") {
      baseFields.push({
        name: "deleted_at",
        label: "Deleted At",
        type: "datetime",
        required: false,
        width: "1/4",
      });
    }

    return baseFields;
  },
  actions: {
    list: {
      create: false,
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
      title: "Customer Addresses",
      config: customerAddressCRUDConfig,
      parentField: "id",
      nestedParentField: "id_customer",
      model: "customer_address", // Simple model reference - ECrud handles the API calls automatically
      showInForm: true,
      showInDetail: true,
      position: "tab",
    },
  ],
};

export default () => {
  const crud = useCrud<customer>(api.sample, {
    breadcrumbConfig: {
      renderNameLabel: async (customer) => {
        return `${customer.name} (${customer.email})`;
      },
    },
  });

  return (
    <main className="flex-1 flex p-4">
      <ECrud
        config={customerCRUDConfig}
        urlState={{ baseUrl: "/sample" }}
        apiFunction={api.sample}
        {...crud}
      />
    </main>
  );
};
