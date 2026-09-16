interface Window {
  Alatpay?: {
    setup(opts: {
      apiKey: string;
      businessId: string;
      email: string;
      phone?: string;
      firstName: string;
      lastName: string;
      amount: number;
      currency: "NGN" | "USD";
      metadata?: Record<string, unknown>;
      onTransaction: (response: {
        status?: boolean;
        message?: string;
        data?: {
          id?: string;
          transactionId?: string;
          status?: string;
          amount?: number;
        };
      }) => void;
      onClose?: () => void;
    }): { show(): void };
  };
}
