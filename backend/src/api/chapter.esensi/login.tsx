import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "login",
  url: "/api/login",
  async handler() {
    const req = this.req!;
    console.log("route: " + "/api/login");
    return {};
  },
});
