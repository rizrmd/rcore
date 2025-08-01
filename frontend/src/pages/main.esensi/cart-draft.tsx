import { CartAddress } from "@/components/esensi/cart/cart-address";
import { CheckoutForm } from "@/components/esensi/cart/checkout-form";
import { DiscountPercent } from "@/components/esensi/ui/discount-percent";
import { formatMoney } from "@/components/esensi/utils/format-money";
import { ImgThumb } from "@/components/esensi/ui/img-thumb";
import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { Link, navigate } from "@/lib/router";
import { cartState } from "@/lib/states/cart-state";
import { applyCouponToCart } from "@/lib/utils/coupon-utils";
import { ChevronUp, SquarePen, Trash2, X, TicketPercent } from "lucide-react";
import { useEffect } from "react";
import { useSnapshot } from "valtio";

export default () => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    breakdown: false,
    title: "Keranjang Belanja",
    cart: false,
    profile: false,
  };

  const cartRead = useSnapshot(cartState.write);
  const local = useLocal(
    {
      loading: true,
      checked: [] as string[],
      breakdown: false,
      showAddress: false,
      allAddresses: [] as any[],
      selectedAddressId: null as string | null,
      couponCode: "",
      couponApplied: false,
      couponDiscount: 0,
      couponError: "",
      couponData: null as
        | {
            code: string;
            type: string;
            value: number;
            max_discount: number | null;
          }
        | null
        | undefined,
      couponLoading: false,
    },
    async () => {
      cartState.load();
      local.loading = false;
      local.render();

      handleCheckPhysicalBook(cartRead.items as any);

      if (local.showAddress) {
        try {
          const addresses = await api.customer_addresses();
          if (addresses && addresses.length > 0) {
            local.allAddresses = addresses;
            const primaryAddress =
              addresses.find((addr: any) => addr.is_primary) || addresses[0];
            if (primaryAddress) {
              local.selectedAddressId = primaryAddress.id;
            }
          }
        } catch (error) {
          console.error("Failed to fetch addresses:", error);
        }
      }
      local.loading = false;
      local.render();
    }
  );

  const handleCheckPhysicalBook = (items: readonly any[]) => {
    const hasPhysicalItem = items.some(
      (item) => item.type === "product" && item.is_physical
    );
    local.showAddress = hasPhysicalItem;
  };

  useEffect(() => {
    const checkCartAndFetchData = async () => {
      const hasPhysicalItem = (cartRead.items as any[]).some(
        (item) => item.type === "product" && item.is_physical
      );
      local.showAddress = hasPhysicalItem;
      if (hasPhysicalItem && local.allAddresses.length === 0) {
        local.loading = true;
        local.render();
        try {
          const addresses = await api.customer_addresses();
          if (addresses && addresses.length > 0) {
            local.allAddresses = addresses;
            const primaryAddress =
              addresses.find((addr: any) => addr.is_primary) || addresses[0];
            if (primaryAddress) {
              local.selectedAddressId = primaryAddress.id;
            }
          }
        } catch (error) {
          console.error("Failed to fetch addresses:", error);
        } finally {
          local.loading = false;
          local.render();
        }
      }
      cartState.calculate();
    };

    checkCartAndFetchData();
  }, [cartRead.items]);

  const handleQuantityChange = (
    id: string,
    type: "bundle" | "product",
    change: number
  ) => {
    const item = cartRead.items.find(
      (item) => item.id === id && item.type === type
    );
    if (item && item.quantity) {
      const newQuantity = item.quantity + change;
      cartState.updateQuantity(id, type, Math.max(1, newQuantity));
    }
  };

  const handleRemoveItem = (id: string, type: "bundle" | "product") => {
    cartState.removeItem(id, type);
    // Remove from checked items if it was checked
    local.checked = local.checked.filter(
      (itemId) => itemId !== `${type}-${id}`
    );
    local.render();
  };

  const handleCheckItem = (itemId: string, checked: boolean) => {
    if (checked) {
      if (!local.checked.includes(itemId)) {
        local.checked.push(itemId);
      }
    } else {
      local.checked = local.checked.filter((id) => id !== itemId);
    }
    local.render();
  };

  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      local.checked = cartRead.items
        .filter((item) => item.id && item.type)
        .map((item) => `${item.type}-${item.id}`);
    } else {
      local.checked = [];
    }
    local.render();
  };

  const handleDeleteChecked = () => {
    if (local.checked.length === 0) {
      alert("Tidak ada item yang dipilih untuk dihapus.");
      return;
    }

    if (
      window.confirm("Apakah Anda yakin ingin menghapus item yang dipilih?")
    ) {
      for (const itemId of local.checked) {
        const [type, id] = itemId.split("-");
        cartState.removeItem(id, type as "bundle" | "product");
      }
      local.checked = [];
      local.render();
    }
  };

  const handleBreakdown = () => {
    local.breakdown = !local.breakdown;
    local.render();
  };

  const handleApplyCoupon = async () => {
    const couponCode = local.couponCode.trim().toUpperCase();

    // Reset previous states
    local.couponError = "";
    local.couponApplied = false;
    local.couponDiscount = 0;
    local.couponData = null;

    if (!couponCode) {
      local.couponError = "Masukkan kode kupon";
      local.render();
      return;
    }

    try {
      // Show loading state
      local.couponLoading = true;
      local.render();

      // Apply coupon using the utility function
      const result = await applyCouponToCart(couponCode, cartRead.subtotal);

      if (result.success) {
        local.couponApplied = true;
        local.couponData = result.couponData;

        // Calculate discount based on coupon type
        let discount = 0;
        if (result.couponData?.type === "percent") {
          // Calculate percentage discount from cart total
          discount = (cartRead.total * result.couponData.value) / 100;

          // Apply max discount limit if exists
          if (
            result.couponData.max_discount !== null &&
            discount > result.couponData.max_discount
          ) {
            discount = result.couponData.max_discount;
          }
        } else {
          // For fixed amount discount, use the calculated discount from utility
          discount = result.discount;
        }

        local.couponDiscount = discount;
        local.couponError = "";
      } else {
        local.couponError = result.message;
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      local.couponError = "Terjadi kesalahan saat memproses kupon";
    } finally {
      local.couponLoading = false;
      local.render();
    }
  };

  const handleRemoveCoupon = () => {
    // Reset local coupon state
    local.couponApplied = false;
    local.couponDiscount = 0;
    local.couponCode = "";
    local.couponError = "";
    local.couponData = null;

    local.render();
  };

  const isAllChecked =
    cartRead.items.length > 0 && local.checked.length === cartRead.items.length;

  const cartDeleteChecked = local.checked.length > 0 && (
    <div className="flex items-center text-[#3B2C93]">
      <Button
        className="flex items-center gap-2"
        variant="ghost"
        onClick={handleDeleteChecked}
      >
        <Trash2 strokeWidth={3} />
        <span className="text-[#3B2C93]">
          {cartRead.items.length == local.checked.length
            ? "Hapus semua"
            : "Hapus yang dipilih"}
        </span>
      </Button>
    </div>
  );

  const cartCheckAll = (
    <div className="flex justify-between items-stretch w-full gap-3 h-12 px-2 lg:border bg-white lg:rounded-md">
      <div className="flex w-auto py-1 justify-center items-center shrink-0">
        <label className="flex items-center gap-4 px-1.5 cursor-pointer">
          <input
            type="checkbox"
            onChange={(e) => handleCheckAll(e.target.checked)}
            checked={isAllChecked}
          />
          <span className="text-sm font-medium text-[#383D64]">
            Pilih Semua
          </span>
        </label>
      </div>
      {cartDeleteChecked}
    </div>
  );

  const cartEmpty = (
    <div className="flex flex-col justify-center items-center aspect-4/3 lg:aspect-[unset] w-full bg-white p-4">
      <div className="flex flex-col text-[#3B2C93] justify-center items-center text-center leading-[1.3] gap-2 grow-1 lg:py-10 lg:gap-3">
        <h2 className="flex font-bold lg:text-xl">Keranjang Kamu Kosong</h2>
        <p>
          Kami punya banyak buku yang siap memberi kamu ilmu baru. Yuk belanja
          sekarang!
        </p>
      </div>
      <div className="flex flex-col py-2">
        <Button
          className="bg-[#3B2C93] text-white px-8 h-12 rounded-2xl w-full"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <span>Mulai Belanja</span>
        </Button>
      </div>
    </div>
  );

  const cartItemsList = cartRead.items.map((ci, idx) => {
    const itemId = `${ci.type}-${ci.id}`;
    const isChecked = local.checked.includes(itemId);

    return (
      <div
        className={`flex justify-between lg:justify-start items-start w-full gap-3 py-4 px-2 lg:gap-5 ${
          isChecked ? "bg-[#f5f8ff]" : "lg:bg-white"
        }`}
        key={`esensi_cart_item_${idx}`}
      >
        <div className="flex w-8 py-1 justify-center items-start shrink-0 lg:h-full lg:items-center">
          <input
            type="checkbox"
            className=""
            onChange={(e) => handleCheckItem(itemId, e.target.checked)}
            checked={isChecked}
          />
        </div>
        <div className="flex w-1/4 lg:w-20 shrink-0">
          <ImgThumb
            src={ci.cover}
            alt={ci.name}
            width={320}
            className="aspect-3/4"
          />
        </div>
        <div className="flex flex-col w-auto self-stretch gap-3 lg:flex-row lg:items-center lg:grow-1 lg:h-full lg:py-1 lg:gap-4">
          <div className="flex flex-col gap-1 shrink-0 lg:w-1/2">
            <h5 className="text-[#3B2C93] leading-[1.2] font-semibold">
              {ci.name}
            </h5>
            <div className="flex justify-start w-auto">
              {ci?.is_physical === true ? (
                <span className="w-auto px-1 py-[1px] text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-500 rounded-xs">
                  Buku cetak
                </span>
              ) : (
                <span className="w-auto px-1 py-[1px] text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-500 rounded-xs">
                  Ebook
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col grow-1 items-start lg:flex-row lg:items-center lg:justify-between lg:gap-2 lg:w-auto lg:whitespace-nowrap">
            <div className="flex flex-col grow-1 lg:grow-0">
              <DiscountPercent
                real_price={ci.real_price}
                strike_price={ci.strike_price}
                currency={ci.currency}
              />
              <strong
                className={`${
                  ci.strike_price && ci.real_price && ci.strike_price > ci.real_price
                    ? "text-[#C6011B]"
                    : "text-black"
                }`}
              >
                {formatMoney(ci.real_price, ci.currency)}
              </strong>
            </div>

            {(ci as any).is_physical ? (
              <div className="flex items-center lg:justify-end space-x-2 h-9 min-w-25 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ci.id && ci.type && handleQuantityChange(ci.id, ci.type, -1)}
                  disabled={!ci.quantity || ci.quantity <= 1}
                  className="h-6 w-6 p-0"
                >
                  -
                </Button>
                <span className="text-sm font-medium min-w-[1.5rem] text-center">
                  {ci.quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ci.id && ci.type && handleQuantityChange(ci.id, ci.type, 1)}
                  className="h-6 w-6 p-0"
                >
                  +
                </Button>
              </div>
            ) : (
              <div className="hidden lg:block min-w-25"></div>
            )}
          </div>
        </div>
        <div className="flex w-auto items-end self-stretch shrink-0 lg:items-center">
          <Button
            variant={"ghost"}
            className="text-[#3B2C93]"
            onClick={(e) => {
              e.preventDefault();
              if (
                window.confirm(
                  "Apakah Anda yakin ingin menghapus item ini dari keranjang?"
                )
              ) {
                ci.id && ci.type && handleRemoveItem(ci.id, ci.type);
              }
            }}
          >
            <Trash2 strokeWidth={3} />
          </Button>
        </div>
      </div>
    );
  });

  const cartItems = (
    <>
      {cartCheckAll}
      <div className="flex flex-col w-full h-auto gap-1 lg:gap-px bg-white lg:border lg:bg-transparent lg:rounded-md lg:overflow-hidden">
        {cartItemsList}
      </div>
    </>
  );

  const renderCart = cartRead.items.length > 0 ? cartItems : cartEmpty;

  const renderBreakdown = () => {
    // Find the full address object based on the currently selected ID
    const selectedAddress = local.allAddresses.find(
      (addr) => addr.id === local.selectedAddressId
    );

    return (
      <div
        className={`w-full ${
          cartRead.items.length > 0 ? "flex" : "hidden lg:flex"
        } flex-col lg:rounded-sm lg:overflow-hidden bg-white lg:bg-[#3B2C93] lg:text-white`}
      >
        {local.showAddress && (
          <>
            <div className="flex flex-col gap-4 px-4 py-3 lg:px-6 lg:py-4 lg:order-2 lg:border-y lg:border-[#ffffff21] lg:mt-4">
              <div className="flex justify-between items-center w-full">
                <h3 className="text-md text-[#3B2C93] lg:text-white font-semibold">
                  Alamat Pengiriman
                </h3>
                <Link
                  href="/address"
                  className="text-xs text-[#3B2C93] lg:text-white flex items-center gap-1 border border-[#3B2C93] lg:border-white rounded-md px-2 py-1 hover:bg-white hover:text-[#3B2C93] transition-colors"
                >
                  <SquarePen size={15} /> Ubah
                </Link>
              </div>

              {local.loading ? (
                <div className="text-sm text-gray-500 lg:text-gray-300">
                  Memuat alamat...
                </div>
              ) : local.allAddresses.length > 0 ? (
                <select
                  value={local.selectedAddressId || ""}
                  onChange={(e) => {
                    local.selectedAddressId = e.target.value;
                    local.render();
                  }}
                  className="w-full p-2 border rounded-md text-sm text-black lg:text-white"
                >
                  {local.allAddresses.map((addr: any) => (
                    <option
                      className="text-black"
                      key={addr.id}
                      value={addr.id}
                    >
                      {addr.address}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500 lg:text-gray-300">
                  Alamat tidak ditemukan.{" "}
                  <Link href="/address" className="underline">
                    Tambah alamat
                  </Link>
                  .
                </div>
              )}
            </div>
          </>
        )}

        {/* Top Part of Summary (The part that slides up) */}
        <div
          className={`flex flex-col w-full h-fit fixed bottom-0 left-0 bg-white lg:bg-transparent pt-2 pb-16 px-4 gap-3 lg:text-white lg:relative lg:bottom-auto lg:left-auto lg:py-6 lg:px-6 lg:pb-0 lg:gap-4 shadow-[0_-4px_30px_1px_rgba(0,0,0,0.15)] transition-transform duration-300 ${
            local.breakdown
              ? "translate-y-0"
              : "translate-y-full lg:translate-y-0"
          } lg:shadow-none lg:h-auto lg:order-0`}
        >
          <span className="font-bold text-[#3B2C93] lg:text-white">
            Ringkasan keranjang
          </span>
          <div className="flex flex-col w-full lg:gap-2 [&>div]:flex [&>div]:justify-between">
            <div>
              <span>Subtotal harga ({cartState.getItemCount()} Barang)</span>
              <span>{formatMoney(cartRead.subtotal, cartRead.currency)}</span>
            </div>
            <div>
              <span>Diskon Belanja</span>
              <strong className="text-[#C6011B] lg:text-[#D4D8F7]">
                – {formatMoney(cartRead.diskon, cartRead.currency)}
              </strong>
            </div>
            {local.couponApplied && local.couponData && (
              <div>
                <span>
                  Kupon <span className="uppercase">{local.couponCode}</span>
                </span>
                <strong className="text-[#C6011B] lg:text-[#D4D8F7]">
                  – {formatMoney(local.couponDiscount, cartRead.currency)}
                </strong>
              </div>
            )}
          </div>

          {/* COUPON BOX */}
          <div className="flex flex-col w-full gap-2">
            {!local.couponApplied ? (
              <div className="flex flex-col w-full gap-2 border-b border-gray-300 pb-3 lg:border-0 lg:pb-0">
                <span className="text-sm font-medium text-[#3B2C93] lg:text-white">
                  Kode Kupon
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan kode kupon"
                    value={local.couponCode}
                    onChange={(e) => {
                      local.couponCode = e.target.value;
                      local.render();
                    }}
                    className="uppercase flex-1 px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none text-black lg:text-white lg:bg-transparent lg:border-white lg:focus:bg-[#ffffff12]"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={local.couponLoading}
                    className="px-4 py-2 h-full rounded-sm text-sm bg-[#3B2C93] text-white border-[#3B2C93] hover:bg-[#2A1F6B] lg:bg-white lg:text-[#3B2C93] lg:border-white lg:hover:bg-gray-100 disabled:opacity-50"
                  >
                    {local.couponLoading ? "Memproses..." : "Terapkan"}
                  </Button>
                </div>

                {/* Error Messages */}
                {local.couponError && (
                  <div className="text-xs text-red-500 mt-1">
                    {local.couponError}
                  </div>
                )}
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-[#3B2C93] lg:text-white">
                  Kupon Diterapkan
                </span>

                {/* Simple Coupon Display */}
                <div className="bg-green-100 border border-green-300 rounded-md p-3">
                  <div className="flex justify-between items-center gap-2">
                    <TicketPercent
                      size={40}
                      className="w-auto shrink-0 text-green-800"
                    />
                    <div className="flex flex-col grow-1">
                      <span className="text-sm font-semibold text-green-800 uppercase flex items-center gap-2">
                        {local.couponCode}
                      </span>
                      <span className="text-xs text-green-600">
                        {local.couponData?.type === "percent"
                          ? `Diskon ${local.couponData.value}%${
                              local.couponData.max_discount !== null &&
                              local.couponData.max_discount > 0
                                ? ` max ${formatMoney(
                                    local.couponData.max_discount,
                                    cartRead.currency
                                  )}`
                                : ``
                            }`
                          : `Hemat ${formatMoney(
                              local.couponDiscount,
                              cartRead.currency
                            )}`}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="cursor-pointer shrink-0 text-xs text-green-700 hover:text-green-900 flex items-center gap-1"
                    >
                      <X size={12} />
                      Hapus
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Part of Summary (Total & Checkout Button) */}
        <div
          className={`flex w-full justify-between items-center h-14 py-1 px-4 fixed bottom-0 left-0 bg-white lg:bg-transparent lg:relative lg:bottom-auto lg:left-auto lg:py-6 lg:px-6 lg:h-fit ${
            local.breakdown ? "" : "shadow-[0_-4px_30px_1px_rgba(0,0,0,0.15)]"
          } lg:shadow-none lg:order-10`}
        >
          <div
            className="flex flex-col items-start py-1 cursor-pointer lg:cursor-default"
            onClick={handleBreakdown}
          >
            <span className="text-[#B0B0B0] font-medium text-sm">Total</span>
            <div className="flex gap-2 items-center text-[#3B2C93] lg:text-white">
              <strong className="font-bold text-lg lg:text-2xl">
                {formatMoney(
                  cartRead.total - local.couponDiscount,
                  cartRead.currency
                )}
              </strong>
              <ChevronUp strokeWidth={1.75} className="lg:hidden" />
            </div>
          </div>

          <div
            className={`h-full flex items-center py-1 ${
              !cartRead.items.length && "hidden"
            }`}
          >
            <CheckoutForm
              cartItems={[...cartRead.items]}
              total={cartRead.total - local.couponDiscount}
              shippingAddress={selectedAddress}
              onSuccess={() => {
                cartState.clear();
                local.render();
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderLoading = (
    <div className="flex justify-center items-center w-full h-64">
      <span className="text-gray-500">Memuat keranjang...</span>
    </div>
  );

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={false}>
      <div className="flex flex-col w-full h-auto gap-4 bg-[#E1E5EF] lg:bg-white items-center lg:py-10 lg:gap-6">
        {cartRead.items.length > 0 && (
          <h2 className="hidden w-full lg:flex flex-start text-[#3B2C93] max-w-[1200px] text-3xl font-semibold">
            Keranjang
          </h2>
        )}

        <div className="flex flex-col w-full h-auto lg:auto lg:flex-row gap-4 lg:gap-6 max-w-[1200px]">
          <div className="flex flex-col lg:grow-1 w-full h-auto gap-4 [&_input[type=checkbox]]:w-5 [&_input[type=checkbox]]:h-5 [&_input[type=checkbox]]:border-0.5 [&_input[type=checkbox]]:border-[#3B2C93] [&_input[type=checkbox]]:rounded-xs">
            {local.loading ? renderLoading : renderCart}
            {/* {local.showAddress && renderAddresses} */}
          </div>
          {/* This container ensures the summary is always shown when the cart is not empty */}
          <div
            className={`w-full lg:w-1/3 shrink-0 ${
              cartRead.items.length === 0 ? "hidden" : "flex"
            }`}
          >
            {!local.loading && renderBreakdown()}
          </div>
        </div>
        <div className="flex flex-col w-full h-auto bg-white p-6 lg:-mb-10 lg:pb-10">
          <div className="max-w-[1200px]">{/* Recommendation */}</div>
        </div>
      </div>
    </MainEsensiLayout>
  );
};
