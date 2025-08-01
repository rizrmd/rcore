'use client';

import React from 'react';

//================================================================//
// 1. DATA INTERFACES FOR THE SHIPPING LABEL                      //
//================================================================//

export interface Product {
  id: string;
  name: string;
  sku?: string;
  weight?: number; // Weight in grams
}

export interface SalesLine {
  id: string;
  qty: number;
  product: Product;
}

export interface Sales {
  id: string;
  t_sales_line: SalesLine[];
}

export interface LabelAuthor {
  id: string;
  name: string;
  author_address?: {
    address: string;
    city: string;
    province: string;
    postal_code: string;
    phone?: string;
  };
}

export interface ShipmentLabelData {
  id: string;
  awb: string;
  shipping_provider: string;
  shipping_service: string;
  shipping_cost: number;
  recipient_name: string;
  recipient_phone: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  notes?: string;
  t_sales: Sales;
  author: LabelAuthor;
}

interface ShippingLabelProps {
  shipment: ShipmentLabelData;
  courierClassName: string;
}

//================================================================//
// 2. SHIPPING LABEL COMPONENT                                    //
//================================================================//

export const ShippingLabel: React.FC<ShippingLabelProps> = ({
  shipment,
  courierClassName,
}) => {
  const recipientAddress = `${shipment.address_line}, ${shipment.city}, ${shipment.province}, ${shipment.postal_code}`;
  const senderAddress = shipment.author.author_address
    ? `${shipment.author.author_address.address}, ${shipment.author.author_address.city}, ${shipment.author.author_address.province}, ${shipment.author.author_address.postal_code}`
    : 'Address not available';

  const totalWeight = shipment.t_sales.t_sales_line.reduce((acc, item) => {
    const weight = item.product.weight || 0;
    return acc + (weight * item.qty);
  }, 0);

  return (
    <div id="shipping-label-content" className="bg-white p-6 border border-gray-200 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-gray-300">
        <img src="/img/esensi-online-logo.png" alt="Esensi" className="h-8 w-auto" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x40/cccccc/ffffff?text=Logo'; e.currentTarget.onerror = null; }} />
        <span className="text-xl font-bold">{shipment.shipping_service}</span>
        <span className={courierClassName}>{shipment.shipping_provider.toUpperCase()}</span>
      </div>

      {/* AWB */}
      <div className="border-2 border-black text-center my-4 py-2">
        <p className="font-semibold">No. Resi: <span className="font-bold text-lg">{shipment.awb}</span></p>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-dashed border-gray-300">
        <div>
          <p className="text-sm text-gray-600">Penerima: <span className="font-bold text-black">{shipment.recipient_name}</span></p>
          <p className="text-sm font-semibold mt-1">{shipment.recipient_phone}</p>
          <p className="mt-2 text-sm font-semibold">{recipientAddress}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Pengirim: <span className="font-bold text-black">{shipment.author.name}</span></p>
          <p className="text-sm font-semibold mt-1">{shipment.author.author_address?.phone || 'No phone'}</p>
          <p className="mt-2 text-sm font-semibold">{senderAddress}</p>
        </div>
      </div>
      
      {/* Details */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 mt-4 text-sm border-t border-b border-gray-300 py-2">
        <div><span className="font-semibold">Berat:</span> {totalWeight} gr</div>
        <div><span className="font-semibold">Ongkir:</span> Rp{shipment.shipping_cost.toLocaleString('id-ID')}</div>
        <div className="font-bold text-lg text-center col-span-3 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-gray-300 pt-2 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">CASHLESS</div>
      </div>
      
      {/* Items Table */}
      <div className="mt-4 border-t-2 border-black pt-2">
        <p className="font-semibold mb-1">No. Pesanan: {shipment.t_sales.id}</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-1 font-semibold">Nama Produk</th>
              <th className="py-1 font-semibold text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {shipment.t_sales.t_sales_line.map((item) => (
              <tr key={item.id}>
                <td className="py-1">{item.product.name}</td>
                <td className="py-1 text-right font-bold">{item.qty}x</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shipment.notes && <p className="text-xs mt-2 pt-2 border-t border-dashed">Pesan: {shipment.notes}</p>}
      </div>
    </div>
  );
};