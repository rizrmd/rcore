import { defineAPI } from "rlib/server";
import { z } from "zod";

export default defineAPI({
  name: "genre",
  url: "/api/publish/genre",
  async handler(params: any) {
  const q = z
    .object({
      action: z.enum(["list"]).optional(),
      search: z.string().optional(),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(5),
    })
    .parse(params);

  const { action = "list", search, page, limit } = q;

  if (action === "list") {
    const where: any = {
      deleted_at: null,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [data, total] = await Promise.all([
      db.genre.findMany({
        where,
        orderBy: { name: "asc" },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
      db.genre.count({ where }),
    ]);

    return {
      success: true,
      data,
      total,
      page,
      limit,
    };
  }

  return {
    success: false,
    message: "Invalid action",
  };
  },
});