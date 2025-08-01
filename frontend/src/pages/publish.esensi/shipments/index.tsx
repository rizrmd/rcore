'use client';

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PublishPageHeader } from "@/components/esensi/publish";
import { useLocal } from "@/lib/hooks/use-local";
import { api } from "@/lib/gen/publish.esensi";
import { navigate } from "@/lib/router";

// Helper function to determine badge color based on status
const getStatusBadge = (status: string) => {
  switch (status) {
    case "unpaid":
      return <Badge variant="destructive">Menunggu Pembayaran</Badge>;
    case "pending":
      return <Badge variant="secondary">Menunggu Konfirmasi</Badge>;
    case "waiting":
      return <Badge className="bg-amber-500 text-white hover:bg-amber-600">Siap Dikirim</Badge>;
    case "shipping":
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Dalam Pengiriman</Badge>;
    case "delivered":
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Telah Diterima</Badge>;
    case "canceled":
      return <Badge variant="secondary">Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const shipmentStatuses = [
    { value: "semua", label: "Semua" },
    { value: "unpaid", label: "Menunggu Pembayaran" },
    { value: "pending", label: "Menunggu Konfirmasi" },
    { value: "waiting", label: "Siap Dikirim" },
    { value: "shipping", label: "Dalam Pengiriman" },
    { value: "delivered", label: "Telah Diterima" },
    { value: "canceled", label: "Dibatalkan" },
];

export default () => {
  const local = useLocal({
    shipments: [] as any[],
    pagination: null as any | null,
    isLoading: true,
    activeStatus: "semua",
    currentPage: 1,
    isMobile: false, // State to track screen size
  });

  // Effect to handle screen resizing for responsive UI
  useEffect(() => {
    const checkScreenSize = () => {
      local.isMobile = window.innerWidth < 768;
      local.render();
    };

    checkScreenSize(); // Initial check
    window.addEventListener("resize", checkScreenSize);

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      local.isLoading = true;
      local.render();

      try {
        const response = await api.product_shipment({
          query: {
            page: String(local.currentPage),
            status: local.activeStatus,
          },
        });
        
        if (response.data) {
          local.shipments = response.data.shipments;
          local.pagination = response.data.pagination;
        }
      } catch (error) {
        console.error("Failed to fetch shipments:", error);
        local.shipments = [];
        local.pagination = null;
      } finally {
        local.isLoading = false;
        local.render();
      }
    };

    fetchData();
  }, [local.currentPage, local.activeStatus]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (local.pagination?.total_pages || 1)) {
        local.currentPage = newPage;
        local.render();
    }
  };

  const handleStatusChange = (newStatus: string) => {
    local.activeStatus = newStatus;
    local.currentPage = 1; // Reset to first page when filter changes
    local.render();
  };

  const activeStatusLabel = shipmentStatuses.find(s => s.value === local.activeStatus)?.label || "Filter Status";

  return (
    <>
      <PublishPageHeader>
      <div className="w-full h-full p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengiriman</CardTitle>
            <CardDescription>
              Berikut adalah daftar semua pengiriman yang dikelola oleh Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Responsive Filter UI */}
            <div className="mb-4">
              {local.isMobile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {activeStatusLabel}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {shipmentStatuses.map(status => (
                      <DropdownMenuItem key={status.value} onSelect={() => handleStatusChange(status.value)}>
                        {status.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Tabs value={local.activeStatus} onValueChange={handleStatusChange}>
                  <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full">
                    {shipmentStatuses.map(status => (
                        <TabsTrigger key={status.value} value={status.value}>{status.label}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pesanan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Resi (AWB)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {local.isLoading ? (
                  // Skeleton Loading State
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : local.shipments.length > 0 ? (
                  // Data Rows
                  local.shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono text-xs">{shipment.orderId.substring(0, 8)}...</TableCell>
                      <TableCell>{new Date(shipment.date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{shipment.customer?.name || "N/A"}</TableCell>
                      <TableCell>
                        {shipment.items[0]?.name}
                        {shipment.items.length > 1 && `, +${shipment.items.length - 1} lainnya`}
                      </TableCell>
                      <TableCell>{shipment.awb || "-"}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/shipments/${shipment.id}`)}>
                              Lihat Detail
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Empty State
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Tidak ada pengiriman ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            {local.pagination && local.pagination.total_pages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(local.currentPage - 1); }} />
                        </PaginationItem>
                        {/* Simple page number logic for brevity */}
                        <PaginationItem>
                            <PaginationLink href="#" isActive>
                                {local.currentPage}
                            </PaginationLink>
                        </PaginationItem>
                         <PaginationItem>
                            <span className="px-2">of {local.pagination.total_pages}</span>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(local.currentPage + 1); }} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
          </CardFooter>
        </Card>
      </div>
      </PublishPageHeader>
    </>
  );
};
