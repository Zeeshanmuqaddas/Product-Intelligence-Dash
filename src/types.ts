export interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  seller: {
    name: string;
    trustScore: number;
  };
  specs: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
  };
  reviewAuthenticityScore: number;
  predictedPriceDrop: boolean;
  predictedPriceDropAmount?: number;
  image: string;
}

export interface AgentStatus {
  name: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  lastLog: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  message: string;
  timestamp: string;
}
