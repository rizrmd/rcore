import { Breadcrumbs } from "@/components/esensi/navigation/breadcrumbs";
import { GlobalLoading } from "@/components/esensi/ui/global-loading";
import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { StaticPageWrapper } from "@/components/esensi/layout/static-page-wrapper";
import type { api } from "@/lib/gen/main.esensi";
import { FileSearch, Mail, MessageCircleMore, Phone } from "lucide-react";

export default (data: Awaited<ReturnType<typeof api.contact>>["data"]) => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "Hubungi Kami",
    profile: false,
  };

  const icons = {
    mail: <Mail />,
    phone: <Phone />,
    chat: <MessageCircleMore />,
    file: <FileSearch />,
  };

  const local = {
    loading: true as boolean,
    breadcrumb: "" as any,
    title: "" as string,
    content: null as any,
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

  if (data) {
    local.breadcrumb = data?.breadcrumb;
    local.title = data?.title;
    local.content = data?.content;
    local.loading = false;
  }

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
        <h2 className="font-semibold text-2xl text-[#3B2C93]">{local.title}</h2>
        <div
          className="flex flex-col w-full max-w-[800px] gap-3 text-justify items-center [&_.esensi-contant-block]:p-flex [&_.esensi-contant-block]:p-flex-col [&_.esensi-contant-block]:gap-7 [&_.esensi-contant-block]:items-center [&_.esensi-contant-block]:text-center [&_.esensi-contant-block]:text-lg [&_.esensi-contant-block]:font-semibold [&_.esensi-contant-block_span:last-child]:text-[#3B2C93] [&_.esensi-contant-block]:my-2"
          dangerouslySetInnerHTML={{ __html: local.content }}
        ></div>
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
