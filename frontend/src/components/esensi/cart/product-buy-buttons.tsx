import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import { cartState } from "@/lib/states/cart-state";
import {
  BookmarkCheck,
  BookmarkPlus,
  BookmarkX,
  Check,
  ShoppingBag,
  Minus,
  Plus,
} from "lucide-react";
import { useSnapshot } from "valtio";
import { Button } from "@/components/ui/button";
import { api as mainApi } from "@/lib/gen/main.esensi"; // Import the main API client

export const ProductBuyButtons = ({
  productId = null as string | null,
  bundleId = null as string | null,
  productData = null as any | null,
  actionBookmark = null as any | null,
  actionCart = null as any | null,
  isOwned = false as boolean,
  isBookmarked = true as boolean,
}) => {
  const cartRead = useSnapshot(cartState.write);
  const local = useLocal(
    {
      isBookmarkHover: false as boolean,
      isAddingToCart: false as boolean,
      quantity: 1 as number,
    },
    async () => {}
  );

  // Determine the item's ID and type
  const itemId = productId || bundleId;
  const itemType = productId ? "product" : "bundle";

  // Correctly determine if the item is already in the cart
  const existingCartItem = itemId
    ? cartRead.items.find(
        (item) => item.id === itemId && item.type === itemType
      )
    : null;
  const inCart = !!existingCartItem;

  /**
   * Handles adding an item to the cart.
   * If the item is already in the cart, it updates the quantity.
   * If it's a new item, it calls the backend API to get the complete
   * item data before adding it to the local cart state.
   */
  const handleAddToCart = async () => {
    if (!itemId) return;

    local.isAddingToCart = true;
    local.render();

    try {
      // If item already exists in cart, just update its quantity
      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity! + local.quantity;
        cartState.updateQuantity(itemId, itemType, newQuantity);
        navigate("/cart");
        return;
      }

      // If item is new, call the API to get its full data
      const response = await mainApi.add_to_cart({ id: itemId, type: itemType });

      if (response.success && response.item) {
        // Add the complete item from the API response to the cart state
        const completeItem = {
          ...response.item,
          quantity: local.quantity, // Set the quantity from the UI
        };

        cartState.write.items.push(completeItem);
        cartState.calculate();
        cartState.save();
        navigate("/cart");
      } else {
        // Handle API error gracefully
        alert(response.error || "Gagal menambahkan item ke keranjang.");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Terjadi kesalahan saat menambahkan ke keranjang");
    } finally {
      local.isAddingToCart = false;
      local.render();
    }
  };

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      local.quantity = Math.max(1, local.quantity + 1);
    } else {
      local.quantity = Math.max(1, local.quantity - 1);
    }
    local.render();
  };

  const buttonBuy = (
    <>
      {/* Quantity controls for physical products */}
      {productData?.is_physical && (
        <div className="flex items-center gap-2 h-full">
          <div className="flex h-full items-center border-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-full w-auto aspect-1/1 p-0 hover:text-[#3B2C93] hover:bg-transparent"
              onClick={() => handleQuantityChange(false)}
              disabled={local.quantity <= 1}
            >
              <Minus size={20} />
            </Button>
            <input
              type="number"
              value={local.quantity}
              onChange={(e) => {
                const value = Math.max(1, parseInt(e.target.value) || 1);
                local.quantity = value;
                local.render();
              }}
              className="w-12 h-full aspect-1/1 text-center border border-gray-300 rounded-md outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-full w-auto aspect-1/1 p-0 hover:text-[#3B2C93] hover:bg-transparent"
              onClick={() => handleQuantityChange(true)}
            >
              <Plus size={20} />
            </Button>
          </div>
        </div>
      )}
      <Button
        className={`flex grow-1 items-center h-full text-white ${
          inCart
            ? "bg-green-600 hover:bg-green-700"
            : "bg-[#C6011B] hover:bg-[#3B2C93]"
        }`}
        onClick={handleAddToCart}
        disabled={local.isAddingToCart}
      >
        {local.isAddingToCart ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            <span>Menambahkan...</span>
          </>
        ) : inCart ? (
          <>
            <Check size={20} strokeWidth={1.5} />
            <span>Lihat Keranjang</span>
          </>
        ) : (
          <>
            <ShoppingBag size={20} strokeWidth={1.5} />
            <span>Masukkan Keranjang</span>
          </>
        )}
      </Button>
    </>
  );

  const handleBookmarkHover = (e: any) => {
    local.isBookmarkHover = true;
    local.render();
  };

  const handleBookmarkHoverNot = (e: any) => {
    local.isBookmarkHover = false;
    local.render();
  };

  const buttonBookmark = (
    <Button
      variant="link"
      className={`hidden aspect-1/1 items-center h-full w-auto text-lg has-[>svg]:px-0 has-[>svg]:py-0 [&,&>svg]:transition-all ${
        isBookmarked
          ? "bg-[#16a085] text-white hover:bg-[#D4D8F7] hover:text-[#C6011B]"
          : "text-[#3B2C93] bg-[#D4D8F7] hover:text-white hover:bg-[#3B2C93]"
      }`}
      onMouseOver={handleBookmarkHover}
      onMouseLeave={handleBookmarkHoverNot}
    >
      {isBookmarked ? (
        local.isBookmarkHover ? (
          <BookmarkX className="size-7" strokeWidth={1.5} />
        ) : (
          <BookmarkCheck className="size-7" strokeWidth={1.5} />
        )
      ) : (
        <BookmarkPlus className="size-7" strokeWidth={1.5} />
      )}
    </Button>
  );

  const buttonDownload = <>Download</>;
  const buttonRead = <>baca</>;

  const buttonOwned = (
    <>
      {buttonRead}
      {buttonDownload}
    </>
  );

  return (
    <div className="flex justify-between items-center gap-3 fixed lg:relative p-3 lg:p-0 lg:order-5 bg-white left-0 bottom-0 lg:left-none lg:bottom-none w-full h-17 lg:h-10 lg:mt-5 z-51">
      {isOwned ? buttonOwned : buttonBuy}
      {!isOwned && buttonBookmark}
    </div>
  );
};
export default ProductBuyButtons;
