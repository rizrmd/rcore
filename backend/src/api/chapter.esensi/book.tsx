import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "book",
  url: "/api/book",
  async handler() {
    const req = this.req!;
    console.log("route: " + "/api/book");
    return {};
  },
});
