import { auth } from "backend/lib/better-auth";
import { defineAPI } from "rlib/server";
import { z } from "zod";

// Zod schema to validate the incoming address ID
const deleteAddressSchema = z.object({
  id: z.string().uuid("ID alamat tidak valid."),
});

export default defineAPI({
  name: "delete_address",
  url: "/api/delete-address",
  async handler(arg: z.infer<typeof deleteAddressSchema>) {
    try {
      const req = this.req!;
      const session = await auth.api.getSession({ headers: req.headers });
      const user = session?.user;

      if (!user || !user.idCustomer) {
        return { success: false, message: "Otentikasi diperlukan." };
      }

      const validationResult = deleteAddressSchema.safeParse(arg);
      if (!validationResult.success) {
        return {
          success: false,
          message: "Data yang dikirim tidak valid.",
          error: validationResult.error.flatten(),
        };
      }

      const { id } = validationResult.data;

      // Find the address first to see if it's the primary one
      const addressToDelete = await db.customer_address.findFirst({
        where: { id, id_customer: user.idCustomer },
      });

      if (!addressToDelete) {
        return { success: false, message: "Alamat tidak ditemukan." };
      }

      // Delete the address
      await db.customer_address.delete({
        where: { id, id_customer: user.idCustomer },
      });

      // If the deleted address was the primary one, set another one as primary
      if (addressToDelete.is_primary) {
        const nextAddress = await db.customer_address.findFirst({
          where: {
            id_customer: user.idCustomer,
            id: { not: id }, // Exclude the one we just deleted
          },
          orderBy: {
            created_at: 'asc', // Pick the oldest remaining address
          },
        });

        if (nextAddress) {
          await db.customer_address.update({
            where: { id: nextAddress.id },
            data: { is_primary: true },
          });
        }
      }

      return { success: true, message: "Alamat berhasil dihapus." };

    } catch (error) {
      console.error("Error deleting address:", error);
      return { success: false, message: "Gagal menghapus alamat." };
    }
  },
});
