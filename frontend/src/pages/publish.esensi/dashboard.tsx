import { Layout } from "@/components/ext/layout/publish.esensi";
import { MenuBarPublish } from "@/components/ext/menu-bar/publish";
import { crudNavigate } from "@/lib/crud-hook";
import { api } from "@/lib/gen/publish.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import type { book } from "shared/models";

export default () => {
  const local = useLocal({ loading: false });

  const handleCreateBook = async (isChapter: boolean) => {
    try {
      await crudNavigate<book>(api.books, {
        view: "form",
        formMode: "create",
        defaultData: {
          is_chapter: isChapter,
          status: "draft",
          currency: "IDR",
          content_type: "text",
        },
        baseUrl: "/books",
        navigate,
      });
    } catch (error) {
      console.error("Failed to navigate to create book:", error);
      // Fallback navigation
      navigate("/books");
    }
  };

  return (
    <Layout loading={local.loading}>
      <MenuBarPublish />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Selamat datang di Esensi Publisher
            </h1>
            <p className="text-lg text-gray-600">
              Mulai perjalanan menulis Anda dengan memilih jenis buku yang ingin
              diterbitkan
            </p>
          </div>

          <div className="flex justify-center">
            {/* Buku Utuh - Temporarily disabled
            <div
              // className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              className="border rounded-lg p-6 transition-shadow flex flex-col opacity-50 cursor-not-allowed"
              // onClick={() => handleCreateBook(false)} // Temporarily disabled for demonstration
            >
              <h3 className="text-xl font-semibold mb-3 text-gray-400">
                Buku Utuh
              </h3>
              <p className="text-gray-400 mb-4 flex-1">
                Terbitkan buku lengkap dalam satu publikasi. Cocok untuk novel,
                buku non-fiksi, atau karya yang sudah selesai.
              </p>
              <p className="text-sm text-gray-400 mb-4 ">
                Akan dipublikasikan di:
                <br /> <strong>esensi.com</strong>
              </p>
              <button
                className="w-full bg-gray-400 text-white py-2 px-4 rounded cursor-not-allowed"
                disabled
              >
                Buat Buku Utuh
              </button>
            </div>
            */}

            <div
              className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col max-w-sm"
              onClick={() => handleCreateBook(true)}
            >
              <h3 className="text-xl font-semibold mb-3 text-green-600">
                Buku Per Chapter
              </h3>
              <p className="text-gray-600 mb-4  flex-1">
                Terbitkan buku secara bertahap per chapter. Ideal untuk serial,
                web novel, atau karya yang masih dalam proses.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Akan dipublikasikan di: <br />
                <strong>esensichapter.com</strong>
              </p>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors cursor-pointer">
                Buat Buku Per Chapter
              </button>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};
