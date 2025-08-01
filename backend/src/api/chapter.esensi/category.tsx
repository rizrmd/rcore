import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "category",
  url: "/api/category",
  async handler() {
    const req = this.req!;
    console.log("route: " + "/api/category");
    return {};
  },
});
