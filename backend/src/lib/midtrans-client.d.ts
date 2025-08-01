declare module "midtrans-client" {
  interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface SnapTransactionRequest {
    [key: string]: any;
  }

  interface SnapResponse {
    token: string;
    redirect_url: string;
  }

  interface TransactionStatusResponse {
    [key: string]: any;
  }

  class Snap {
    constructor(config: MidtransConfig);
    createTransaction(request: SnapTransactionRequest): Promise<SnapResponse>;
  }

  class CoreApi {
    constructor(config: MidtransConfig);
    transaction: {
      status(orderId: string): Promise<TransactionStatusResponse>;
      approve(orderId: string): Promise<TransactionStatusResponse>;
      deny(orderId: string): Promise<TransactionStatusResponse>;
      cancel(orderId: string): Promise<TransactionStatusResponse>;
      expire(orderId: string): Promise<TransactionStatusResponse>;
      refund(
        orderId: string,
        request?: any
      ): Promise<TransactionStatusResponse>;
    };
  }

  export { Snap, CoreApi, MidtransConfig, SnapTransactionRequest, SnapResponse, TransactionStatusResponse };
}