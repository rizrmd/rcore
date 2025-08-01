import { auth } from "backend/lib/better-auth";
import { defineAPI } from "rlib/server";
import { z } from "zod";

// 1. UPDATE: Add `id_subdistrict` to the Zod schema
const addressSchema = z.object({
  id: z.string().uuid().optional(),
  fullname: z.string().min(1, "Nama penerima wajib diisi"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  country: z.string().min(1, "Negara wajib dipilih"),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  city: z.string().min(1, "Kota wajib dipilih"),
  district: z.string().min(1, "Kecamatan wajib dipilih"),
  village: z.string().min(1, "Desa/Kelurahan wajib dipilih"),
  postal_code: z.string().min(1, "Kode pos wajib diisi"),
  streets: z.string().min(1, "Detail alamat jalan wajib diisi"),
  address: z.string().min(1, "Alamat lengkap wajib diisi"),
  notes: z.string().optional(),
  is_default: z.boolean().optional(),
  // Add the verified subdistrict ID from the search API
  id_subdistrict: z.union([z.string(), z.number()])
    .refine(val => val != null, { message: "ID Kecamatan terverifikasi wajib ada." }),
});


export default defineAPI({
  name: "save_address",
  url: "/api/save-address",
  async handler(arg: z.infer<typeof addressSchema>) {
    try {
      const req = this.req!;
      const session = await auth.api.getSession({ headers: req.headers });
      const user = session?.user;

      if (!user || !user.idCustomer) {
        return { success: false, message: "Otentikasi diperlukan." };
      }

      const validationResult = addressSchema.safeParse(arg);

      if (!validationResult.success) {
        return {
          success: false,
          message: "Data yang dikirim tidak valid.",
          error: validationResult.error.flatten(),
        };
      }
      
      const { id, ...data } = validationResult.data;

      // 2. UPDATE: Use the new `id_subdistrict` from the payload
      const dbDataPayload = {
        province: data.province,
        city: data.city, 
        regency: data.city, 
        village: data.village,
        // Ensure the ID is stored as a string, as expected by the database
        id_subdistrict: String(data.id_subdistrict),
        postal_code: data.postal_code,
        address: data.address,
        notes: data.notes,
        is_primary: data.is_default, 
      };

      let savedAddress;
      if (id) {
        // Update existing address
        savedAddress = await db.customer_address.update({
          where: { id: id, id_customer: user.idCustomer },
          data: dbDataPayload,
        });
      } else {
        // Create new address
        savedAddress = await db.customer_address.create({
          data: {
            ...dbDataPayload,
            customer: {
              connect: {
                id: user.idCustomer,
              },
            },
          },
        });
      }

      // If this address is set as default, update others
      if (data.is_default) {
        await db.customer_address.updateMany({
          where: {
            id_customer: user.idCustomer,
            id: { not: savedAddress.id },
          },
          data: {
            is_primary: false,
          },
        });
      }
      
      return { success: true, data: { address: savedAddress }, message: "Alamat berhasil disimpan!" };

    } catch (error) {
      console.error("Error saving address:", error);
      return { success: false, message: "Gagal menyimpan alamat." };
    }
  },
}); 