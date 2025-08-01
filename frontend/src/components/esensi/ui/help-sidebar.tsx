import {
  ChevronRight,
  HelpCircle,
  MessageCircle,
  ShoppingCart,
} from "lucide-react";

export const HelpSidebar = () => {
  const helpItems = [
    {
      icon: <ShoppingCart className="w-5 h-5 text-[#3B2C93]" />,
      title: "Ajukan Pengembalian",
      href: "/help/refund",
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-[#3B2C93]" />,
      title: "Hubungi Tim Esensi",
      href: "/help/contact",
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-[#3B2C93]" />,
      title: "Pusat Bantuan",
      href: "/help/center",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-[#3B2C93] mb-6">
        Butuh bantuan?
      </h3>

      <div className="space-y-2">
        {helpItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#3B2C93]">
                {item.title}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#3B2C93]" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default HelpSidebar;
