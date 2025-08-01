import { auth } from "backend/lib/better-auth";
import { defineAPI } from "rlib/server";
import { Prisma } from "shared/models";


export default defineAPI({
  name: "product_shipment",
  url: "/api/product-shipment",
  async handler(options?: { query?: { status?: string; page?: string } }) {
    const req = this.req!;

    // --- 1. Authentication ---
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;

    if (!user) {
      return { success: false, message: "Authentication required." };
    }

    // --- 2. Authorization & Validation (Using id_author) ---
    // Get the author ID directly from the user session.
    const authorId = user.idAuthor;

    // Validate the author ID.
    if (!authorId || authorId === "null") {
      return { success: false, message: "User is not associated with an author account." };
    }
    
    // --- 3. Pagination and Filtering ---
    const status = options?.query?.status || "semua";
    const page = parseInt(options?.query?.page || "1", 10);
    const ITEMS_PER_PAGE = 10;

    // The 'where' condition now directly uses the author's ID.
    const where: Prisma.t_shipmentWhereInput = {
      id_author: authorId,
      ...(status && status !== "semua" ? { status: status } : {}),
    };

    // --- 4. Data Fetching ---
    const totalItems = await db.t_shipment.count({ where });
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const shipmentsFromDb = await db.t_shipment.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      select: {
        id: true,
        id_sales: true,
        id_author: true, 
        created_at: true,
        status: true,
        shipping_provider: true,
        awb: true,
        t_sales: {
          select: {
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
            t_sales_line: {
              select: {
                qty: true,
                unit_price: true,
                product: {
                  select: {
                    id_author: true, 
                    name: true,
                    cover: true,
                    currency: true,
                  },
                },
                bundle: {
                  select: {
                    name: true,
                    cover: true,
                    currency: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // --- 5. Data Formatting (No changes needed here) ---
    const formattedShipments = shipmentsFromDb.map((s) => {
      const relevantItems = s.t_sales?.t_sales_line.filter(
        (line) => line.product?.id_author === s.id_author
      ) || [];

      const items = relevantItems.map(line => {
        const item = line.product || line.bundle;
        return {
          name: item?.name || "N/A",
          cover: item?.cover || "",
          quantity: line.qty,
          price: line.unit_price,
          currency: item?.currency || "Rp.",
        };
      });

      return {
        id: s.id,
        orderId: s.id_sales,
        date: s.created_at,
        status: s.status,
        courier: s.shipping_provider,
        awb: s.awb,
        customer: s.t_sales?.customer ?? null,
        items: items,
      };
    });


    // --- 6. Return the final structured data ---
    return {
      data: {
        shipments: formattedShipments,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          items_per_page: ITEMS_PER_PAGE,
          total_items: totalItems,
        },
      },
    };
  },
});