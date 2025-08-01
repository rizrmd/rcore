import { Breadcrumbs } from "@/components/esensi/navigation/breadcrumbs";
import { GlobalLoading } from "@/components/esensi/ui/global-loading";
import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { StaticPageWrapper } from "@/components/esensi/layout/static-page-wrapper";
import type { api } from "@/lib/gen/main.esensi";
import { Fragment } from 'react';

export default (data: Awaited<ReturnType<typeof api.faq>>["data"]) => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "FAQs",
    profile: false,
  };

  const local = {
    loading: true as boolean,
    breadcrumb: "" as any,
    title: "" as string,
    content: null as any,
    list: [] as any,
  };

  if (data) {
    local.breadcrumb = data?.breadcrumb;
    local.title = data?.title;
    local.content = data?.content;
    local.list = data?.list;
    local.loading = false;
    console.log(data.list);
  }

  const renderLoading = <GlobalLoading />;

  const renderBreadcrumbs = (
    <div className="hidden lg:flex w-full justify-start">
      <Breadcrumbs data={local.breadcrumb} />
    </div>
  );

  const renderList = !local.loading && local.list !== undefined && local?.list.length > 0 && local.list.map((item: any, idx: number) => {
    return (
      <Fragment key={`esensi_faq_${idx}`}>
        <dt>{item?.q}</dt>
        <dd>{item?.a}</dd>
      </Fragment>
    );
  });

  const renderContent = local.content !== null && (
    <div className="flex flex-col gap-10 w-full items-center">
      {renderBreadcrumbs}
      <div className="flex flex-col items-center w-full gap-6">
        <h2 className="font-semibold text-2xl text-[#3B2C93]">{local.title}</h2>
        <div
          className="flex flex-col w-full max-w-[800px] gap-3 text-justify items-start"
          dangerouslySetInnerHTML={{ __html: local.content }}
        ></div>
        <dl className="flex flex-col w-full max-w-[800px] justify-start items-start gap-1 [&_dt]:font-semibold [&_dd:not(:last-child)]:mb-5">{renderList}</dl>
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
