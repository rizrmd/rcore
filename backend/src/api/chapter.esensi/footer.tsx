import { defineAPI } from "rlib/server";

interface FooterResponse {
  data: {
    logo: {
      img: string;
      alt: string;
    };
    about: {
        description: string;
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
      description: string;
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
      img: `_file/upload/`,
      alt: `Esensi Chapter`,
    };

    const about = {
      description: `In every mind there exists an Ocean Door, a hidden gateway to one’s subconscious.`,
    };

    const links_1 = {
      title: `Sitelinks`,
      list: [
        { label: `About us`, url: `/about`, newTab: false },
        { label: `News`, url: `/news`, newTab: false },
        { label: `Categories`, url: `/categories`, newTab: false },
        { label: `Tags`, url: `/tags`, newTab: false },
      ],
    };

    const links_2 = {
      title: `Help Links`,
      list: [
        { label: `FAQs`, url: `/faq`, newTab: false },
        { label: `Terms of Services`, url: `/tos`, newTab: false },
        { label: `Privacy Policy`, url: `/privacy-policy`, newTab: false },
        { label: `Disclaimer`, url: `/disclaimer`, newTab: false },
      ],
    };

    const subscribe = {
      title: `Subscribe`,
      description: `Sign up to get newsletter and latest information about Esensi Chapter.`,
      placeholder: `Enter Your Email`,
      btn_label: `Subscribe`,
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

    const copyright = `© 2025 Esensi Chapter. All rights reserved.`;

    const data = {
      logo: logo,
      about: about,
      links_1: links_1,
      links_2: links_2,
      subscribe: subscribe,
      socials: socials,
      copyright: copyright,
    };

    return {
      data: data,
    };
  },
});
