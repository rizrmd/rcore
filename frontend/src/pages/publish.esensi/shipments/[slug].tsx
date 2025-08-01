'use client';

import { useEffect, useRef } from "react";
import { api } from "@/lib/gen/publish.esensi";
import { useLocal } from "@/lib/hooks/use-local";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // NEW: Import Input component
import { ArrowLeft, User, Home, Truck, File, Printer, AlertCircle, Loader2 } from "lucide-react"; // NEW: Import Loader2 for loading state
import { PublishPageHeader } from "@/components/esensi/publish";
import { navigate } from "@/lib/router";
import { useRouter } from "@/lib/hooks/use-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShippingLabel, type ShipmentLabelData } from "@/components/esensi/shipment/shipment-label";


//================================================================//
// 1. DATA INTERFACES FOR THE API RESPONSE                        //
//================================================================//

interface ApiItem {
  name: string;
  sku: string;
  cover: string;
  weight: number;
  quantity: number;
  price: string;
  total: string;
}

interface ApiAuthor {
  id: string;
  name: string;
  phone: string;
  address: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

interface ShipmentApiResponse {
  id: string;
  status: string;
  awb: string | null;
  courier: { provider: string; service: string };
  shipping_cost: string;
  dates: { created: string; shipped: string | null; delivered: string | null };
  author: ApiAuthor;
  customer: { name: string; email: string };
  shippingAddress: { recipient: string; phone: string; address: string; city: string; province: string; postalCode: string };
  notes: string;
  items: ApiItem[];
}

//================================================================//
// 2. HELPER FUNCTIONS                                            //
//================================================================//

const formatCurrency = (amount: number, currency = "IDR") => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "unpaid": return <Badge variant="destructive">Menunggu Pembayaran</Badge>;
    case "pending": return <Badge variant="outline">Menunggu Konfirmasi</Badge>;
    case "waiting": return <Badge className="bg-amber-500 text-white">Siap Dikirim</Badge>;
    case "shipping": return <Badge className="bg-blue-500 text-white">Dalam Pengiriman</Badge>;
    case "delivered": return <Badge className="bg-green-500 text-white">Telah Diterima</Badge>;
    case "canceled": return <Badge variant="secondary">Dibatalkan</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};


//================================================================//
// 3. MAIN PAGE COMPONENT                                         //
//================================================================//

export default function ShipmentDetailPage() {
  const router = useRouter();
  const { slug: shipmentId } = router.params as { slug: string };

  const local = useLocal({
    shipment: null as ShipmentApiResponse | null,
    isLoading: true,
    error: null as string | null,
    isLabelSheetOpen: false,
    updateError: null as string | null,
    awbInput: "", // NEW: State for AWB input field
    isUpdatingAwb: false, // NEW: Loading state for AWB update process
  });

  const labelPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    const node = labelPrintRef.current;
    if (!node || !local.shipment) return;

    if (local.shipment.status === 'pending') {
      try {
        local.updateError = null;
        
        const response = await api.update_status_shipment({
          body: {
            shipmentId: local.shipment.id,
            status: 'waiting',
          }
        });

        if (response.success) {
          if (local.shipment) {
            local.shipment.status = 'waiting';
          }
        } else {
          local.updateError = response.message || "Gagal memperbarui status pengiriman.";
        }
      } catch (err: any) {
        local.updateError = err.message || "Terjadi kesalahan saat menghubungi server.";
      } finally {
        local.render();
      }
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print the label.");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Label Pengiriman</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
                font-family: 'Inter', sans-serif;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            @page {
              size: A6;
              margin: 0;
            }
            @media print {
              body {
                margin: 0.5cm;
              }
            }
          </style>
        </head>
        <body>
          ${node.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
  };
  
  // NEW: Handler to update AWB and then update status
  const handleAwbUpdate = async () => {
    if (!local.shipment || !local.awbInput.trim()) {
      local.updateError = "Nomor AWB tidak boleh kosong.";
      local.render();
      return;
    }

    local.isUpdatingAwb = true;
    local.updateError = null;
    local.render();

    try {
      // Step 1: Update the AWB number
      const awbResponse = await api.update_awb({
        body: {
          shipmentId: local.shipment.id,
          awb: local.awbInput.trim(),
        },
      });

      if (!awbResponse.success) {
        throw new Error(awbResponse.message || "Gagal memperbarui nomor AWB.");
      }
      
      // On successful AWB update, update local state for better UX
      local.shipment.awb = local.awbInput.trim();

      // Step 2: Update the status to 'shipping'
      const statusResponse = await api.update_status_shipment({
        body: {
          shipmentId: local.shipment.id,
          status: 'shipping',
        },
      });

      if (!statusResponse.success) {
        throw new Error(statusResponse.message || "AWB diperbarui, namun gagal mengubah status menjadi 'Dalam Pengiriman'.");
      }
      
      local.shipment.status = 'shipping';
      local.awbInput = ''; 

    } catch (err: any) {
      local.updateError = err.message;
    } finally {
      local.isUpdatingAwb = false;
      local.render();
    }
  };


  useEffect(() => {
    if (!shipmentId) {
      local.isLoading = false;
      local.error = "ID Pengiriman tidak ditemukan di URL.";
      local.render();
      return;
    }

    const fetchShipmentDetail = async () => {
      local.isLoading = true;
      local.render();
      try {
        const response = await api.shipment_detail({ query: { id: shipmentId } });
        if (response.success && response.data) {
          local.shipment = response.data as ShipmentApiResponse;
          local.error = null;
        } else {
          local.shipment = null;
          local.error = response.message || "Gagal mengambil detail pengiriman.";
        }
      } catch (err: any) {
        local.shipment = null;
        local.error = err.message || "Terjadi kesalahan tak terduga.";
      } finally {
        local.isLoading = false;
        local.render();
      }
    };

    fetchShipmentDetail();
  }, [shipmentId]);

  if (local.isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton className="h-10 w-1/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96 mt-8" />
      </div>
    );
  }

  if (local.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p>{local.error}</p>
        <Button onClick={() => navigate("/shipments")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
        </Button>
      </div>
    );
  }

  if (!local.shipment) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p>Detail pengiriman tidak ditemukan.</p>
        <Button onClick={() => navigate("/shipments")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
        </Button>
      </div>
    );
  }
  
  const { shipment } = local;

  const labelData: ShipmentLabelData = {
    id: shipment.id,
    awb: shipment.awb || 'N/A',
    shipping_provider: shipment.courier.provider,
    shipping_service: shipment.courier.service,
    shipping_cost: parseFloat(shipment.shipping_cost) || 0,
    recipient_name: shipment.shippingAddress.recipient,
    recipient_phone: shipment.shippingAddress.phone,
    address_line: shipment.shippingAddress.address,
    city: shipment.shippingAddress.city,
    province: shipment.shippingAddress.province,
    postal_code: shipment.shippingAddress.postalCode,
    notes: shipment.notes || undefined,
    author: {
        id: shipment.author.id,
        name: shipment.author.name,
        author_address: shipment.author.address ? {
            address: shipment.author.address.address,
            city: shipment.author.address.city,
            province: shipment.author.address.province,
            postal_code: shipment.author.address.postalCode,
            phone: shipment.author.phone
        } : undefined
    },
    t_sales: {
        id: shipment.id,
        t_sales_line: shipment.items.map((item: ApiItem) => ({
            id: item.sku || item.name,
            qty: item.quantity,
            product: {
                id: item.sku || item.name,
                name: item.name,
                sku: item.sku,
                weight: item.weight
            }
        }))
    }
  };

  return (
    <>
      <PublishPageHeader>
        <div className="p-4 w-full grid gap-8">
          <div className="flex flex-row items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/shipments')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Detail Pengiriman</h1>
              <p className="text-gray-500">ID Pesanan: {shipment.id.substring(0,8)}...</p>
            </div>
          </div>

          {local.updateError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gagal Memperbarui</AlertTitle>
              <AlertDescription>{local.updateError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Status Pengiriman</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getStatusBadge(shipment.status)}</div>
                <p className="text-xs text-muted-foreground mt-2">Nomor Resi: {shipment.awb || 'Belum tersedia'}</p>
                <p className="text-xs text-muted-foreground">Kurir: {shipment.courier.provider} ({shipment.courier.service})</p>
                
                <Sheet open={local.isLabelSheetOpen} onOpenChange={(isOpen) => { local.isLabelSheetOpen = isOpen; local.render(); }}>
                  <SheetTrigger asChild>
                    <Button className="mt-4 w-full" disabled={shipment.status === 'unpaid'}>
                      <File className="mr-2 h-4 w-4" /> Cetak Label
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Label Pengiriman</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                      <div ref={labelPrintRef}>
                        <ShippingLabel
                          shipment={labelData}
                          courierClassName="font-bold text-lg"
                        />
                      </div>
                      <Button onClick={handlePrint} className="w-full mt-6">
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Sekarang
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

{/* ================= NEW: AWB INPUT SECTION ================= */}
{['waiting', 'shipping'].includes(shipment.status) && (
  <div className="mt-4 pt-4 border-t">
    <label className="text-sm font-medium">Input Nomor Resi untuk Pengiriman</label>
    <div className="flex w-full items-center space-x-2 mt-2">
      <Input
        type="text"
        placeholder="Masukkan Nomor Resi"
        value={local.awbInput}
        onChange={(e) => { local.awbInput = e.target.value; local.render(); }}
        disabled={local.isUpdatingAwb}
      />
      <Button 
        type="submit" 
        onClick={handleAwbUpdate} 
        disabled={local.isUpdatingAwb || !local.awbInput.trim()}
      >
        {local.isUpdatingAwb ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Update
      </Button>
    </div>
  </div>
)}
{/* ========================================================= */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pelanggan</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{shipment.customer.name}</div>
                <p className="text-xs text-muted-foreground">{shipment.customer.email}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Alamat Pengiriman</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-semibold">{shipment.shippingAddress.recipient}</p>
                <p>{shipment.shippingAddress.phone}</p>
                <p>{shipment.shippingAddress.address}</p>
                <p>{`${shipment.shippingAddress.city}, ${shipment.shippingAddress.province} ${shipment.shippingAddress.postalCode}`}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Produk dalam Pengiriman</CardTitle>
              <CardDescription>Berikut adalah daftar produk yang termasuk dalam pengiriman ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Jumlah</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipment.items.map((item: ApiItem, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(item.price))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(item.total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </PublishPageHeader>
    </>
  );
};