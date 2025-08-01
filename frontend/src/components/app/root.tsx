import { GlobalAlert } from "@/components/ui/global-alert";
import { useRoot } from "@/lib/hooks/use-router";
import { ParamsContext } from "@/lib/router";
import { Toaster } from "../ui/sonner";
import { AppLayout } from "./layout";
import { AppLoading } from "./loading";

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
      <a href="/" className="mt-4 text-blue-500 hover:underline">Go to Home</a>
    </div>
  );
}

function AppRoot() {
  const { Page, currentPath, isLoading, params } = useRoot();

  if (isLoading) {
    return <AppLoading />;
  }

  const init_data = (window as any).__data || {};

  return (
    <ParamsContext.Provider value={params}>
      <AppLayout>
        {Page ? <Page {...init_data} /> : <NotFoundPage />}
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