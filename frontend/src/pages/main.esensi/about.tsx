import { Breadcrumbs } from "@/components/esensi/navigation/breadcrumbs";
import { GlobalLoading } from "@/components/esensi/ui/global-loading";
import { ImgThumb } from "@/components/esensi/ui/img-thumb";
import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { LinkItem } from "@/components/esensi/ui/link-item";
import { StaticPageWrapper } from "@/components/esensi/layout/static-page-wrapper";
import type { api } from "@/lib/gen/main.esensi";
import { FileSearch, Mail, MessageCircleMore, Phone } from "lucide-react";

export default (data: Awaited<ReturnType<typeof api.about>>["data"]) => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "Disclaimer",
    profile: false,
    terbitan: null as any,
    links: [
      {
        label: "Email kami",
        sublabel: "info@esensi.online",
        url: "mailto:info@esensi.online",
        newTab: true,
        icon: "mail",
      },
    ] as any,
  };

  const icons = {
    mail: <Mail />,
    phone: <Phone />,
    chat: <MessageCircleMore />,
    file: <FileSearch />,
  };

  const local = {
    loading: true as boolean,
    logo: null as any,
    breadcrumb: "" as any,
    title: "" as string,
    content: null as any,
  };

  if (data) {
    local.breadcrumb = data?.breadcrumb;
    local.logo = data?.logo;
    local.title = data?.title;
    local.content = data?.content;
    local.loading = false;
  }

  const renderLogo = (
    <p className="flex justify-center w-full">
      <ImgThumb
        src={local.logo?.img}
        alt={local.logo?.alt}
        className="w-full max-w-40 h-auto"
        skipResize={true}
      />
    </p>
  );

  const renderTerbitan = (
    <div className="hidden flex-col w-full gap-4">
      <h3>Buku Terbitan Esensi Online</h3>
      <div className="flex"></div>
    </div>
  );

  /*
  const renderLinksItem =
    local.links !== "undefined" &&
    local.links !== undefined &&
    local.links !== null &&
    local.links.length > 0 &&
    local.links.map((item: any, idx) => {
      const renderItems =
        !item || item === "undefined" ? (
          <></>
        ) : (
          <LinkItem
            key={`esensi_about_links_${idx}`}
            label={item?.label}
            sublabel={item?.sublabel !== "undefined" ? item.sublabel : null}
            url={item?.url}
            newTab={item?.newTab}
            icon={
              item?.icon !== "undefined" && item?.icon !== null
                ? icons[item.icon]
                : null
            }
          />
        );
      return renderItems;
    });
  const renderLinks = (
    <div className="flex flex-col w-full gap-4">
      <h3>Hubungi Kami</h3>
      <div className="flex flex-col">
        {local.links !== "undefined" &&
          local.links !== undefined &&
          local.links !== null &&
          local.links.length > 0 &&
          renderLinksItem}
      </div>
    </div>
  );
  */

  const renderLoading = <GlobalLoading />;

  const renderBreadcrumbs = (
    <div className="hidden lg:flex w-full justify-start">
      <Breadcrumbs data={local.breadcrumb} />
    </div>
  );

  const renderContent = local.content !== null && (
    <div className="flex flex-col gap-10 w-full items-center">
      {renderBreadcrumbs}
      <div className="flex flex-col items-center w-full gap-6">
        {!local.loading && renderLogo}
        <h2 className="font-semibold text-2xl text-[#3B2C93] whitespace-pre-line text-center">{local.title}</h2>
        <div
          className="flex flex-col w-full max-w-[800px] gap-3 text-justify items-start [&_h2]:text-xl [&_h2]:font-semibold [&_h2,&_a]:text-[#3B2C93] [&_h2]:mt-4 [&_ul:not(.no-list-style)]:list-disc [&_ul:not(.no-list-style)]:pl-6  [&_.esensi-contant-block]:p-flex [&_.esensi-contant-block]:w-full [&_.esensi-contant-block]:p-flex-col [&_.esensi-contant-block]:gap-7 [&_.esensi-contant-block]:items-center [&_.esensi-contant-block]:text-center [&_.esensi-contant-block]:text-lg [&_.esensi-contant-block]:font-semibold [&_.esensi-contant-block_span:last-child]:text-[#3B2C93] [&_.esensi-contant-block]:my-2"
          dangerouslySetInnerHTML={{ __html: local.content }}
        ></div>
        {!local.loading && renderTerbitan}
      </div>
    </div>
  );

  const renderPage = local.loading ? (
    renderLoading
  ) : (
    <StaticPageWrapper content={renderContent} />
  );

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={true}>
      {renderPage}
    </MainEsensiLayout>
  );
};
