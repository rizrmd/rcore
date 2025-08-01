import { GlobalAlert } from "@/components/ui/global-alert";
import { useRoot } from "@/lib/hooks/use-router";
import { ParamsContext } from "@/lib/router";
import { cartState } from "@/lib/states/cart-state";
import { useEffect } from "react";
import { Toaster } from "../ui/sonner";
import { AppLayout } from "./layout";
import { AppLoading } from "./loading";
import { NotFoundPage } from "../esensi/ui/not-found-page";
import Esensi from "@/pages/main.esensi/esensi";
import { EsensiChapterNotFound } from "../esensi/chapter/layout/layout-not-found";

function AppRoot() {
  const { Page, currentPath, isLoading, params } = useRoot();

  // Initialize cart on app start
  useEffect(() => {
    cartState.load();
  }, []);

  if (isLoading) {
    return <AppLoading />;
  }

  // Check if the path is auth related (either starts with /auth or /auth.esensi)
  const isAuthPath =
    currentPath.startsWith("/auth") || currentPath.startsWith("/auth.esensi");

  // For localhost:7500, detect by port and assume it's an auth domain
  const isAuthDomain =
    window.location.hostname === "localhost" && window.location.port === "7500";

  const isChapterDomain =
    window.location.hostname === "localhost" && window.location.port === "7200";

  const init_data = (window as any).__data || {};

  if (isAuthPath || isAuthDomain) {
    return (
      <>
        {Page ? (
          <ParamsContext.Provider value={params}>
            <AppLayout>
              {Page ? <Page {...init_data} /> : <NotFoundPage />}
            </AppLayout>
          </ParamsContext.Provider>
        ) : (
          <NotFoundPage />
        )}
      </>
    );
  }

  return (
    <ParamsContext.Provider value={params}>
      <AppLayout>
        {Page ? (
          <Page {...init_data} />
        ) : isChapterDomain ? (
          <EsensiChapterNotFound />
        ) : (
          <NotFoundPage />
        )}
      </AppLayout>
    </ParamsContext.Provider>
  );
}

export function Root() {
  return (
    <>
      <GlobalAlert />
      <Toaster />
      <AppRoot />
    </>
  );
}
