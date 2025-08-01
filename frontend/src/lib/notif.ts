import {
  WSMessageAction,
  type NotifItem,
  type WSMessage,
} from "shared/types";
import { proxy } from "valtio";

export const notif = {
  ws: null as null | WebSocket,
  list: proxy([]) as NotifItem[],
  init(user_id: string) {
    const url = new URL(location.href);
    url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
    url.pathname = "/ws/notif";
    url.hash = "";
    url.search = "";

    this.ws = new WebSocket(url);
    const ws = this.ws! as WebSocket;

    ws.onopen = () => {
      ws.send(JSON.stringify({ uid: user_id } as { uid: string }));
    };

    ws.onmessage = (ev: MessageEvent<any>) => {
      const data = JSON.parse(ev.data) as WSMessage;
      if (data.action === WSMessageAction.CONNECTED) {
        this.list.splice(0, this.list.length, ...data.notifList);
      } else if (data.action === WSMessageAction.NEW_NOTIF) {
        this.list.unshift(data.notif);
      }
    };

    ws.onclose = () => {
      this.ws = null;
    };
  },
};
