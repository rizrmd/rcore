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
import type { withdrawal, author, publisher } from "shared/models";

const withdrawalCRUDConfig: CRUDConfig<withdrawal> = {
  entityName: "Penarikan",
  entityNamePlural: "Penarikan",
  columns: [
    {
      key: "amount",
      label: "Jumlah",
      sortable: true,
      width: 120,
      render: ({ value }) =>
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(value || 0),
    },
    {
      key: "id_author",
      label: "Penulis",
      sortable: true,
      relationConfig: {
        type: "model",
        model: "author",
        labelFields: ["name"],
        renderLabel: (author: author) => author.name,
      },
    },
    {
      key: "id_publisher",
      label: "Penerbit",
      sortable: true,
      relationConfig: {
        type: "model",
        model: "publisher",
        labelFields: ["name"],
        renderLabel: (publisher: publisher) => publisher.name,
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: 120,
      render: ({ value }) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-blue-100 text-blue-800",
          processed: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[value as keyof typeof statusColors] ||
              "bg-gray-100 text-gray-800"
            }`}
          >
            {value}
          </span>
        );
      },
    },
    { key: "requested_at", label: "Diminta", sortable: true, width: 150 },
    { key: "processed_at", label: "Diproses", sortable: true, width: 150 },
  ],
  filters: [
    {
      key: "id_author",
      label: "Penulis",
      type: "relation",
      relationConfig: {
        type: "model",
        model: "author",
        labelFields: ["name"],
        renderLabel: (author: author) => author.name,
      },
    },
    {
      key: "id_publisher",
      label: "Penerbit",
      type: "relation",
      relationConfig: {
        type: "model",
        model: "publisher",
        labelFields: ["name"],
        renderLabel: (publisher: publisher) => publisher.name,
      },
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "pending", label: "Menunggu" },
        { value: "approved", label: "Disetujui" },
        { value: "processed", label: "Diproses" },
        { value: "rejected", label: "Ditolak" },
      ],
    },
    { key: "amount", label: "Jumlah", type: "number" },
  ],
  formFields: ({ showTrash, formMode }) => {
    const baseFields: FormFieldConfig<withdrawal>[] = [
      {
        name: "amount",
        label: "Jumlah",
        type: "number",
        required: true,
        width: "1/3",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        width: "1/3",
        options: [
          { value: "pending", label: "Menunggu" },
          { value: "approved", label: "Disetujui" },
          { value: "processed", label: "Diproses" },
          { value: "rejected", label: "Ditolak" },
        ],
      },
      {
        name: "processed_at",
        label: "Tanggal Diproses",
        type: "datetime",
        width: "1/3",
      },
      {
        name: "id_author",
        label: "Penulis",
        type: "relation",
        width: "1/2",
        relationConfig: {
          type: "model",
          model: "author",
          labelFields: ["name", "avatar"],
          renderLabel: (author: author) => author.name,
        },
      },
      {
        name: "id_publisher",
        label: "Penerbit",
        type: "relation",
        width: "1/2",
        relationConfig: {
          type: "model",
          model: "publisher",
          labelFields: ["name", "logo"],
          renderLabel: (publisher: publisher) => publisher.name,
        },
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
      viewTrash: false,
    },
  },
};

export default () => {
  const local = useLocal({ loading: false });
  const crud = useCrud<withdrawal>(api.withdrawals, {
    breadcrumbConfig: {
      renderNameLabel: async (withdrawal) => {
        return `Penarikan #${withdrawal.id?.substring(0, 8)}`;
      },
    },
  });

  return (
    <Layout loading={local.loading}>
      <MenuBarPublish />
      <main className="flex-1 flex p-4">
        <ECrud
          config={withdrawalCRUDConfig}
          urlState={{ baseUrl: "/withdrawals" }}
          apiFunction={api.withdrawals}
          {...crud}
        />
      </main>
    </Layout>
  );
};
