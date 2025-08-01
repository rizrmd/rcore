import type { ReactElement } from "react";
import { defineAPI } from "rlib/server";

interface FooterResponse {
  jsx: ReactElement;
  data: {
    logo: {
      img: string;
      alt: string;
      tagline: string;
    };
    links_1: {
      title: string;
      list: Array<{
        label: string;
        url: string;
        newTab: boolean;
      }>;
    };
    links_2: {
      title: string;
      list: Array<{
        label: string;
        url: string;
        newTab: boolean;
      }>;
    };
    subscribe: {
      title: string;
      placeholder: string;
      btn_label: string;
    };
    socials: Array<{
      site: string;
      url: string;
    }>;
    copyright: string;
  };
}

export default defineAPI({
  name: "footer",
  url: "/api/footer",
  async handler(): Promise<FooterResponse> {
    const logo = {
      img: `_file/upload/esensi-online-logo.png`,
      alt: `Esensi Online`,
      tagline: `Baca, Belajar,
dan Bertumbuh`,
    };

    const links_1 = {
      title: `Quick Links`,
      list: [
        { label: `Tentang Kami`, url: `/about`, newTab: false },
        { label: `Semua eBook`, url: `/ebook`, newTab: false },
        { label: `Semua Buku Fisik`, url: `/book`, newTab: false },    
        { label: `Cari Buku`, url: `/search`, newTab: false },
      ],
    };

    const links_2 = {
      title: `Bantuan`,
      list: [
        { label: `FAQs`, url: `/faq`, newTab: false },
        { label: `Syarat & Ketentuan`, url: `/tos`, newTab: false },
        { label: `Kebijakan Privasi`, url: `/privacy-policy`, newTab: false },
        { label: `Disclaimer`, url: `/disclaimer`, newTab: false },
      ],
    };

    const subscribe = {
      title: `Dapatkan update buku terbaru & promo langsung ke email kamu!`,
      placeholder: `Cari buku...`,
      btn_label: `Berlangganan`,
    };

    const socials = [
      {
        site: "instagram",
        url: "https://www.instagram.com/esensi.online.official",
      },
      {
        site: "linkedin",
        url: "https://www.linkedin.com/company/pt-meraih-ilmu-semesta/",
      },
      //   { site: "whatsapp", url: "" },
    ];

    const copyright = `© 2025 Esensi Online. All rights reserved.`;

    const data = {
      logo: logo,
      links_1: links_1,
      links_2: links_2,
      subscribe: subscribe,
      socials: socials,
      copyright: copyright,
    };

    return {
      jsx: <></>,
      data: data,
    };
  },
});
