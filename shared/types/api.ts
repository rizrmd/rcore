// import type { User } from "better-auth";
import type { TransactionStatusResponse } from "midtrans-client";
import type {
  affiliate,
  auth_account,
  auth_user,
  author,
  book,
  book_approval,
  book_changes_log,
  bundle,
  category,
  chapter,
  customer,
  customer_address,
  customer_reader,
  customer_track,
  genre,
  internal,
  notif,
  product,
  promo_code,
  publisher,
  publisher_author,
  t_sales,
  t_sales_line,
  transaction,
  withdrawal,
} from "shared/models";
import type { Decimal, JsonValue } from "shared/models/runtime/library";
import type { User } from "shared/types";

export type Author = Partial<author> &
  Partial<{
    auth_user: Partial<auth_user> | null;
    publisher_author: Partial<publisher_author> &
      Partial<{
        publisher: Partial<publisher> &
          Partial<{
            transaction: transaction[];
            promo_code: promo_code[];
          }>;
      }>[];
    book: Partial<book>[];
    product: Partial<product>[];
    bundle: Partial<bundle>[];
  }>;

export type BookChangesLog = Partial<Omit<book_changes_log, "changes">> &
  Partial<{
    changes:
      | JsonValue
      | null
      | Partial<{
          newFields: Record<string, any>;
          oldFields: Record<string, any>;
        }>;
    hash_value: string;
  }>;

export type Product = Partial<product> &
  Partial<{
    author: Partial<author> | null;
    bundle_product: { bundle: Partial<bundle> }[];
    product_category: { category: Partial<category> }[];
  }>;

export type Book = Partial<book> &
  Partial<{
    author: Partial<author> | null;
    book_approval: Partial<book_approval>[];
    book_changes_log: BookChangesLog[];
    product: Product | null;
    chapter: Partial<chapter>[];
  }>;

export type BookApproval = Partial<book_approval> &
  Partial<{
    book: Partial<book> & Partial<{ author: Partial<author> | null }>;
    internal: Partial<internal> | null;
  }>;

export type Onboarding = Partial<{
  author: Partial<author>;
  publisher: Partial<publisher>;
}>;

export type PublisherAuthor = Partial<publisher_author> &
  Partial<{
    author: Partial<author> &
      Partial<{
        auth_user: Partial<auth_user> | null;
        book: Partial<book>[];
        product: Partial<product>[];
      }>;
    publisher: Partial<author> &
      Partial<{
        auth_user: Partial<auth_user> | null;
      }>;
  }>;

export type Transactions = Partial<{
  transaction: Partial<transaction>[];
  balance: number | Decimal;
  withdrawal: Partial<withdrawal>[];
}>;

export type AuthUser = Partial<auth_user> &
  Partial<{
    auth_account: Partial<auth_account>[];
    affiliate: Partial<affiliate> | null;
    author: Partial<author> | null;
    customer:
      | (Partial<customer> &
          Partial<{
            customer_address: Partial<customer_address>[];
          }>)
      | null;
    internal: Partial<internal> | null;
    publisher: Partial<publisher> | null;
  }>;

export type Withdrawal = Partial<withdrawal> &
  Partial<{
    author: Partial<author> | null;
    publisher: Partial<publisher> | null;
  }>;

export type WithdrawalAction = Partial<{
  withdrawal: Partial<withdrawal>;
  transaction: Partial<transaction>;
}>;

export type Account = Partial<auth_account> &
  Partial<{
    auth_user: Partial<auth_user> | null;
  }>;

export type Customer = Partial<customer> &
  Partial<{
    auth_user: Partial<auth_user> | null;
    t_sales: Partial<t_sales>[];
    customer_track: Partial<customer_track>[];
    customer_reader: Partial<customer_reader>[];
    _count: Partial<{
      t_sales: number;
      t_sales_download: number;
      customer_track: number;
      customer_reader: number;
      customer_address: number;
    }>;
    orders: Partial<{
      id: string;
      total: number;
      createdAt: Date;
      status: string;
    }>[];
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: Date | null;
  }>;

export type TSalesLine = Partial<t_sales_line> &
  Partial<{
    t_sales: Partial<t_sales>;
    product: Partial<product> | null;
    bundle: Partial<bundle> | null;
  }>;

export type Chapter = Partial<chapter> &
  Partial<{
    book: Partial<book> | null;
    product: Partial<product> | null;
  }>;

export type Notif = Partial<notif> & Partial<{ auth_user: Partial<auth_user> }>;

export type BundleGetResponse = Partial<bundle> &
  Partial<{
    author: Partial<author> | null;
    bundle_category: Partial<{
      id: string;
      category: Partial<category> | null;
    }>[];
    bundle_product: Partial<{
      id: string;
      qty: number | null;
      product:
        | (Partial<product> &
            Partial<{
              author: Partial<author> | null;
              product_category: Partial<{
                id: string;
                category: Partial<category> | null;
              }>[];
            }>)
        | null;
    }>[];
    t_sales_line: Partial<{
      id: string;
      t_sales: Partial<{
        id: string;
        created_at: Date;
        customer: Partial<customer> | null;
      }>;
    }>[];
    _count: Partial<{
      bundle_product: number;
      bundle_category: number;
      t_sales_line: number;
    }>;
  }>;

export type BundleUpdateResponse = Partial<{
  id: string;
  name: string;
  slug: string;
  desc: string;
  real_price: Decimal;
  strike_price: Decimal | null;
  currency: string;
  status: string;
  cover: string;
  img_file: string;
  info: JsonValue;
  sku: string;
  cfg: JsonValue | null;
  bundle_category: Partial<{
    id: string;
    category: Partial<category> | null;
  }>[];
  bundle_product: Partial<{
    id: string;
    qty: number | null;
    product: Partial<product> | null;
  }>[];
}>;

export type BundleCreateResponse = BundleUpdateResponse;

export type Affiliate = Partial<affiliate> &
  Partial<{ auth_user: Partial<auth_user> | null }>;

export type AffiliateStats = Partial<{
  total_affiliates: number;
  affiliates_with_users: number;
  affiliate: Affiliate | null;
}>;

export type Internal = Partial<internal> &
  Partial<{
    auth_user: Partial<auth_user> | null;
    book_approval: Partial<book_approval>[];
    _count: Partial<{
      auth_user: number;
      book_approval: number;
    }>;
  }>;

// List types for API responses - flexible to handle optional includes
export type Publisher = Partial<publisher> &
  Partial<{
    auth_user: Partial<auth_user> | null;
    publisher_author: (Partial<publisher_author> &
      Partial<{
        author: Partial<author> &
          Partial<{
            book: Partial<book>[];
            product: Partial<product>[];
            _count: Partial<{
              book: number;
              product: number;
            }>;
          }>;
      }>)[];
    transaction: Partial<transaction>[];
    promo_code: Partial<promo_code>[];
    withdrawal: Partial<withdrawal>[];
    _count: Partial<{
      transaction: number;
      promo_code: number;
      withdrawal: number;
    }>;
  }>;

export type DashboardStatsTopAuthors = Partial<{
  id: string;
  name: string;
  book_count: number;
  total_sales: number;
  total_revenue: number;
}>[];

export type DashboardStatsTopBooks = Partial<{
  id: string;
  name: string;
  author_name: string;
  total_sales: number;
  total_revenue: number;
  total_quantity: number;
}>[];

export type DashboardStatsSalesByMonth = Partial<{
  month: Date;
  sales_count: number;
  total_revenue: number;
}>[];

export type DashboardStats = Partial<{
  overview: Partial<{
    total_authors: number;
    total_books: number;
    total_customers: number;
    total_products: number;
    total_sales_count: number;
    total_sales_revenue: number;
    total_quantity_sold: number;
    period_days: number;
  }>;
  recent_sales: Partial<{
    id: string;
    qty: number;
    total_price: number | Decimal;
    t_sales: Partial<{
      id: string;
      created_at: Date;
      status: string;
      customer: {
        auth_user: {
          name: string;
          email: string;
        } | null;
      };
    }>;
    product: Partial<{
      name: string;
      author: Partial<author> | null;
      book: Partial<{
        id: string;
        name: string;
        author: Partial<author> | null;
      }>[];
    }> | null;
  }>[];
  top_authors: DashboardStatsTopAuthors;
  top_books: DashboardStatsTopBooks;
  sales_by_month: DashboardStatsSalesByMonth;
}>;

export type InternalSpecificStats = Partial<{
  id: string;
  name: string;
  roles: Partial<{
    sales_and_marketing: boolean;
    support: boolean;
    management: boolean;
    it: boolean;
  }>;
  book_approval_count: number;
}>;

export type InternalOverallStats = Partial<{
  total_internals: number;
  roles: Partial<{
    sales_and_marketing: number;
    support: number;
    management: number;
    it: number;
  }>;
  internals_with_book_approvals: number;
  total_book_approvals: number;
}>;

export type InternalStatsData = InternalSpecificStats | InternalOverallStats;

export type ConfigItem = {
  key: string;
  value: string;
};

export type BundleStatsResponse = Partial<{
  bundle: Partial<bundle>;
  product_count: number;
  category_count: number;
  sales_stats: Partial<{
    total_sales: number;
    total_revenue: number;
    unique_customers: number;
    average_order_value: number;
  }>;
}>;

export type BundleOverallStatsResponse = Partial<{
  bundle_counts: Partial<{
    total: number;
    draft: number;
    published: number;
    deleted: number;
    with_products: number;
    with_categories: number;
    empty: number;
  }>;
  sales_stats: Partial<{
    total_sales: number;
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
  }>;
}>;

export type BookStatsResponse = Partial<{
  book: (Partial<book> & Partial<{ author: Partial<author> | null }>) | null;
  genre_count: number;
  tag_count: number;
  chapter_count: number;
  review_count: number;
  average_rating: number;
  approval_status: string;
  sales_stats: Partial<{
    total_sales: number;
    total_revenue: number;
    unique_customers: number;
    average_order_value: number;
  }>;
}>;

export type BookOverallStatsResponse = Partial<{
  book_counts: Partial<{
    total: number;
    draft: number;
    submitted: number;
    published: number;
    rejected: number;
    with_chapters: number;
    with_genres: number;
    with_tags: number;
    with_reviews: number;
    physical_books: number;
    digital_books: number;
  }>;
  sales_stats: Partial<{
    total_sales: number;
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
  }>;
  content_stats: Partial<{
    total_chapters: number;
    total_reviews: number;
    average_rating: number;
  }>;
  top_genres: Partial<{
    genre: Partial<genre> | null;
    book_count: number;
  }>[];
  top_authors: Partial<{
    author: Partial<author> | null;
    book_count: number;
  }>[];
}>;

export type BundleManagementResponse = Partial<bundle> &
  Partial<{
    id: string;
    name: string;
    bundle_category: Partial<{
      id: string;
      category?: Partial<category> | null;
    }>[];
    bundle_product: Partial<{
      id: string;
      product: Partial<product> | null;
      qty?: number | null;
    }>[];
  }>;

export type ManageTransactionRequest = Partial<{
  user: User;
  order_id: string;
  action: "approve" | "deny" | "cancel" | "expire" | "refund" | "status";
  refund_amount: number;
  refund_reason: string;
}>;

// Customer Stats types
export type CustomerSpecificStats = Partial<{
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  sales_count: number;
  sales_total: number | Decimal;
  download_count: number;
  track_count: number;
  reader_count: number;
  address_count: number;
}>;

export type CustomerOverallStats = Partial<{
  total_customers: number;
  active_customers: number;
  customers_with_sales: number;
  customers_with_downloads: number;
  customers_with_tracks: number;
  customers_with_reader: number;
  customers_with_address: number;
  total_sales_amount: number | Decimal;
}>;

export type CustomerStatsResponse =
  | CustomerSpecificStats
  | CustomerOverallStats;

export type AuthorSpecificStats = Partial<{
  id: string;
  name: string;
  book_count: number;
  product_count: number;
  publisher_count: number;
}>;

export type AuthorOverallStats = Partial<{
  total_authors: number;
  authors_with_books: number;
  authors_with_products: number;
  authors_with_publishers: number;
  authors_without_content: number;
}>;

export type AuthorStatsResponse = AuthorSpecificStats | AuthorOverallStats;

export type PublisherSpecificStats = Partial<{
  id: string;
  name: string;
  website: string | null;
  author_count: number;
  promo_code_count: number;
  transaction_count: number;
  transaction_total: number | Decimal;
  withdrawal_count: number;
  withdrawal_total: number | Decimal;
  book_count: number;
  product_count: number;
}>;

export type PublisherOverallStats = Partial<{
  total_publishers: number;
  publishers_with_authors: number;
  publishers_with_promo_codes: number;
  publishers_with_transactions: number;
  publishers_with_withdrawals: number;
  total_transaction_amount: number | Decimal;
  total_withdrawal_amount: number | Decimal;
}>;

export type PublisherStatsResponse =
  | PublisherSpecificStats
  | PublisherOverallStats;

export type OrderStatusResponse = Partial<{
  order_id: string;
  status: string;
  total_amount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    type: "product" | "bundle";
  }>;
  payment_info?: {
    payment_type?: string;
    va_numbers?: Array<{
      bank: string;
      va_number: string;
    }>;
    payment_code?: string;
    store?: string;
    pdf_url?: string;
  };
  midtrans_status?: TransactionStatusResponse;
}>;

// Interface for the author data to be included
export type AuthorInfo = Partial<{
  id: string;
  name: string;
  author_address: { id_subdistrict: string | null }[];
}>;

// Cart item type
export type CartItem = Partial<{
  id: string;
  name: string;
  slug: string;
  cover: string | null;
  currency: string;
  real_price: number;
  strike_price: number;
  type: "bundle" | "product";
  bundleProducts: string[];
  weight?: number;
  is_physical?: boolean;
  author?: AuthorInfo | null;
  bundleDetails?: Partial<{
    id: string;
    name: string;
  }>[];
  quantity: number;
}>;
