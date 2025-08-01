import { ECrud } from "@/components/core/ecrud/ecrud";
import {
  PublishPageHeader,
  createBookCRUDConfig,
  useStoryConfig,
} from "@/components/esensi/publish";
import { useCrud } from "@/lib/crud-hook";
import { api } from "@/lib/api/publish.esensi";
import type { book } from "shared/models";

export default () => {
  const storyConfig = useStoryConfig();

  const crud = useCrud<book>(api.books, {
    breadcrumbConfig: {
      renderNameLabel: async (book) => {
        return book.name || "Buku Tanpa Judul";
      },
    },
  });

  const bookCRUDConfig = createBookCRUDConfig({
    storyTypeOptions: storyConfig.storyTypeOptions,
    storyWarningNoticeOptions: storyConfig.storyWarningNoticeOptions,
  });

  return (
    <PublishPageHeader loading={storyConfig.loading}>
      <ECrud
        config={bookCRUDConfig}
        urlState={{ baseUrl: "/books" }}
        apiFunction={api.books}
        {...crud}
      />
    </PublishPageHeader>
  );
};
