export type User = {
  id: string;
  username: string;
  name: string;
};

export type ProductSize = {
  id: string;
  product_id: string;
  size: string;
  buy_price: number;
  sell_price: number;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  note: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sizes: ProductSize[];
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  size: string;
  qty: number;
  buy_price: number;
  sell_price: number;
  subtotal: number;
};

export type Sale = {
  id: string;
  code: string;
  user_id: string | null;
  customer: string;
  payment_method: string;
  sold_at: string;
  subtotal: number;
  discount: number;
  total: number;
  cost_total: number;
  profit: number;
  received: number;
  change_due: number;
  note: string;
  items: SaleItem[];
};

export type Summary = {
  omzet: number;
  modal: number;
  laba: number;
  transaksi: number;
  qty: number;
};

export type BarisLaporan = {
  label: string;
  omzet: number;
  laba: number;
  transaksi: number;
};