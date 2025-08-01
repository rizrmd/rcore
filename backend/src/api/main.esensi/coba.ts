import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "coba",
  url: "/api/coba",
  async handler() {
    const res = await db.product.findMany({ select: { id: true, info: true } });

    const result = {} as Record<string, string[]>;
    res.map((e) => {
      const penulis = (e.info as any)?.[0]?.[1];
      if (penulis) {
        if (!result[penulis]) {
          result[penulis] = [];
        }

        result[penulis].push(e.id);
      }
    });

    return result;
  },
});
