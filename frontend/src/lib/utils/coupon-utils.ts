import { api } from "@/lib/gen/main.esensi";

export interface CouponResponse {
  status: "success" | "failed";
  message: string;
  coupon: {
    code: string;
    type: string;
    value: number;
    max_discount: number | null;
  };
}

/**
 * Check coupon code validity using the API
 */
export async function checkCouponCode(code: string): Promise<CouponResponse> {
  try {
    const response = await api.checkcouponcode({ code });
    return response as CouponResponse;
  } catch (error) {
    console.error("Error checking coupon code:", error);
    return {
      status: "failed",
      message: "Terjadi kesalahan saat memeriksa kode promo.",
      coupon: {
        code: "",
        type: "",
        value: 0,
        max_discount: null,
      },
    };
  }
}

/**
 * Calculate discount amount based on coupon type and cart total
 */
export function calculateCouponDiscount(
  coupon: CouponResponse["coupon"],
  cartTotal: number
): number {
  if (!coupon.type || !coupon.value) {
    return 0;
  }

  let discount = 0;

  if (coupon.type === "percent") {
    // Calculate percentage discount
    discount = (cartTotal * coupon.value) / 100;
    
    // Apply max discount limit if exists
    if (coupon.max_discount !== null && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else if (coupon.type === "amount") {
    // Direct amount discount
    discount = coupon.value;
    
    // Apply max discount limit if exists (though for amount type, it's usually the same as value)
    if (coupon.max_discount !== null && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
    
    // Ensure discount doesn't exceed cart total
    if (discount > cartTotal) {
      discount = cartTotal;
    }
  }

  return Math.max(0, discount);
}

/**
 * Apply coupon discount to cart and return the result
 */
export async function applyCouponToCart(
  couponCode: string,
  cartTotal: number
): Promise<{
  success: boolean;
  discount: number;
  message: string;
  couponData?: CouponResponse["coupon"];
}> {
  // Check coupon validity
  const response = await checkCouponCode(couponCode);
  
  if (response.status === "failed") {
    return {
      success: false,
      discount: 0,
      message: response.message,
    };
  }

  // Calculate discount
  const discount = calculateCouponDiscount(response.coupon, cartTotal);
  
  return {
    success: true,
    discount,
    message: response.message,
    couponData: response.coupon,
  };
}
