import { SeoTemplate } from "backend/components/SeoTemplate";
import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";

interface EsensiResponse {
  jsx: ReactElement;
  data: {
    title: string;
    content: {};
    breadcrumb: Array<{
      url: string | null;
      label: string;
    }>;
  };
}

export default defineAPI({
  name: "esensi",
  url: "/esensi",
  async handler(): Promise<EsensiResponse> {
    const req = this.req!;

    const data = {
      title: `Navigasi Esensi`,
      content: {},
      breadcrumb: [
        {
          url: null,
          label: `About`,
        },
      ],
    };

    const seo_data = {
      slug: `/esensi`,
      meta_title: `Navigasi Halaman Esensi Online`,
      meta_description: `Akses link penting untuk memudahkan navigasi di situs kami.`,
      image: ``,
      headings: `Navigasi Halaman Esensi Online`,
      paragraph: `Akses link penting untuk memudahkan navigasi di situs kami.`,
      is_product: false,
    };

    return {
      jsx: (
        <>
          <SeoTemplate data={seo_data} />
        </>
      ),
      data: data,
    };
  },
});
