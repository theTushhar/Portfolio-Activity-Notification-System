export interface PortfolioTransactionCreatedEvent {
  eventType: 'PortfolioTransactionCreated';
  eventId: string;
  timestamp: Date;
  data: {
    transactionId: string;
    userId: string;
    assetSymbol: string;
    type: string;
    quantity: number;
    price: number;
    totalValue: number;
  };
}
