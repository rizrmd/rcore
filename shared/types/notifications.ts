export enum NotifType {
  BOOK_CREATE = "book-create",
  BOOK_UPDATE = "book-update",
  BOOK_SUBMIT = "book-submit",
  BOOK_REVISE = "book-revise",
  BOOK_PUBLISH = "book-publish",
  BOOK_REJECT = "book-reject",
  BOOK_APPROVE = "book-approve",
}

export enum NotifStatus {
  UNREAD = "unread",
  READ = "read",
}

export type NotifItem = {
  timestamp?: number;
  type: NotifType;
  message: string;
  status: NotifStatus;
  url?: string;
  data?: Record<string, string | number | boolean | Date | object>;
  thumbnail?: string;
};

export enum WSMessageAction {
  CONNECTED = "connected",
  NEW_NOTIF = "new-notif",
}

export type WSMessage =
  | { action: WSMessageAction.CONNECTED; notifList: NotifItem[] }
  | { action: WSMessageAction.NEW_NOTIF; notif: NotifItem };