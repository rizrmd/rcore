import { notif } from "@/lib/notif";
import { useSnapshot } from "valtio";

export const Notif = () => {
  const list = useSnapshot(notif.list);
  return <>{list.length}</>;
};
