import { max } from "lodash";
import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "checkcouponcode",
  url: "/api/check-coupon-code",
  async handler(arg: { code: string }) {
    const data = {
      status: "failed",
      message: "Terjadi kesalahan saat memeriksa kode promo.",
      coupon: {
        code: "",
        type: "",
        value: 0 as any,
        max_discount: null as any,
      },
    };

    if (!arg || !arg.code || arg.code.trim() === "") {
      data.message = "Kode promo tidak boleh kosong.";
      return data;
    } else {
      const couponCode = arg?.code ? arg.code : "";
      data.coupon.code = couponCode;

      // Check if coupon code exists in the database
      const checkCoupon = await db.promo_code.findFirst({
        where: {
          code: couponCode,
          status: "active",
        },
      });

      // Coupon not found
      if (!checkCoupon) {
        data.status = "failed";
        data.message = "Kode promo tidak ditemukan.";
        return data;
      }

      // Check if coupon quota is exceeded
      if (checkCoupon.usage_limit && checkCoupon.used_count >= checkCoupon.usage_limit) {
        data.message = "Kuota kode promo telah habis.";
        return data;
      }

      // Check coupon is in valid period between valid_from and valid_until
      const currentDate = new Date();
      if (checkCoupon.valid_from && currentDate < new Date(checkCoupon.valid_from)) {
        data.message = "Kode promo belum berlaku.";
        return data;
      }
      if (checkCoupon.valid_to && currentDate > new Date(checkCoupon.valid_to)) { 
        data.message = "Kode promo telah berakhir.";
        return data;
      } 

      // Coupon is valid
      data.status = "success";
      data.coupon.type = checkCoupon.discount_type;
      data.coupon.value = checkCoupon.discount_value;
      data.coupon.max_discount = checkCoupon.max_discount_amount || null;
      data.message = "Kode promo berhasil diterapkan.";
      return data;
    }
  },
});
