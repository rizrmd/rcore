import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "register",
  url: "/api/register",
  async handler() {
    const req = this.req!;
    console.log("route: " + "/api/register");
    return {};
  },
});
