import type {
  CRUDConfig,
  FormFieldConfig,
} from "@/components/core/ecrud/ecrud";
import { Button } from "@/components/ui/button";
import { crudNavigate } from "@/lib/crud-hook";
import { api } from "@/lib/gen/publish.esensi";
import { navigate } from "@/lib/router";
import type { author, book } from "shared/models";
import { BookStatusHeader } from "./book-status-utils";
import {
  createChapterCRUDConfig,
  createChapterFormRenderer,
} from "./chapter-config";
import { layoutCurrent } from "./page-header";
import { MonetizationTab } from "./monetization-tab";
export interface BookConfigOptions {
  storyTypeOptions: Array<{ value: string; label: string }>;
  storyWarningNoticeOptions: Array<{ value: string; label: string }>;
}

export const createBookCRUDConfig = ({
  storyTypeOptions = [],
  storyWarningNoticeOptions = [],
}: Partial<BookConfigOptions> = {}): CRUDConfig<book> => ({
  entityName: "Buku",
  entityNamePlural: "Buku",
  columns: [
    {
      key: "name",
      label: "Judul",
      sortable: true,
    },
    {
      key: "status",
      label: "Jml Chapter",
      sortable: true,
      width: 120,
      render: ({ value, entity }) => {
        const chapterCount = (entity as any)._count.chapter;
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await crudNavigate<book>(api.books, {
                  view: "form",
                  formMode: "edit",
                  selectedEntityId: entity.id,
                  activeTab: "nested-0", // Chapter tab is the first nested tab
                  baseUrl: "/books",
                  navigate,
                });
              } catch (error) {
                console.error("Failed to navigate to chapter tab:", error);
              }
            }}
            title="Klik untuk edit chapters"
          >
            {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
          </Button>
        );
      },
    },
  ],
  filters: [
    { key: "name", label: "Judul", type: "text" },
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
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Diajukan" },
        { value: "published", label: "Diterbitkan" },
        { value: "rejected", label: "Ditolak" },
      ],
    },
  ],
  formFields: ({ showTrash, formMode }) => {
    const currentUser = layoutCurrent.user;
    const isAuthor =
      currentUser?.idAuthor !== null && currentUser?.idAuthor !== undefined;

    const baseFields: FormFieldConfig<book>[] = [
      {
        name: "is_chapter",
        label: "Tipe Buku",
        type: "hidden",
        width: "1/2",
        defaultValue: true,
        disabled: true,
        required: true,
      },
      {
        name: "name",
        label: "Judul Buku",
        type: "text",
        required: true,
        width: "full",
        section: "basic",
      },
      {
        name: "alias",
        label: "Judul alias (judul buku alternatif)",
        type: "text",
        width: "full",
        section: "basic",
      },
      {
        name: "id_author",
        label: "Penulis",
        type: isAuthor ? "hidden" : "relation",
        required: true,
        defaultValue: isAuthor ? currentUser.idAuthor : null,
        width: isAuthor ? undefined : "1/3",
        hidden: isAuthor,
        section: "basic",
        relationConfig: isAuthor
          ? undefined
          : {
              type: "model",
              model: "author",
              labelFields: ["name", "avatar"],
              renderLabel: (author: author) => author.name,
              filters: currentUser?.idPublisher
                ? { deleted_at: null, id_publisher: currentUser.idPublisher }
                : { deleted_at: null },
            },
      },
      {
        name: "desc",
        label: "Deskripsi buku atau sinopsisnya",
        type: "textarea",
        width: "full",
        section: "basic",
        defaultValue: "",
      },
      {
        name: "submitted_price",
        label: "Harga",
        type: "number",
        width: "1/4",
        section: "pricing",
        hidden: (data: book) => data.is_chapter,
      },
      {
        name: "sku",
        label: "SKU",
        type: "text",
        width: "3/4",
        section: "pricing",
        hidden: (data: book) => data.is_chapter,
      },
      {
        name: "status",
        label: "Status",
        type: "hidden",
        required: true,
        width: "1/4",
        defaultValue: "draft",
      },
      {
        name: "cover",
        label: "Gambar Sampul",
        description: "Gambar yang digunakan sebagai cover atau gambar utama buku",
        type: "file",
        width: "1/2",
        section: "media",
        fileUploadConfig: {
          accept: "image/*",
          maxFiles: 1,
          maxSize: 5 * 1024 * 1024, // 5MB
        },
      },
      {
        name: "product_file",
        label: "File Buku Digital (Ebook)",
        type: "file",
        width: "1/2",
        defaultValue: null,
        hidden: (data: book) => data.is_chapter || data.is_physical,
        section: "media",
        fileUploadConfig: {
          accept: ".pdf,.epub,.mobi",
          maxFiles: 1,
          maxSize: 50 * 1024 * 1024, // 50MB for ebook files
        },
      },
      {
        name: "content_type" as keyof book,
        label: "Tipe Cerita",
        type: "select",
        width: "full",
        section: "story_settings",
        options: storyTypeOptions,
      },
      {
        name: "genre" as keyof book,
        label: "Genre",
        type: "relation",
        width: "full",
        section: "story_settings",
        multiple: true,
        relationConfig: {
          type: "model",
          model: "genre",
          labelFields: ["name"],
          renderLabel: (genre: any) => genre.name,
          filters: { deleted_at: null },
          joinTable: {
            model: "book_genre",
            parentField: "id_book",
            childField: "id_genre",
          },
        },
      } as FormFieldConfig<book>,
      {
        name: "story_language",
        label: "Bahasa Cerita",
        type: "hidden", // "select",
        width: "full",
        section: "story_settings",
        // options: storyLanguageOptions,
        defaultValue: "Bahasa Indonesia",
      },
      {
        name: "tags" as keyof book,
        label: "Tags",
        type: "relation",
        width: "full",
        section: "story_settings",
        multiple: true,
        relationConfig: {
          type: "model",
          model: "tags",
          labelFields: ["name"],
          renderLabel: (tag: any) => tag.name,
          filters: { deleted_at: null },
          joinTable: {
            model: "book_tags",
            parentField: "id_book",
            childField: "id_tags",
          },
        },
      } as FormFieldConfig<book>,
      // {
      //   name: "story_length",
      //   label: "Panjang Cerita",
      //   type: "select",
      //   width: "full",
      //   section: "story_settings",
      //   options: storyLengthOptions,
      // },
      // {
      //   name: "story_writing_contest",
      //   label: "Kontes Menulis",
      //   type: "select",
      //   width: "full",
      //   section: "story_settings",
      //   options: storyWritingContestOptions,
      // },
      // {
      //   name: "story_category",
      //   label: "Kategori Cerita",
      //   type: "select",
      //   width: "full",
      //   section: "story_settings",
      //   options: storyCategoryOptions,
      // },
      {
        name: "story_age_restrict" as keyof book,
        label: "Batasan kategori pembaca",
        type: "select",
        width: "full",
        section: "story_settings",
        options: storyWarningNoticeOptions,
      },
      // {
      //   name: "story_invitation_code",
      //   label: "Kode Undangan Cerita",
      //   type: "text",
      //   width: "full",
      //   section: "story_settings",
      // },
    ];

    return baseFields;
  },
  sections: [
    { id: "basic", title: "Informasi Dasar", description: "Detail utama buku", defaultOpen: true },
    {
      id: "pricing",
      title: "Harga & SKU",
      description: "Informasi harga dan kode produk",
      defaultOpen: false,
    },
    { id: "media", title: "Media", description: "Gambar sampul untuk bukumu", defaultOpen: false },
    {
      id: "story_settings",
      title: "Informasi detail tentang buku",
      description: "Mempermudah menarik minat pembaca kamu",
      defaultOpen: false,
    },
  ],
  actions: {
    list: {
      create: true,
      view: true,
      edit: true,
      delete: false,
      search: true,
      filter: true,
      sort: true,
      pagination: true,
      bulkSelect: true,
      viewTrash: true,
    },
    form: {
      delete: true,
    },
  },
  softDelete: {
    enabled: true,
    field: "deleted_at",
  },
  nested: [
    {
      title: "Chapter",
      layout: "side-by-side",
      sideWidth: { left: "30%", right: "70%" },
      config: createChapterCRUDConfig(),
      customFormRenderer: createChapterFormRenderer(),
      parentField: "id",
      nestedParentField: "id_book",
      model: "chapter",
      showInForm: (data: book) => data.is_chapter,
      showInDetail: (data: book) => data.is_chapter,
      onEntityRestore: async (
        entity: any,
        apiFunction: any,
        parentId: string | number
      ) => {
        const response = await apiFunction({
          action: "nested_restore",
          nested_model: "chapter",
          parent_id: parentId.toString(),
          id: entity.id,
        });
        if (!response.success) {
          throw new Error(response.message || "Failed to restore chapter");
        }
        return response;
      },
    },
    {
      title: "Monetisasi",
      layout: "default",
      config: {
        entityName: "Monetisasi",
        entityNamePlural: "Monetisasi",
        columns: [],
        filters: [],
        formFields: [],
        actions: {
          list: {
            create: false,
            view: false,
            edit: false,
            delete: false,
            search: false,
            filter: false,
            sort: false,
            pagination: false,
            bulkSelect: false,
            viewTrash: false,
          },
          form: {
            delete: false,
          },
        },
      },
      customListRender: (props: any) => <MonetizationTab bookId={props.parentId} />,
      parentField: "id",
      nestedParentField: "id_book",
      model: "book",
      showInForm: (data: book) => data.is_chapter,
      showInDetail: false,
    },
  ],
  breadcrumbExtra: (book) => <BookStatusHeader book={book} />,
});
