import React from "react";

// Define the type for a single shipment object, which will be the component's main prop.
type Shipment = {
  id: string;
  orderId: string;
  date: string;
  status: string;
  courier: string;
  awb: string | null;
  items: { name: string; cover: string }[];
};

interface ShipmentCardProps {
  shipment: Shipment;
}

// Helper function to get the display label for a status.
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Menunggu Konfirmasi",
    unpaid: "Menunggu Pembayaran",
    waiting: "Siap Dikirim",
    shipping: "Dalam Pengiriman",
    delivered: "Telah Diterima",
    canceled: "Dibatalkan",
  };
  return labels[status] || status;
}

// Helper function to get the Tailwind CSS classes for the status badge.
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "delivered": return "bg-emerald-500 text-white";
    case "shipping": return "bg-blue-500 text-white";
    case "waiting": return "bg-purple-500 text-white";
    case "pending": return "bg-amber-500 text-white";
    case "canceled": return "bg-red-500 text-white";
    default: return "bg-gray-200 text-gray-800";
  }
};

export const ShipmentCard = ({ shipment }: ShipmentCardProps) => {
  // Return null if there are no items to display, making the component resilient.
  if (!shipment.items || shipment.items.length === 0) {
    return null;
  }

  const firstItem = shipment.items[0];
  const otherItemsCount = shipment.items.length - 1;

  return (
    <a
      href={`/shipment/${shipment.id}`}
      className="block bg-white p-4 rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] border border-gray-100 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <img
            src={firstItem.cover}
            alt={firstItem.name}
            className="w-24 h-32 sm:w-28 sm:h-40 object-cover rounded-md border border-gray-200"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-bold text-sm sm:text-base text-gray-800 line-clamp-2">
                {firstItem.name}
              </p>
              {otherItemsCount > 0 && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  + {otherItemsCount} produk lainnya
                </p>
              )}
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium self-start whitespace-nowrap ${getStatusBadgeColor(
                shipment.status
              )}`}
            >
              {getStatusLabel(shipment.status)}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex flex-col sm:flex-row text-xs sm:text-sm text-gray-500 gap-x-4 gap-y-1">
              <span>📅 {shipment.date}</span>
              <span>🚚 {shipment.courier || 'N/A'}</span>
            </div>
            {shipment.awb && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Resi: <span className="font-semibold text-gray-700">{shipment.awb}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
};

export default ShipmentCard;