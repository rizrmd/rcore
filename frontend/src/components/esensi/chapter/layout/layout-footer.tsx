import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/chapter.esensi";
import { Instagram, Linkedin } from "lucide-react";
import { Link } from "@/lib/router";
import { FooterAccordion } from "../ui/footer-accordion";
import { Button } from "@/components/ui/button";
import { EsensiChapterLogoText } from "../svg/esensi-chapter-logo-text";


export const LayoutFooter = () => {
  const local = useLocal(
    {
      logo: {
        img: "/img/esensi-online-logo.png" as string,
        alt: "Esensi Chapter" as string,
      } as any,
      about: {
        description: `` as string,
      } as any,
      links_1: {} as any,
      links_2: {} as any,
      subscribe: {} as any,
      socials: [] as any,
      copyright: "" as string,
    },
    async () => {
      const res = await api.footer();
      if (res?.data) {
        local.logo = res.data?.logo;
        local.about = res.data?.about;
        local.links_1 = res.data?.links_1;
        local.links_2 = res.data?.links_2;
        local.subscribe = res.data?.subscribe;
        local.socials = res.data?.socials;
        local.copyright = res.data?.copyright;
        local.render();
      }
    }
  );

  const socialsIcon = {
    instagram: <Instagram />,
    linkedin: <Linkedin />,
  };

  return (
    <footer className="flex w-full flex-col items-center justify-center px-(--esensi-container-mx) lg:px-0 text-sm bg-(--esensi-color) text-(--esensi-color-i) py-12 gap-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-4 [&_a]:hover:text-(--esensi-color-alt)">
      <div className="esensi-container">
        <div className="flex flex-col w-full lg:flex-row gap-4 lg:gap-8 justify-between items-start">
          {local.links_1?.list?.length > 0 && (
            <div className="flex w-full lg:order-2 lg:w-1/6">
              <FooterAccordion title={local.links_1?.title}>
                <ul className="flex flex-col gap-1 font-medium">
                  {local.links_1?.list?.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.url}
                        target={link.newTab ? "_blank" : "_self"}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </FooterAccordion>
            </div>
          )}

          {local.links_2?.list?.length > 0 && (
            <div className="flex w-full lg:order-3 lg:w-1/6">
              <FooterAccordion title={local.links_2?.title}>
                <ul className="flex flex-col gap-1 font-medium">
                  {local.links_2?.list?.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.url}
                        target={link.newTab ? "_blank" : "_self"}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </FooterAccordion>
            </div>
          )}

          <div className="flex w-full lg:order-4 lg:w-1/3">
            <FooterAccordion title={local.subscribe?.title}>
              <p>{local.subscribe?.description}</p>
              <form className="flex gap-2 mt-4 -mx-2 lg:-ml-4 lg:-mr-0 bg-white rounded-full shadow-sm p-2">
                <input
                  type="email"
                  placeholder={
                    local.subscribe?.placeholder || "Enter your email"
                  }
                  className="flex-1 px-3 py-2 text-sm border-none focus:outline-none focus:ring-none text-black"
                />
                <Button
                  type="submit"
                  className="esensi-button cursor-pointer px-6 py-2 focus:outline-none focus:ring-2 focus:ring-[#ddd]"
                >
                  {local.subscribe?.btn_label || "Subscribe"}
                </Button>
              </form>
            </FooterAccordion>
          </div>
          <div className="flex w-full flex-col lg:items-start mt-4 lg:mt-0 gap-0 lg:gap-4 lg:order-1 lg:w-1/3">
            <EsensiChapterLogoText
              className="relative h-7 w-auto mb-3"
              colorPrimary="fill-white"
            />
            <p className="text-center lg:text-left">{local.about?.description}</p>
            {local.socials?.length > 0 && (
              <div className="flex justify-center lg:justify-start gap-4 mt-4 [&_svg]:h-6 [&_svg]:w-auto">
                {local.socials.map((social, index) => (
                  <Link
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--esensi-color-i)"
                  >
                    {socialsIcon[social?.site] || social?.site}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="esensi-container text-center lg:text-left">
        <p>
          {local.copyright || "© 2025 Esensi Chapter. All rights reserved."}
        </p>
      </div>
    </footer>
  );
};
