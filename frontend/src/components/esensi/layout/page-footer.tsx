import { useLocal } from "@/lib/hooks/use-local";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";
import { Instagram, Linkedin, Youtube, MessageCircleCode } from "lucide-react";
import { api } from "@/lib/gen/main.esensi";
import { ImgThumb } from "../ui/img-thumb";

export const PageFooter = ({ desktopHide = false as boolean }) => {
  const local = useLocal(
    {
      logo: {
        img: "/img/esensi-online-logo.png" as string,
        alt:"Esensi Online" as string,
        tagline: `Baca, Belajar,
dan Bertumbuh` as string,
      } as any,
      links_1: {} as any,
      links_2: {} as any,
      subscribe: {} as any,
      socials: [] as any,
      copyright: "" as string,
      userEmail: "" as string,
    },
    async () => {
      const res = await api.footer();
      if (res?.data) {
        local.links_1 = res.data?.links_1;
        local.links_2 = res.data?.links_2;
        local.subscribe = res.data?.subscribe;
        local.socials = res.data?.socials;
        local.copyright = res.data?.copyright;
      }
      local.render();
    }
  );

  const socialIcons = {
    instagram: <Instagram size={28} />,
    youtube: <Youtube size={34} />,
    linkedin: <Linkedin size={28} />,
    whatsapp: <MessageCircleCode size={28} />,
  };

  const createLinks = (list = [] as any) => {
    const items = list.map((item, idx) => {
      return (
        <li
          className="flex justify-start items-center"
          key={`esensi_menu_footer_${idx}`}
        >
          <a href={item.url}>{item.label}</a>
        </li>
      );
    });
    return items;
  };

  const renderSocials = local.socials.map((i, idx) => {
    return (
      <a href={i.url} target="_blank" key={`esensi_footer_socials_${idx}`}>
        {socialIcons[i.site]}
      </a>
    );
  });

  const renderFooter = (
    <footer className="hidden lg:flex justify-center">
      <div className="flex flex-col w-full gap-5 py-5 px-6 mt-10 max-w-[1200px]">
        <div className="flex w-full gap-10">
          <div className="flex flex-col justify-between flex-1 gap-10">
            <ImgThumb
              src={local.logo?.img}
              alt={local.logo?.alt}
              className="w-[200px] h-auto"
              skipResize={true}
            />
            <h5 className="text-lg font-bold text-[#3B2C93] whitespace-pre-line">
              {local.logo?.tagline}
            </h5>
          </div>
          <div className="flex w-auto min-w-xs gap-10 justify-end [&_h4]:font-bold [&_ul]:text-md [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&>div]:flex [&>div]:flex-col [&>div]:gap-3">
            <div>
              <h4>{local.links_1?.title}</h4>
              <ul>{createLinks(local.links_1?.list)}</ul>
            </div>
            <div>
              <h4>{local.links_2?.title}</h4>
              <ul>{createLinks(local.links_2?.list)}</ul>
            </div>
          </div>
          <div className="flex flex-col flex-1 gap-6">
            <h4 className="text-2xl text-[#3B2C93] font-semibold">
              {local.subscribe?.title}
            </h4>
            <div className="relative flex w-full h-10 items-stretch justify-between gap-0 bg-[#F6F6F6] rounded-full text-sm border-none focus:border-none focus:ring-0">
              <Input
                type="text"
                placeholder={local.subscribe?.placeholder}
                className="flex items-center justify-center h-full bg-transparent h-stretch border-none shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 px-5 [&::placeholder]:text-[#3B2C93]"
                value={local.userEmail}
                onChange={(e) => {
                  local.userEmail = e.target.value;
                  local.render();
                }}
              />
              <Button
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="flex items-center justify-center h-full bg-[#3B2C93] text-white rounded-full font-normal px-6"
              >
                {local.subscribe?.btn_label}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center">
          <div className="flex w-auto grow-1">&nbsp;</div>
          <div className="flex w-auto text-sm text-[#3B2C93] font-semibold">
            {local.copyright}
          </div>
          <div className="flex justify-end w-auto grow-1">
            <ul className="flex items-center justify-end gap-3 [&_svg]:h-full [&_svg]:w-auto text-[#3B2C93]">
              {renderSocials}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );

  return <>{!desktopHide && renderFooter}</>;
};
export default PageFooter;
