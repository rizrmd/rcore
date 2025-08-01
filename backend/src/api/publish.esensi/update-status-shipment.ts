import { auth } from "backend/lib/better-auth";
import { defineAPI } from "rlib/server";
import { z } from "zod";

// Define a schema for validating the request body.
const BodySchema = z.object({
  shipmentId: z.string().uuid({ message: "Invalid shipment ID format." }),
  status: z.string().min(1, { message: "Status cannot be empty." }),
});

// Define the type for the handler's input based on the schema
type HandlerOptions = {
  body: z.infer<typeof BodySchema>;
};

export default defineAPI({
  name: "update_status_shipment",
  url: "/api/update-status-shipment",
  async handler(options: HandlerOptions) { // MODIFIED: Accept options argument
    const req = this.req!;
    const body = options.body; // MODIFIED: Get body from the argument

    // --- 1. Authentication ---
    const session = await auth.api.getSession({ headers: req.headers });
    const user = session?.user;

    if (!user) {
      return { success: false, message: "Authentication required.", status: 401 };
    }

    // --- 2. Authorization ---
    const authorId = user.idAuthor;
    if (!authorId || authorId === "null") {
      return { success: false, message: "User is not an author.", status: 403 };
    }

    // --- 3. Input Validation ---
    const validation = BodySchema.safeParse(body);
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0]!.message, status: 400 };
    }

    const { shipmentId, status } = validation.data;

    try {
      // --- 4. Verify Ownership ---
      const shipment = await db.t_shipment.findFirst({
        where: {
          id: shipmentId,
          id_author: authorId,
        },
      });

      if (!shipment) {
        return { success: false, message: "Shipment not found or you do not have permission to update it.", status: 404 };
      }

      // --- 5. Update Shipment Status ---
      await db.t_shipment.update({
        where: {
          id: shipmentId,
        },
        data: {
          status: status,
        },
      });

      // --- 6. Return Success Response ---
      return {
        success: true,
        message: "Shipment status updated successfully.",
      };
    } catch (error) {
      console.error("Error updating shipment status:", error);
      return { success: false, message: "An unexpected error occurred.", status: 500 };
    }
  },
});