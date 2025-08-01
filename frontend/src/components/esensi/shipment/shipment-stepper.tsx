import React from 'react';

// --- (Interfaces remain the same) ---
interface Manifest {
  manifest_code: string;
  manifest_description: string;
  manifest_date: string;
  manifest_time: string;
  city_name: string;
}

interface Summary {
  status: string;
}

interface WaybillData {
  delivered: boolean;
  summary: Summary;
  manifest: Manifest[];
}

interface StepperShipmentProps {
  // The data prop is now optional to handle the "no AWB" case
  data?: WaybillData | null;
}

const StepperShipment: React.FC<StepperShipmentProps> = ({ data }) => {
  // If there's no data or no manifest, it means no AWB was provided or found.
  // Display the packaging status message.
  if (!data || !data.manifest || data.manifest.length === 0) {
    return (
        <div className="text-center py-4">
            <p className="text-gray-600 font-medium">Masih dalam proses pengemasan.</p>
            <p className="text-sm text-gray-400">Informasi pelacakan akan tersedia setelah pesanan dikirim.</p>
        </div>
    );
  }

  const { manifest, summary } = data;

  return (
    <ol className="relative text-gray-500 border-s border-gray-200 ms-4">
      {manifest.map((item, index) => {
        const isLatestAndDelivered = index === 0 && summary.status === 'DELIVERED';

        return (
          <li key={index} className="mb-10 ms-6">
            <span
              className={`absolute flex items-center justify-center w-6 h-6 rounded-full -start-3 ring-4 ring-white ${
                isLatestAndDelivered
                  ? 'bg-[#3B2C93]'
                  : 'bg-gray-100'
              }`}
            >
              {/* Icon can be re-added here if needed */}
            </span>
            <h3 className="font-medium leading-tight text-gray-900">
              {item.manifest_description}
            </h3>
            <p className="text-sm mt-1">
              {item.manifest_date} {item.manifest_time}
            </p>
            {item.city_name && (
              <p className="text-sm text-gray-500">
                {item.city_name}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default StepperShipment;