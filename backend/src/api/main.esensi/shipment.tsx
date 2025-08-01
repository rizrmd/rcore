import { auth } from "backend/lib/better-auth";
import { defineAPI } from "rlib/server";
import { SeoTemplate } from "backend/components/SeoTemplate";
import { Prisma } from "shared/models";

export default defineAPI({
  name: "shipment",
  url: "/shipment",
  async handler(options?: { query?: { id?: string; status?: string; page?: string } }) {
    const req = this.req!;
    const id = options?.query?.id;
    const status = options?.query?.status || "semua";
    const rawPageStr = options?.query?.page || "1";
    const sanitizedPageStr = rawPageStr.replace(/\D/g, '');
    const page = parseInt(sanitizedPageStr || "1", 10);
    
    const ITEMS_PER_PAGE = 10;
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;

    if (!user) {
      return { data: null };
    }

    // --- CASE 2: Get a SINGLE, DETAILED shipment if an ID is provided ---
    if (id && typeof id === "string") {
      // ... (this block is unchanged and works as intended)
      const shipment = await db.t_shipment.findFirst({
        where: {
          id: id,
          OR: [
            { t_sales: { customer: { auth_user: { id: user.id } } } },
            { author: { auth_user: { id: user.id } } },
          ],
        },
        include: {
          author: { select: { name: true, avatar: true } },
          t_sales: {
            include: {
              customer: {
                include: {
                  auth_user: { select: { name: true, email: true, image: true } },
                },
              },
              t_sales_line: {
                include: {
                  product: { select: { name: true, slug: true, cover: true, currency: true, id_author: true } },
                  bundle: { select: { name: true, slug: true, cover: true, currency: true, id_author: true } },
                },
              },
            },
          },
        },
      });

      if (!shipment || !shipment.t_sales) {
        return { data: null };
      }

      // Since this is a single shipment detail, we assume all items in the order
      // should be filtered by this shipment's author.
      const formattedItems = shipment.t_sales.t_sales_line
        .filter(line => {
            const itemAuthorId = line.product?.id_author || line.bundle?.id_author;
            return itemAuthorId === shipment.id_author;
        })
        .map((line) => {
            const item = line.product || line.bundle;
            return {
              name: item?.name || "N/A",
              cover: item?.cover || "",
              quantity: line.qty,
              price: line.total_price,
              currency: item?.currency || "Rp.",
            };
        });

      const data = {
        shipment: {
          id: shipment.id,
          status: shipment.status,
          awb: shipment.awb,
          courier: shipment.shipping_provider,
          cost: shipment.shipping_cost,
          shippedAt: shipment.shipped_at,
          deliveredAt: shipment.delivered_at,
          recipientName: shipment.recipient_name,
          address: shipment.address_line,
        },
        items: formattedItems,
        orderId: shipment.id_sales,
        seller: shipment.author,
        buyer: shipment.t_sales.customer.auth_user,
      };

      const seo_data = {
        slug: `/shipment/${id}`,
        meta_title: `Lacak Pengiriman: ${shipment.awb || shipment.id_sales}`,
        // ...
      };

      return {
        jsx: <SeoTemplate data={seo_data} />,
        data: data,
      };
    }

    // --- CASE 1: Get a LIST of all shipments ---

    // This logic remains the same
    const userWhereConditions: Prisma.t_shipmentWhereInput[] = [];
    if (user.idCustomer) {
        userWhereConditions.push({ t_sales: { id_customer: user.idCustomer } });
    }
    if (user.idAuthor) {
        userWhereConditions.push({ id_author: user.idAuthor });
    }
    if (userWhereConditions.length === 0) {
        return { data: { shipments: [], pagination: null } };
    }
    
    const where: Prisma.t_shipmentWhereInput = {
        AND: [
            { OR: userWhereConditions },
            { t_sales: { t_sales_line: { some: {} } } },
            ...(status && status !== "semua" ? [{ status: status }] : []),
        ],
    };

    const totalItems = await db.t_shipment.count({ where });
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // ✅ FIX: IMPLEMENTATION OF THE SUGGESTION STARTS HERE
    
    // 1. Fetch the base shipment data for the current page.
    // We select `id_author` and `id_sales` to use for fetching the correct items.
    const shipmentsFromDb = await db.t_shipment.findMany({
        where,
        orderBy: {
            created_at: "desc",
        },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        select: {
            id: true,
            status: true,
            created_at: true,
            shipping_provider: true,
            awb: true,
            id_sales: true,      // Needed for the item query
            id_author: true,     // Needed for filtering items
        },
    });

    // 2. For each shipment, fetch ONLY its specific items in a separate query.
    const formattedShipments = await Promise.all(
        shipmentsFromDb.map(async (s) => {
            // This query gets items from the same sale but filters by this shipment's author.
            const itemsForThisShipment = await db.t_sales_line.findMany({
                where: {
                    id_sales: s.id_sales,
                    product: {
                        id_author: s.id_author,
                    },
                },
                select: {
                    product: { select: { name: true, cover: true } },
                    bundle: { select: { name: true, cover: true } },
                },
            });

            // Format the items for the frontend.
            const items = itemsForThisShipment.map(line => {
                const item = line.product || line.bundle;
                return {
                    name: item?.name || "Nama produk tidak tersedia",
                    cover: item?.cover || "/default-cover.png",
                };
            });

            // 3. Return the final, correctly formatted shipment object.
            return {
                id: s.id,
                orderId: s.id_sales,
                date: new Date(s.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                }),
                status: s.status,
                courier: s.shipping_provider,
                awb: s.awb,
                items: items, // This now contains ONLY the correct items for this shipment
            };
        })
    );

    // The rest of the SEO and return logic remains the same
    const seo_data = {
      slug: `/shipment?page=${page}&status=${status}`,
      meta_title: `Riwayat Pengiriman Anda (Halaman ${page})`,
      meta_description: `Lihat semua riwayat pengiriman dan lacak status pesanan Anda.`,
      headings: `Riwayat Pengiriman`,
      paragraph: `Daftar lengkap semua pengiriman yang terkait dengan akun Anda.`,
      keywords: `riwayat, pengiriman, lacak, pesanan, status`,
    };

    return {
      jsx: <SeoTemplate data={seo_data} />,
      data: {
        shipments: formattedShipments,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          items_per_page: ITEMS_PER_PAGE,
          total_items: totalItems,
          status: status,
        },
      },
    };
  },  
});