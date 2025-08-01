export enum Role {
  AFFILIATE = "affiliate",
  AUTHOR = "author",
  CUSTOMER = "customer",
  INTERNAL = "internal",
  PUBLISHER = "publisher",
}

export enum InternalRole {
  IT = "it",
  MANAGEMENT = "management",
  SALES_AND_MARKETING = "sales_and_marketing",
  SUPPORT = "support",
}

export enum BadgeStatus {
  CART = "cart",
  PENDING = "pending",
  PAID = "paid",
  CANCELED = "canceled",
  EXPIRED = "expired",
  FRAUD = "fraud",
  REFUNDED = "refunded",
}

export enum BookStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  PUBLISHED = "published",
  REJECTED = "rejected",
}

export enum ProductStatus {
  PUBLISHED = "published",
  PAUSED = "paused",
  DISCONTINUED = "DISCONTINUED",
}

export enum BundleStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export enum Currency {
  IDR = "IDR",
  USD = "USD",
  EUR = "EUR",
  JPY = "JPY",
  GBP = "GBP",
}

export enum BookTypeKey {
  UTUH = "utuh",
  CHAPTER = "chapter",
}

export enum BookCategoryKey {
  CETAK = "cetak",
  DIGITAL = "digital",
}

export const BookTypes = [
  { label: "Buku Utuh", key: BookTypeKey.UTUH as string },
  { label: "Buku Chapter", key: BookTypeKey.CHAPTER as string },
];

export const BookCategories = [
  { label: "Buku Cetak", key: BookCategoryKey.CETAK as string },
  { label: "Buku Digital", key: BookCategoryKey.DIGITAL as string },
];
