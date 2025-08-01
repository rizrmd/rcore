import { pageModules } from "@/lib/gen/routes";
import { createContext } from "react";
import raw_config from "../../../config.json";
import { type SiteConfig } from "rlib/client";

const config = raw_config as SiteConfig;

// Normalize basePath to ensure it has trailing slash only if it's not '/'
export const basePath = `${location.protocol}//${location.host}/`;

// Utility for consistent path building
export function buildPath(to: string): string {
  return to.startsWith("/")
    ? basePath === "/"
      ? to
      : `${basePath}${to.slice(1)}`
    : to;
}

// Get domain key by port number when on localhost
export function getDomainKeyByPort(port: string): string | null {
  for (const [domain, cfg] of Object.entries(config.sites)) {
    if (cfg.devPort?.toString() === port) {
      return domain;
    }
  }
  return null;
}

export type Params = Record<string, string>;
export type RoutePattern = {
  pattern: string;
  regex: RegExp;
  paramNames: string[];
};

export const ParamsContext = createContext<Params>({});

// Check if the first part of a path is a domain identifier from config
export function isDomainSegment(segment: string): boolean {
  if (!segment || !segment.includes(".")) return false;

  // Check if this segment matches any site key in config
  return Object.keys(config.sites).some((site) => site === segment);
}

export function parsePattern(pattern: string): RoutePattern {
  const paramNames: string[] = [];
  const patternParts = pattern.split("/");
  const regexParts = patternParts.map((part, index) => {
    // If this is the first non-empty part and contains a dot, it might be a domain
    if (index === 1 && part.includes(".") && isDomainSegment(part)) {
      // Treat domain segment as optional when matching
      return `(${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})?`;
    }

    // Find all parameter patterns like [id] in the part
    const matches = part.match(/\[([^\]]+)\]/g);
    if (matches) {
      let processedPart = part;
      matches.forEach((match) => {
        const paramName = match.slice(1, -1);
        paramNames.push(paramName);
        // Replace [param] with capture group, preserve surrounding text
        processedPart = processedPart.replace(match, "([^/]+)");
      });
      return processedPart;
    }
    return part;
  });

  // Create regex pattern that makes domain segment optional
  const regexPattern = regexParts.join("/").replace(/\/+/g, "/");
  return {
    pattern,
    regex: new RegExp(`^${regexPattern}$`),
    paramNames,
  };
}

export function matchRoute(
  path: string,
  routePattern: RoutePattern,
  currentDomain?: string
): Params | null {
  // Clean up the path first
  const cleanPath = path.replace(/\/+/g, "/").replace(/\/$/, "");

  // If path doesn't start with domain but pattern has domain, try adding it
  if (
    currentDomain &&
    !cleanPath.includes(".esensi") &&
    routePattern.pattern.includes(".esensi")
  ) {
    const domainSegment = routePattern.pattern.split("/")[1];

    if (domainSegment === currentDomain && isDomainSegment(domainSegment)) {
      // Try matching with domain added
      const pathWithDomain = `/${domainSegment}${cleanPath}`;
      const match = pathWithDomain.match(routePattern.regex);
      if (match) {
        const params: Params = {};
        routePattern.paramNames.forEach((name, index) => {
          const matched =
            match[index + (routePattern.pattern.includes(".esensi") ? 2 : 1)];
          if (matched) {
            params[name] = matched;
          }
        });
        return params;
      }
    }
  }

  // Regular matching
  const match = cleanPath.match(routePattern.regex);
  if (!match) return null;

  const params: Params = {};
  routePattern.paramNames.forEach((name, index) => {
    const matched =
      match[index + (routePattern.pattern.includes(".esensi") ? 2 : 1)];
    if (matched) {
      params[name] = matched;
    }
  });
  return params;
}

export function parseRouteParams(
  currentDomain: string,
  path: string
): Params | null {
  for (let pattern in pageModules) {
    const params = matchRoute(path, parsePattern(pattern), currentDomain);
    if (params) {
      return params;
    }
  }
  return null;
}

export function Link({
  href: to,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.onClick) {
      props.onClick(e);
    } else {
      navigate(to);
    }
  };

  return (
    <a href={buildPath(to)} {...props} onClick={handleClick}>
      {children}
    </a>
  );
}

const navigating = {
  inProgress: null as any,
};

export const navigate = (to: string) => {
  clearTimeout(navigating.inProgress);
  navigating.inProgress = setTimeout(() => {
    const fullPath = buildPath(to);
    window.history.pushState({}, "", fullPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
    navigating.inProgress = false;
  }, 50);
};
