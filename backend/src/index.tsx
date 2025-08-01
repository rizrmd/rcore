import { $ } from "bun";
import { join } from "path";
import config from "../.././config.json";

import {
  initDev,
  initEnv,
  initProd,
  type onFetch,
  type SiteConfig,
} from "rlib/server";
import { auth } from "./lib/better-auth";
import { wsNotif } from "./lib/notif";

if (config?.db?.orm === "prisma") {
  if (
    !(await Bun.file(
      join(process.cwd(), "shared", "models", "index.js")
    ).exists())
  ) {
    console.log("Generating prisma typings...");
    await $`bun prisma generate`.cwd(join(process.cwd(), "shared")).quiet();
  }
}

const { isDev } = initEnv();

const loadModels = async () => {
  return new (await import("shared/models")).PrismaClient();
};
const loadApi = async () => {
  return (await import("./gen/api")).backendApi;
};
const onFetch: onFetch = async ({ url, req }) => {
  if (url.pathname.startsWith("/api/auth")) {
    try {
      return await auth.handler(req);
    } catch (e) {
      throw e;
    }
  }
};
const index = (await import("frontend/entry/index.html")).default;

const ws = { notif: wsNotif };

if (isDev) {
  initDev({
    index,
    loadApi,
    loadModels,
    onFetch,
    ws,
  });
} else {
  const config = (await import("../../config.json")) as SiteConfig;
  initProd({
    index,
    loadApi,
    loadModels,
    onFetch,
    config,
    ws,
  });
}
