import { auth } from "backend/lib/better-auth";
import { defineAPI } from "rlib/server";
import { z } from "zod";

// Schema to validate the incoming request body
const BodySchema = z.object({
  shipmentId: z.string().uuid({ message: "Invalid shipment ID format." }),
  awb: z.string().min(1, { message: "AWB number cannot be empty." }),
});

type HandlerOptions = {
  body: z.infer<typeof BodySchema>;
};

export default defineAPI({
  name: "update_awb",
  url: "/api/update-awb",
  async handler(options: HandlerOptions) {
    const req = this.req!;
    const { shipmentId, awb } = options.body;

    // 1. Authentication & Authorization
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;
    const authorId = user?.idAuthor;

    if (!authorId || authorId === "null") {
      return { success: false, message: "User is not an author.", status: 403 };
    }

    // 2. Input Validation
    const validation = BodySchema.safeParse(options.body);
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0]!.message, status: 400 };
    }

    try {
      // 3. Verify Ownership of the shipment
      const shipment = await db.t_shipment.findFirst({
        where: {
          id: shipmentId,
          id_author: authorId,
        },
      });

      if (!shipment) {
        return { success: false, message: "Shipment not found or you do not have permission to update it.", status: 404 };
      }

      // 4. Update the AWB and status in the database
      const updatedShipment = await db.t_shipment.update({
        where: {
          id: shipmentId,
        },
        data: {
          awb: awb,
          status: 'shipping', // Automatically update status to 'shipping'
          shipped_at: new Date(), // Set the shipped_at timestamp
        },
      });

      return {
        success: true,
        message: "AWB and status updated successfully.",
        data: updatedShipment,
      };

    } catch (error) {
      console.error("Error updating AWB:", error);
      return { success: false, message: "An unexpected error occurred while updating the AWB.", status: 500 };
    }
  },
});
