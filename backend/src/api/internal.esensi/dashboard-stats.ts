import { defineAPI } from "rlib/server";
import { BadgeStatus } from "shared/types";
import type {
  DashboardStats,
  DashboardStatsSalesByMonth,
  DashboardStatsTopAuthors,
  DashboardStatsTopBooks,
} from "shared/types";
import type { ApiResponse } from "../../lib/utils";

// Simple cache for dashboard stats (5 minutes)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

export default defineAPI({
  name: "dashboard_stats",
  url: "/api/internal/dashboard/stats",
  async handler(arg: {
    period?: string;
  }): Promise<ApiResponse<DashboardStats>> {
    const { period = "30" } = arg;
    const cacheKey = `dashboard_stats_${period}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { success: true, data: cached.data };
    }

    // Calculate date range
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const startDateISO = startDate.toISOString();

    try {
      // Get basic counts first (these are usually fast)
      const [totalAuthors, totalBooks, totalCustomers] = await Promise.all([
        db.author.count(),
        db.book.count({ where: { deleted_at: null } }),
        db.customer.count(),
      ]);

      // Optimized sales aggregate query
      const totalSales = await db.t_sales.aggregate({
        where: {
          status: BadgeStatus.PAID,
          created_at: { gte: startDate },
        },
        _sum: { total: true },
        _count: { id: true },
      });

      // Optimized recent sales query with minimal includes
      const recentSalesRaw = await db.$queryRaw<any[]>`
        SELECT 
          tsl.id,
          tsl.qty,
          tsl.total_price,
          ts.id as sales_id,
          ts.created_at as sales_date,
          ts.status as sales_status,
          cu.name as customer_name,
          cu.email as customer_email,
          COALESCE(p.name, b.name) as product_name,
          COALESCE(pa.name, ba.name) as author_name
        FROM t_sales_line tsl
        JOIN t_sales ts ON tsl.id_sales = ts.id
        JOIN customer c ON ts.id_customer = c.id
        JOIN auth_user cu ON c.id_user = cu.id
        LEFT JOIN product p ON tsl.id_product = p.id
        LEFT JOIN author pa ON p.id_author = pa.id
        LEFT JOIN book b ON b.id_product = p.id
        LEFT JOIN author ba ON b.id_author = ba.id
        WHERE ts.status = ${BadgeStatus.PAID}
          AND ts.created_at >= ${startDateISO}::timestamp
        ORDER BY ts.created_at DESC
        LIMIT 10
      `;

      // Transform recent sales to match expected format
      const recentSales = recentSalesRaw.map((row) => ({
        id: row.id,
        qty: row.qty,
        total_price: row.total_price,
        t_sales: {
          id: row.sales_id,
          created_at: row.sales_date,
          status: row.sales_status,
          customer: {
            auth_user: {
              name: row.customer_name,
              email: row.customer_email,
            },
          },
        },
        product: {
          name: row.product_name,
          author: row.author_name ? { name: row.author_name } : null,
          book: row.author_name ? [{ author: { name: row.author_name } }] : [],
        },
      }));

      // Parallel execution of remaining queries with optimized SQL
      const [topAuthors, topBooks, salesByMonth] = await Promise.all([
        // Optimized top authors query
        db.$queryRaw`
          SELECT 
            a.id,
            a.name,
            COUNT(DISTINCT COALESCE(p_direct.id, p_book.id)) as book_count,
            COUNT(tsl.id) as total_sales,
            COALESCE(SUM(tsl.total_price), 0) as total_revenue
          FROM author a
          LEFT JOIN product p_direct ON a.id = p_direct.id_author
          LEFT JOIN book b ON a.id = b.id_author AND b.deleted_at IS NULL
          LEFT JOIN product p_book ON b.id_product = p_book.id
          LEFT JOIN t_sales_line tsl ON (p_direct.id = tsl.id_product OR p_book.id = tsl.id_product)
          LEFT JOIN t_sales ts ON tsl.id_sales = ts.id
          WHERE ts.status = ${BadgeStatus.PAID}
            AND ts.created_at >= ${startDateISO}::timestamp
          GROUP BY a.id, a.name
          HAVING COUNT(tsl.id) > 0
          ORDER BY total_revenue DESC
          LIMIT 10
        `,

        // Optimized top books query
        db.$queryRaw`
          SELECT 
            b.id,
            b.name,
            a.name as author_name,
            COUNT(tsl.id) as total_sales,
            COALESCE(SUM(tsl.total_price), 0) as total_revenue,
            COALESCE(SUM(tsl.qty), 0) as total_quantity
          FROM book b
          JOIN author a ON b.id_author = a.id
          JOIN product p ON b.id_product = p.id
          JOIN t_sales_line tsl ON p.id = tsl.id_product
          JOIN t_sales ts ON tsl.id_sales = ts.id
          WHERE b.deleted_at IS NULL 
            AND ts.status = ${BadgeStatus.PAID}
            AND ts.created_at >= ${startDateISO}::timestamp
          GROUP BY b.id, b.name, a.name
          HAVING COUNT(tsl.id) > 0
          ORDER BY total_revenue DESC
          LIMIT 10
        `,

        // Optimized sales by month query
        db.$queryRaw`
          SELECT 
            DATE_TRUNC('month', ts.created_at) as month,
            COUNT(tsl.id) as sales_count,
            COALESCE(SUM(tsl.total_price), 0) as total_revenue
          FROM t_sales_line tsl
          JOIN t_sales ts ON tsl.id_sales = ts.id
          WHERE ts.status = ${BadgeStatus.PAID}
            AND ts.created_at >= (NOW() - INTERVAL '6 months')
          GROUP BY DATE_TRUNC('month', ts.created_at)
          ORDER BY month DESC
        `,
      ]);

      const result = {
        overview: {
          total_authors: totalAuthors,
          total_books: totalBooks,
          total_customers: totalCustomers,
          total_sales_count: totalSales._count.id || 0,
          total_sales_revenue: Number(totalSales._sum.total) || 0,
          period_days: daysAgo,
        },
        recent_sales: recentSales,
        top_authors: topAuthors as DashboardStatsTopAuthors,
        top_books: topBooks as DashboardStatsTopBooks,
        sales_by_month: salesByMonth as DashboardStatsSalesByMonth,
      };

      // Cache the result
      cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return {
        success: false,
        message: "Gagal memuat statistik dashboard",
      };
    }
  },
});
