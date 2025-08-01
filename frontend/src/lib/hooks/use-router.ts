import { pageModules } from "@/lib/gen/routes";
import {
  basePath,
  getDomainKeyByPort,
  matchRoute,
  ParamsContext,
  parsePattern,
  navigate,
  type Params,
} from "@/lib/router";
import { useContext, useEffect } from "react";
import raw_config from "../../../../config.json";
import { useLocal } from "../hooks/use-local";

interface SiteConfig {
  domains?: string[];
  [key: string]: any;
}

interface Config {
  sites: Record<string, SiteConfig>;
  [key: string]: any;
}

const config = raw_config as Config;

export const apiSeoPattern = {} as Record<string, boolean>;

// Get domain key from hostname (for non-localhost environments)
function getDomainKeyByHostname(hostname: string): string | null {
  // For other domains, check the normal mappings
  for (const [domain, cfg] of Object.entries(config.sites)) {
    if (cfg.domains && Array.isArray(cfg.domains)) {
      if (cfg.domains.includes(hostname)) {
        return domain;
      }
    }
  }
  return null;
}

const router = {
  currentPath: window.location.pathname,
  currentFullPath: window.location.pathname + window.location.hash,
  params: {} as Params,
  hash: {} as Record<string, string>,
  currentPattern: "",
  navigate,
};

function parseHash(hash: string): Record<string, string> {
  if (!hash || hash === "#") return {};

  // Remove the leading '#' character
  const hashContent = hash.substring(1);
  const params: Record<string, string> = {};

  // Split by & to get key-value pairs
  const pairs = hashContent.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      params[key] = value || "";
    }
  }

  return params;
}

const page_preloaded = {} as {
  [K in keyof typeof pageModules]: Awaited<(typeof pageModules)[K]>;
};

const w = window as unknown as {
  __data: any;
};

export async function preload(paths: string[]) {
  const domainKey = getDomainKey();

  const loading = [] as Promise<void>[];
  for (const path of paths) {
    let matchedPath = `/${domainKey}/${path.substring(1)}`;
    let pageLoader = pageModules[matchedPath];

    if (!pageLoader && domainKey) {
      for (const [pattern, loader] of Object.entries(pageModules)) {
        const routePattern = parsePattern(pattern);
        const params = matchRoute(path, routePattern, domainKey);

        if (!params && pattern === `/${domainKey}${path || "/"}`) {
          pageLoader = loader;
          break;
        }

        if (params) {
          matchedPath = pattern;
          pageLoader = loader;
          break;
        }
      }
    }

    if (pageLoader) {
      if (!page_preloaded[matchedPath]) {
        let result = pageLoader();
        loading.push(result);
        result.then((e) => {
          page_preloaded[matchedPath] = e;
        });
      }
    }
  }

  await Promise.all(loading);
}

const getDomainKey = () => {
  const hostname = window.location.hostname;
  const isFirebaseStudio = hostname.endsWith(".github.dev");
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  let domainKey: null | string = null;

  // Determine the domain key based on environment
  if (isFirebaseStudio) {
    const parts = hostname.split("-");
    const lastPart = parts[parts.length - 1]!.split(".");
    const port = lastPart[0];
    domainKey = getDomainKeyByPort(port);
  } else if (isLocalhost) {
    // For localhost, use port number to determine domain
    const port = window.location.port;
    domainKey = getDomainKeyByPort(port);
  } else {
    // For non-localhost, use hostname to determine domain
    domainKey = getDomainKeyByHostname(hostname);
  }
  return domainKey;
};

export function useRoot() {
  const local = useLocal({
    Page: null as React.ComponentType | null,
    routePath: "",
    isLoading: true,
  });
  useEffect(() => {
    const handlePathChange = () => {
      router.currentPath = window.location.pathname;
      router.currentFullPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      router.hash = parseHash(window.location.hash);
      setTimeout(local.render);
    };

    window.addEventListener("popstate", handlePathChange);
    // Also handle initial hash
    router.hash = parseHash(window.location.hash);
    return () => window.removeEventListener("popstate", handlePathChange);
  }, [router.currentFullPath]);

  useEffect(() => {
    const logRouteChange = async (path: string) => {
      // api.logRoute(path, user?.id);
    };

    const loadPage = async () => {
      // Always strip basePath if it exists, since the route definitions don't include it
      const withoutBase =
        basePath !== "/" && router.currentPath.startsWith(basePath)
          ? router.currentPath.slice(basePath.length)
          : router.currentPath;
      // Ensure path starts with slash and handle trailing slashes
      const path =
        (withoutBase.startsWith("/") ? withoutBase : "/" + withoutBase).replace(
          /\/$/,
          ""
        ) || "/";

      await logRouteChange(path);

      const domainKey = getDomainKey();
      let matchedPattern = domainKey
        ? `/${domainKey}${path === "/" ? "" : path}`
        : path;

      let pageLoader = pageModules[matchedPattern];
      let matchedParams = {};

      if (!pageLoader && domainKey) {
        for (const [pattern, loader] of Object.entries(pageModules)) {
          const routePattern = parsePattern(pattern);
          const params = matchRoute(path, routePattern, domainKey);

          if (!params && pattern === `/${domainKey}${path || "/"}`) {
            matchedPattern = pattern;
            pageLoader = loader;
            matchedParams = {};
            break;
          }

          if (params) {
            matchedPattern = pattern;
            pageLoader = loader;
            matchedParams = params;
            break;
          }
        }
      }

      if ((window as any).debug_router) {
        console.log(pageModules, pageLoader);
      } else {
        (window as any).debug_router = false;
      }

      if (pageLoader) {
        try {
          let seoData = null;
          let isFirst = false;
          if (typeof apiSeoPattern[matchedPattern] === "undefined") {
            if (Object.keys(apiSeoPattern).length === 0) {
              apiSeoPattern[matchedPattern] = !!w.__data;
              seoData = w.__data || null;
              isFirst = true;
            }
          }

          if (apiSeoPattern[matchedPattern] && !isFirst) {
            w.__data = seoData;
          }
          let module = null as unknown as Awaited<
            ReturnType<typeof pageLoader>
          >;

          if (page_preloaded[matchedPattern]) {
            module = page_preloaded[matchedPattern];
          } else {
            const result = await pageLoader();
            page_preloaded[matchedPattern] = result;
            module = result;
          }

          if (document.scrollingElement && path !== local.routePath) {
            document.scrollingElement.scrollTop = 0;
          }

          router.currentPattern = matchedPattern;
          local.routePath = path;
          local.Page = module.default;
          router.params = matchedParams;
          local.isLoading = false;
          local.render();

          if (
            !isFirst &&
            (typeof apiSeoPattern[matchedPattern] === "undefined" ||
              apiSeoPattern[matchedPattern])
          ) {
            const res = await fetch(location.pathname + location.search);
            const text = await res.text();
            if (text.includes("<script>window.__data =")) {
              apiSeoPattern[matchedPattern] = true;
              seoData = await extractWindowData(text);
              w.__data = seoData;
              local.render();
            } else {
              apiSeoPattern[matchedPattern] = false;
            }
          }
        } catch (err) {
          local.Page = null;
          local.routePath = "";
          router.params = {};
          local.isLoading = false;
          local.render();
        }
      } else {
        // Load 404 page
        try {
          const module = await pageModules["/404"]?.();
          local.routePath = path;
          local.Page = module.default;
          router.params = {};
          local.isLoading = false;
          local.render();
        } catch {
          local.Page = null;
          local.routePath = "";
          router.params = {};
          local.isLoading = false;
          local.render();
        }
      }
    };

    loadPage();
  }, [router.currentFullPath]);

  return {
    Page: local.Page ? local.Page : null,
    currentPath: router.currentPath,
    params: router.params,
    isLoading: local.isLoading,
  };
}

export function useRouter() {
  return router;
}

export function useParams<T extends Record<string, string>>() {
  return {
    params: useContext(ParamsContext) as T,
    hash: router.hash,
  };
}

export function extractWindowData(htmlString: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Create an iframe element
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";

    // Add iframe to document
    document.body.appendChild(iframe);

    try {
      // Get iframe's document
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDoc) {
        throw new Error("Tidak dapat mengakses iframe document");
      }

      // Write HTML content to iframe
      iframeDoc.open();

      // Remove <head> section from HTML string before writing to iframe
      const cleanedHtml = htmlString.replace(/<head>[\s\S]*?<\/head>/i, "");

      iframeDoc.writeln(cleanedHtml);
      iframeDoc.close();

      // Wait for scripts to execute and extract window.__data
      setTimeout(() => {
        try {
          const windowData = (iframe.contentWindow as any)?.__data;

          if (windowData) {
            resolve(windowData);
          }
        } finally {
          document.body.removeChild(iframe);
        }
      }, 100); // Small delay to ensure scripts execute
    } catch (error) {
      // Clean up on error
      document.body.removeChild(iframe);
      reject(error);
    }
  });
}
