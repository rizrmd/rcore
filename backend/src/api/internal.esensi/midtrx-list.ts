import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "midtrx_list",
  url: "/api/internal/midtrx/list",
  async handler(arg: {
    page?: number;
    limit?: number;
    type?: string;
    order_id?: string;
    transaction_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    try {
      const page = arg.page || 1;
      const limit = Math.min(arg.limit || 20, 100); // Max 100 records per page
      const offset = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (arg.type) where.type = arg.type;

      if (arg.order_id || arg.transaction_id) {
        where.OR = [];

        if (arg.order_id) {
          where.OR.push({
            payload: {
              path: ["order_id"],
              equals: arg.order_id,
            },
          });
        }

        if (arg.transaction_id) {
          where.OR.push({
            payload: {
              path: ["transaction_id"],
              equals: arg.transaction_id,
            },
          });
        }
      }

      if (arg.start_date || arg.end_date) {
        where.tz = {};

        if (arg.start_date) where.tz.gte = new Date(arg.start_date);

        if (arg.end_date) where.tz.lte = new Date(arg.end_date);
      }

      // Get total count
      const total = await db.midtrx.count({ where });

      // Get records with pagination
      const records = await db.midtrx.findMany({
        where,
        orderBy: { tz: "desc" },
        skip: offset,
        take: limit,
      });

      // Format records for response
      const formattedRecords = records.map((record) => ({
        id: record.id,
        type: record.type,
        timestamp: record.tz,
        order_id: (record.payload as any)?.order_id || null,
        transaction_id: (record.payload as any)?.transaction_id || null,
        transaction_status: (record.payload as any)?.transaction_status || null,
        payment_type: (record.payload as any)?.payment_type || null,
        gross_amount: (record.payload as any)?.gross_amount || null,
        processing_status: (record.payload as any)?.processing_status || null,
        payload: record.payload,
      }));

      return {
        success: true,
        data: {
          records: formattedRecords,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching midtrx records:", error);
      return {
        success: false,
        message: "Gagal mengambil data transaksi Midtrans",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
