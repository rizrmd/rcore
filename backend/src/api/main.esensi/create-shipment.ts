
  import { defineAPI } from "rlib/server";
  import type { User } from "backend/lib/better-auth";
  import type { ApiResponse } from "backend/lib/utils";

interface AuthorShippingDetails {
  id_author: string;
  shipping_provider: string;
  shipping_service: string;
  shipping_cost: number;
}

interface CreateShipmentsForOrderRequest {
  user: Partial<User>;
  id_sales: string;
  shipments: AuthorShippingDetails[]; 
  recipient_name: string;
  recipient_phone: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  notes?: string;
}


  export default defineAPI({
    name: "create_shipment",
    url: "/api/main/shipment/create",
  async handler(
    arg: CreateShipmentsForOrderRequest
  ): Promise<ApiResponse<any>> {
    console.log("Processing order for shipment with payload:", arg);

    if (!arg.user?.id) {
      return { success: false, message: "User harus login." };
    }

    try {
      // 1. Fetch the sales record to validate it exists.
      const salesRecord = await db.t_sales.findUnique({
        where: { id: arg.id_sales },
        include: {
          t_sales_line: {
            include: { product: { select: { id_author: true } } },
          },
        },
      });

      if (!salesRecord) {
        return { success: false, message: "Data penjualan tidak ditemukan." };
      }

      const authorsInOrder = new Set(
          salesRecord.t_sales_line.map(item => item.product?.id_author).filter(Boolean)
      );

      if (arg.shipments.length !== authorsInOrder.size) {
        return { success: false, message: "Informasi pengiriman tidak cocok dengan jumlah penjual dalam pesanan." };
      }

      // 3. Prepare the data for each shipment to be created based on the input array.
      const shipmentCreationData = arg.shipments.map((shipmentDetail) => {
        if (!authorsInOrder.has(shipmentDetail.id_author)) {
            throw new Error(`Author ID ${shipmentDetail.id_author} dari pengiriman tidak ditemukan dalam pesanan.`);
        }
        return {
          id_sales: arg.id_sales,
          id_author: shipmentDetail.id_author,
          shipping_provider: shipmentDetail.shipping_provider,
          shipping_service: shipmentDetail.shipping_service,
          shipping_cost: shipmentDetail.shipping_cost,
          recipient_name: arg.recipient_name,
          recipient_phone: arg.recipient_phone,
          address_line: arg.address_line,
          city: arg.city,
          province: arg.province,
          postal_code: arg.postal_code,
          notes: arg.notes,
          status: "unpaid",
        };
      });
      
      const createdShipments = await db.$transaction(
        shipmentCreationData.map((data) => db.t_shipment.create({ data }))
      );

      return {
        success: true,
        message: `${createdShipments.length} shipment(s) created successfully.`,
        data: createdShipments.map(s => ({ id: s.id, status: s.status })),
      };

    } catch (error: any) {
      console.error("Error creating shipments for order:", error);
      return {
        success: false,
        message: error.message || "Gagal memproses pengiriman. Silakan coba lagi.",
      };
    }
  },
});
