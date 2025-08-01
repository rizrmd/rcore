import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";
import type { ConfigItem } from "shared/types";

export default defineAPI({
  name: "cfg_list",
  url: "/api/internal/cfg/list",
  async handler(arg: {
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<ConfigItem[]>> {
    const { search } = arg;
    const page = arg.page || 1;
    const limit = arg.limit || 10;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { key: { contains: search, mode: "insensitive" as const } },
            { value: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      db.cfg.findMany({
        where,
        take: limit,
        skip,
        orderBy: { key: "asc" },
      }),
      db.cfg.count({ where }),
    ]);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
});
