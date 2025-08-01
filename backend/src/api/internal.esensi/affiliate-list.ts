import type { Affiliate } from "shared/types";
import type { ApiResponse } from "../../lib/utils";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "affiliate_list",
  url: "/api/internal/affiliate/list",
  async handler(arg: {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: "name";
    sort_order?: "asc" | "desc";
  }): Promise<ApiResponse<Affiliate[]>> {
    const { search, sort_by = "name", sort_order = "asc" } = arg;
    const page = arg.page || 1;
    const limit = arg.limit || 10;
    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {};

    // Text search
    if (search?.trim())
      where.name = { contains: search.trim(), mode: "insensitive" };

    // Build sort order
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    const [data, total] = await Promise.all([
      db.affiliate.findMany({
        where,
        include: { auth_user: true },
        take: limit,
        skip,
        orderBy,
      }),
      db.affiliate.count({ where }),
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
