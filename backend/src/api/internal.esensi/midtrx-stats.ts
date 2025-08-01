import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "midtrx_stats",
  url: "/api/internal/midtrx/stats",
  async handler(arg: { start_date?: string; end_date?: string }) {
    try {
      // Build date filter
      const dateFilter: any = {};

      if (arg.start_date || arg.end_date) {
        dateFilter.tz = {};

        if (arg.start_date) dateFilter.tz.gte = new Date(arg.start_date);

        if (arg.end_date) dateFilter.tz.lte = new Date(arg.end_date);
      }

      // Get total counts by type
      const [
        totalWebhooks,
        totalSuccess,
        totalPending,
        totalFailed,
        totalExpired,
        totalChallenge,
        totalErrors,
        recentRecords,
      ] = await Promise.all([
        // Count all webhook notifications
        db.midtrx.count({
          where: {
            type: "webhook_notification",
            ...dateFilter,
          },
        }),

        // Count successful payments
        db.midtrx.count({
          where: {
            type: "payment_success",
            ...dateFilter,
          },
        }),

        // Count pending payments
        db.midtrx.count({
          where: {
            type: "payment_pending",
            ...dateFilter,
          },
        }),

        // Count failed payments
        db.midtrx.count({
          where: {
            type: "payment_failed",
            ...dateFilter,
          },
        }),

        // Count expired payments
        db.midtrx.count({
          where: {
            type: "payment_expired",
            ...dateFilter,
          },
        }),

        // Count challenge payments
        db.midtrx.count({
          where: {
            type: "payment_challenge",
            ...dateFilter,
          },
        }),

        // Count errors
        db.midtrx.count({
          where: {
            type: "webhook_notification_error",
            ...dateFilter,
          },
        }),

        // Get recent 10 records
        db.midtrx.findMany({
          where: dateFilter,
          orderBy: {
            tz: "desc",
          },
          take: 10,
          select: {
            id: true,
            type: true,
            tz: true,
            payload: true,
          },
        }),
      ]);

      // Get payment method statistics
      const paymentMethods = await db.midtrx.groupBy({
        by: ["payload"],
        where: {
          type: "payment_success",
          ...dateFilter,
        },
        _count: true,
      });

      // Extract payment methods from the grouped data
      const paymentMethodStats = paymentMethods.reduce((acc: any, item) => {
        const paymentType = (item.payload as any)?.payment_type;
        if (paymentType)
          acc[paymentType] = (acc[paymentType] || 0) + item._count;
        return acc;
      }, {});

      // Calculate success rate
      const totalPaymentAttempts = totalSuccess + totalFailed + totalExpired;
      const successRate =
        totalPaymentAttempts > 0
          ? ((totalSuccess / totalPaymentAttempts) * 100).toFixed(2)
          : "0.00";

      return {
        success: true,
        data: {
          summary: {
            total_webhooks: totalWebhooks,
            total_success: totalSuccess,
            total_pending: totalPending,
            total_failed: totalFailed,
            total_expired: totalExpired,
            total_challenge: totalChallenge,
            total_errors: totalErrors,
            success_rate: `${successRate}%`,
          },
          payment_methods: paymentMethodStats,
          recent_records: recentRecords.map((record) => ({
            id: record.id,
            type: record.type,
            timestamp: record.tz,
            order_id: (record.payload as any)?.order_id || null,
            transaction_status:
              (record.payload as any)?.transaction_status || null,
            payment_type: (record.payload as any)?.payment_type || null,
          })),
        },
      };
    } catch (error) {
      console.error("Error fetching midtrx statistics:", error);
      return {
        success: false,
        message: "Gagal mengambil statistik transaksi Midtrans",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
