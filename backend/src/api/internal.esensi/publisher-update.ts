import type { ApiResponse } from "backend/lib/utils";
import { defineAPI } from "rlib/server";
import type { Publisher } from "shared/types";

export default defineAPI({
  name: "publisher_update",
  url: "/api/internal/publisher/update",
  async handler(arg: {
    id: string;
    name?: string;
    description?: string;
    website?: string;
    address?: string;
    logo?: string;
    id_user?: string;
    bank_account_number?: string;
    bank_account_provider?: string;
    bank_account_holder?: string;
  }): Promise<ApiResponse<Publisher>> {
    const {
      id,
      name,
      description,
      website,
      address,
      logo,
      id_user,
      bank_account_number,
      bank_account_provider,
      bank_account_holder,
    } = arg;

    if (!id?.trim())
      return {
        success: false,
        message: "ID penerbit wajib diisi",
      };

    // Check if publisher exists
    const existing = await db.publisher.findUnique({
      where: { id },
    });

    if (!existing)
      return {
        success: false,
        message: "Penerbit tidak ditemukan",
      };

    // If name is being updated, check for duplicates
    if (name && name.trim() !== existing.name) {
      const nameExists = await db.publisher.findFirst({
        where: { name: name.trim(), id: { not: id } },
      });

      if (nameExists)
        return {
          success: false,
          message: "Penerbit dengan nama tersebut sudah ada",
        };
    }

    // Build update data object
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (website !== undefined) updateData.website = website?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (logo !== undefined) updateData.logo = logo?.trim() || null;
    if (id_user !== undefined) updateData.id_user = id_user || null;
    if (bank_account_number !== undefined)
      updateData.bank_account_number = bank_account_number?.trim() || null;
    if (bank_account_provider !== undefined)
      updateData.bank_account_provider = bank_account_provider?.trim() || null;
    if (bank_account_holder !== undefined)
      updateData.bank_account_holder = bank_account_holder?.trim() || null;

    const result = await db.publisher.update({
      where: { id },
      data: updateData,
      include: {
        auth_user: true,
        publisher_author: {
          include: {
            author: {
              include: {
                book: { orderBy: { created_at: "desc" }, take: 10 },
                product: { orderBy: { published_date: "desc" }, take: 10 },
                _count: {
                  select: {
                    book: true,
                    product: true,
                  },
                },
              },
            },
          },
        },
        transaction: { orderBy: { created_at: "desc" }, take: 10 },
        promo_code: { orderBy: { valid_to: "desc" }, take: 10 },
        withdrawal: { orderBy: { requested_at: "desc" }, take: 10 },
      },
    });

    return {
      success: true,
      data: result,
    };
  },
});
