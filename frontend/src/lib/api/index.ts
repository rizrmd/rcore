// Centralized API exports with proper authentication
// This replaces direct imports from @/lib/gen/* to ensure credentials are included

export { api as authApi } from "./auth.esensi";
export { api as chapterApi } from "./chapter.esensi";
export { api as companyApi } from "./company.esensi";
export { api as internalApi } from "./internal.esensi";
export { api as mainApi } from "./main.esensi";
export { api as publishApi } from "./publish.esensi";

// For backwards compatibility, also export as 'api' object
export const api = {
  auth: require("./auth.esensi").api,
  chapter: require("./chapter.esensi").api,
  company: require("./company.esensi").api,
  internal: require("./internal.esensi").api,
  main: require("./main.esensi").api,
  publish: require("./publish.esensi").api,
};