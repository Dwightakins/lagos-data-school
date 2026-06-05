interface Window {
  PaystackPop: {
    setup(opts: {
      key: string;
      email: string;
      amount: number;
      currency: string;
      ref: string;
      label?: string;
      metadata?: Record<string, unknown>;
      callback(transaction: { reference?: string; trxref?: string }): void;
      onClose(): void;
      onSuccess?(transaction: { reference?: string; trxref?: string }): void;
      onCancel?(): void;
    }): { openIframe(): void };
  };
}
