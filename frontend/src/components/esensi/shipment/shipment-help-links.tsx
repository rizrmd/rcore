import { CircleHelp, MessageCircleMore, SquareArrowLeft } from "lucide-react";
import { LinkItem } from "../ui/link-item";

export const ShipmentHelpLinks = ({ className = "" as string }) => {
  const list = [
    {
      label: "Ajukan Pengembalian",
      url: "#",
      newtab: true,
      icon: (
        <>
          <SquareArrowLeft />
        </>
      ),
    },
    {
      label: "Hubungi Tim Esensi",
      url: "#",
      newtab: true,
      icon: (
        <>
          <MessageCircleMore />
        </>
      ),
    },
    {
      label: "Pusat Bantuan",
      url: "#",
      newtab: true,
      icon: (
        <>
          <CircleHelp />
        </>
      ),
    },
  ];

  const renderHelpLinks = list.map((link, idx) => {
    return (
      <LinkItem
        label={link.label}
        url={link.url}
        icon={link.icon}
        key={`esensi_shipment_help_links_${idx}`}
      />
    );
  });

  return (
    <div className={`gap-4 ${className}`}>
      <h3 className="font-bold text-[#3B2C93]">Butuh bantuan?</h3>
      <div className="flex w-full flex-col gap-2 text-sm text-[#3B2C93] ">
        {renderHelpLinks}
      </div>
    </div>
  );
};
export default ShipmentHelpLinks;