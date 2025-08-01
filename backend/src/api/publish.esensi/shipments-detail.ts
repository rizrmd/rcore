import { auth } from "backend/lib/better-auth";
import { defineAPI } from "rlib/server";
import { z } from "zod";

// Define a schema for input validation to ensure the 'id' is a valid UUID.
const QuerySchema = z.object({
  id: z.string().uuid({ message: "Invalid shipment ID format." }),
});

export default defineAPI({
  name: "shipment_detail",
  url: "/api/shipment-detail",
  async handler(options?: { query?: { id?: string } }) {
    const req = this.req!;

    // --- 1. Authentication ---
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;

    if (!user) {
      return { success: false, message: "Authentication required.", status: 401 };
    }

    // --- 2. Authorization & Input Validation ---
    const authorId = user.idAuthor;
    if (!authorId || authorId === "null") {
      return { success: false, message: "User is not an author.", status: 403 };
    }

    const query = options?.query;
    const validation = QuerySchema.safeParse(query);

    if (!validation.success) {
      return { success: false, message: validation.error.issues[0]!.message, status: 400 };
    }
    const shipmentId = validation.data.id;

    // --- 3. Data Fetching ---
    // Fetch shipment, related sales, products, and the author's details.
    const shipment = await db.t_shipment.findFirst({
      where: {
        id: shipmentId,
        id_author: authorId, // Ensures the author owns this shipment
      },
      select: {
        id: true,
        status: true,
        awb: true,
        shipping_provider: true,
        shipping_service: true,
        shipping_cost: true,
        created_at: true,
        shipped_at: true,
        delivered_at: true,
        recipient_name: true,
        recipient_phone: true,
        address_line: true,
        city: true,
        province: true,
        postal_code: true,
        notes: true,
        author: {
          select: {
            id: true,
            name: true,
            phone: true,
            author_address: {
              select: {
                address: true,
                city: true,
                province: true,
                postal_code: true,
              },
            },
          },
        },
        t_sales: {
          select: {
            id: true,
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
            t_sales_line: {
              where: {
                product: {
                  id_author: authorId,
                },
              },
              select: {
                qty: true,
                unit_price: true,
                total_price: true,
                product: {
                  select: {
                    name: true,
                    cover: true,
                    sku: true,
                    weight: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // --- 4. Handle Not Found ---
    if (!shipment) {
      return { success: false, message: "Shipment not found or you do not have permission to view it.", status: 404 };
    }

    // --- 5. Data Formatting ---
    // Get the first address from the author_address array.
    const primaryAddress = shipment.author?.author_address?.[0];

    // Transform the data, now including the author object.
    const formattedData = {
      id: shipment.id,
      status: shipment.status,
      awb: shipment.awb,
      courier: {
        provider: shipment.shipping_provider,
        service: shipment.shipping_service,
      },
      shipping_cost: shipment.shipping_cost,
      dates: {
        created: shipment.created_at,
        shipped: shipment.shipped_at,
        delivered: shipment.delivered_at,
      },
      author: shipment.author
        ? {
            id: shipment.author.id,
            name: shipment.author.name,
            phone: shipment.author.phone, // Author's primary phone number
            address: primaryAddress // Check if an address exists
              ? {
                  address: primaryAddress.address,
                  city: primaryAddress.city,
                  province: primaryAddress.province,
                  postalCode: primaryAddress.postal_code,
                }
              : null,
          }
        : null,
      customer: {
        name: shipment.t_sales?.customer?.name || "N/A",
        email: shipment.t_sales?.customer?.email || "N/A",
      },
      shippingAddress: {
        recipient: shipment.recipient_name,
        phone: shipment.recipient_phone,
        address: shipment.address_line,
        city: shipment.city,
        province: shipment.province,
        postalCode: shipment.postal_code,
      },
      notes: shipment.notes,
      items: (shipment.t_sales?.t_sales_line ?? []).map((line) => ({
        name: line.product?.name || "N/A",
        sku: line.product?.sku || "N/A",
        cover: line.product?.cover || "",
        weight: line.product?.weight,
        quantity: line.qty,
        price: line.unit_price,
        total: line.total_price,
      })),
    };
    
    return {
      success: true,
      data: formattedData,
    };
  },
});