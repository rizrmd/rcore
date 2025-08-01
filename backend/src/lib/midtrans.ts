import { createHash } from "crypto";
import { CoreApi, Snap } from "midtrans-client";

// Types for Midtrans SNAP integration
export interface MidtransConfig {
  isProduction: boolean;
  serverKey: string;
  clientKey: string;
}

export interface TransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface CustomerDetails {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  billing_address?: Address;
  shipping_address?: Address;
}

export interface Address {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country_code?: string;
}

export interface ItemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
  merchant_name?: string;
}

export interface CreditCard {
  secure?: boolean;
  bank?: string;
  installment?: {
    required: boolean;
    terms?: {
      [bank: string]: number[];
    };
  };
  whitelist_bins?: string[];
}

export interface CustomExpiry {
  start_time?: string;
  unit: "second" | "minute" | "hour" | "day";
  duration: number;
}

export interface CallbackUrls {
  finish?: string;
  unfinish?: string;
  error?: string;
}

export interface SnapTransactionRequest {
  transaction_details: TransactionDetails;
  item_details?: ItemDetails[];
  customer_details?: CustomerDetails;
  enabled_payments?: string[];
  credit_card?: CreditCard;
  bca_va?: {
    va_number?: string;
  };
  bni_va?: {
    va_number?: string;
  };
  bri_va?: {
    va_number?: string;
  };
  permata_va?: {
    va_number?: string;
    recipient_name?: string;
  };
  callbacks?: CallbackUrls;
  expiry?: CustomExpiry;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
}

export interface SnapTokenResponse {
  token: string;
  redirect_url: string;
}

export interface TransactionStatusResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  currency: string;
  payment_type: string;
  transaction_time: string;
  transaction_status:
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "cancel"
    | "expire"
    | "failure";
  fraud_status: "accept" | "deny" | "challenge";
  approval_code?: string;
  signature_key: string;
  bank?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  biller_code?: string;
  bill_key?: string;
  payment_code?: string;
  store?: string;
  permata_va_number?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
}

// Notification webhook payload
export interface NotificationPayload {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: string;
  currency: string;
  approval_code?: string;
  masked_card?: string;
  bank?: string;
  eci?: string;
  card_type?: string;
  payment_option_type?: string;
  shopeepay_reference_number?: string;
  reference_id?: string;
}

export class MidtransService {
  private snap: Snap;
  private coreApi: CoreApi;
  private config: MidtransConfig;

  constructor(config: MidtransConfig) {
    this.config = config;

    // Initialize SNAP client
    this.snap = new Snap({
      isProduction: config.isProduction,
      serverKey: config.serverKey,
      clientKey: config.clientKey,
    });

    // Initialize Core API client
    this.coreApi = new CoreApi({
      isProduction: config.isProduction,
      serverKey: config.serverKey,
      clientKey: config.clientKey,
    });
  }

  /**
   * Create SNAP transaction token
   * This is the main function to create a payment token for SNAP
   */
  async createTransaction(
    request: SnapTransactionRequest
  ): Promise<SnapTokenResponse> {
    try {
      const response = await this.snap.createTransaction(request);
      return {
        token: response.token,
        redirect_url: response.redirect_url,
      };
    } catch (error) {
      throw new Error(`Failed to create Midtrans transaction: ${error}`);
    }
  }

  /**
   * Get transaction status by order_id
   */
  async getTransactionStatus(
    orderId: string
  ): Promise<TransactionStatusResponse> {
    try {
      const response = await this.coreApi.transaction.status(orderId);
      return response as TransactionStatusResponse;
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error}`);
    }
  }

  /**
   * Approve a challenge transaction
   */
  async approveTransaction(
    orderId: string
  ): Promise<TransactionStatusResponse> {
    try {
      const response = await this.coreApi.transaction.approve(orderId);
      return response as TransactionStatusResponse;
    } catch (error) {
      throw new Error(`Failed to approve transaction: ${error}`);
    }
  }

  /**
   * Deny a challenge transaction
   */
  async denyTransaction(orderId: string): Promise<TransactionStatusResponse> {
    try {
      const response = await this.coreApi.transaction.deny(orderId);
      return response as TransactionStatusResponse;
    } catch (error) {
      throw new Error(`Failed to deny transaction: ${error}`);
    }
  }

  /**
   * Cancel a transaction (only for certain payment methods and statuses)
   */
  async cancelTransaction(orderId: string): Promise<TransactionStatusResponse> {
    try {
      const response = await this.coreApi.transaction.cancel(orderId);
      return response as TransactionStatusResponse;
    } catch (error) {
      throw new Error(`Failed to cancel transaction: ${error}`);
    }
  }

  /**
   * Expire a transaction
   */
  async expireTransaction(orderId: string): Promise<TransactionStatusResponse> {
    try {
      const response = await this.coreApi.transaction.expire(orderId);
      return response as TransactionStatusResponse;
    } catch (error) {
      throw new Error(`Failed to expire transaction: ${error}`);
    }
  }

  /**
   * Refund a transaction (only for credit card)
   */
  async refundTransaction(
    orderId: string,
    amount?: number,
    reason?: string
  ): Promise<TransactionStatusResponse> {
    try {
      const refundRequest: any = {};
      if (amount) refundRequest.amount = amount;
      if (reason) refundRequest.reason = reason;

      const response = await this.coreApi.transaction.refund(
        orderId,
        refundRequest
      );
      return response as TransactionStatusResponse;
    } catch (error) {
      throw new Error(`Failed to refund transaction: ${error}`);
    }
  }

  /**
   * Verify notification signature
   * Use this to verify incoming webhook notifications from Midtrans
   */
  verifyNotificationSignature(notification: NotificationPayload): boolean {
    try {
      // Validate required fields
      if (
        !notification?.order_id ||
        !notification?.status_code ||
        !notification?.gross_amount ||
        !notification?.signature_key
      ) {
        console.error(
          "Missing required notification fields for signature verification"
        );
        return false;
      }

      if (!this.config?.serverKey) {
        console.error("Server key not configured for signature verification");
        return false;
      }

      const {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signatureKey,
      } = notification;
      const serverKey = this.config.serverKey;

      // Create signature input string according to Midtrans documentation
      const input = orderId + statusCode + grossAmount + serverKey;

      // Generate SHA512 hash
      const hash = createHash("sha512").update(input).digest("hex");

      // Compare with provided signature
      return hash === signatureKey;
    } catch (error) {
      console.error("Failed to verify notification signature:", error);
      return false;
    }
  }

  /**
   * Get Snap frontend configuration
   * Returns configuration needed for frontend integration
   */
  getSnapConfig() {
    return {
      clientKey: this.config.clientKey,
      snapJs: this.config.isProduction
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js",
    };
  }

  /**
   * Helper function to format Indonesian phone number
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "");

    // If starts with 0, replace with +62
    if (cleaned.startsWith("0")) {
      cleaned = "+62" + cleaned.substring(1);
    }
    // If doesn't start with +62, add it
    else if (!cleaned.startsWith("62")) {
      cleaned = "+62" + cleaned;
    }
    // If starts with 62, add +
    else if (cleaned.startsWith("62")) {
      cleaned = "+" + cleaned;
    }

    return cleaned;
  }

  /**
   * Helper function to generate unique order ID
   */
  static generateOrderId(prefix: string = "ORDER"): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Helper function to validate required transaction data
   */
  static validateTransactionRequest(request: SnapTransactionRequest): string[] {
    const errors: string[] = [];

    if (!request.transaction_details) {
      errors.push("transaction_details is required");
    } else {
      if (!request.transaction_details.order_id) {
        errors.push("order_id is required");
      }
      if (
        !request.transaction_details.gross_amount ||
        request.transaction_details.gross_amount <= 0
      ) {
        errors.push("gross_amount must be greater than 0");
      }
    }

    // Validate item_details if provided
    if (request.item_details && request.item_details.length > 0) {
      const totalItemAmount = request.item_details.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      if (totalItemAmount !== request.transaction_details.gross_amount) {
        errors.push(
          "gross_amount must equal sum of (item.price * item.quantity)"
        );
      }
    }

    return errors;
  }

  /**
   * Get available payment methods for Indonesia
   */
  static getAvailablePaymentMethods(): string[] {
    return [
      "credit_card",
      "bca_va",
      "bni_va",
      "bri_va",
      "echannel", // Mandiri Bill
      "permata_va",
      "other_va",
      "gopay",
      "shopeepay",
      "qris",
      "cstore", // Indomaret/Alfamart
      "danamon_online",
      "akulaku",
      "kredivo",
    ];
  }
}

// Factory function to create MidtransService instance
export function createMidtransService(config: MidtransConfig): MidtransService {
  return new MidtransService(config);
}

// Environment-specific configurations
export const MIDTRANS_SANDBOX_CONFIG = {
  isProduction: false,
} as const;

export const MIDTRANS_PRODUCTION_CONFIG = {
  isProduction: true,
} as const;

// Utility function to create quick payment request
export function createQuickPaymentRequest(
  orderId: string,
  amount: number,
  customerDetails?: Partial<CustomerDetails>,
  items?: ItemDetails[]
): SnapTransactionRequest {
  return {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: customerDetails,
    item_details: items,
    credit_card: {
      secure: true,
    },
  };
}

// Export payment status constants
export const PAYMENT_STATUS = {
  CAPTURE: "capture",
  SETTLEMENT: "settlement",
  PENDING: "pending",
  DENY: "deny",
  CANCEL: "cancel",
  EXPIRE: "expire",
  FAILURE: "failure",
} as const;

export const FRAUD_STATUS = {
  ACCEPT: "accept",
  DENY: "deny",
  CHALLENGE: "challenge",
} as const;

// Export for easy import
export default MidtransService;
