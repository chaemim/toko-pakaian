-- =====================================================================
--  Skema database Aplikasi Kasir Pakaian
--  Jalankan file ini lewat: npm run db:setup
--  (atau salin manual ke SQL Editor di Neon Dashboard)
-- =====================================================================

-- Extension untuk generate uuid
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. User & Session
-- ---------------------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  name          text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  token      text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_idx on sessions(user_id);
create index if not exists sessions_expires_idx on sessions(expires_at);

-- ---------------------------------------------------------------------
-- 2. Produk & Ukuran (harga beli / harga jual / stok per ukuran)
-- ---------------------------------------------------------------------
create table if not exists products (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text not null default '',
  note       text not null default '',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_name_idx on products(name);
create index if not exists products_active_idx on products(is_active);

create table if not exists product_sizes (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  size        text not null,
  buy_price   numeric(14,2) not null default 0,
  sell_price  numeric(14,2) not null default 0,
  stock       integer not null default 0,
  updated_at  timestamptz not null default now(),
  unique (product_id, size)
);

create index if not exists product_sizes_product_idx on product_sizes(product_id);

-- ---------------------------------------------------------------------
-- 3. Penjualan
-- ---------------------------------------------------------------------
create table if not exists sales (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  user_id        uuid references users(id) on delete set null,
  customer       text not null default '',
  payment_method text not null default 'Tunai',
  sold_at        timestamptz not null default now(),
  total          numeric(14,2) not null default 0, -- total penjualan (setelah diskon)
  subtotal       numeric(14,2) not null default 0, -- total sebelum diskon
  discount       numeric(14,2) not null default 0,
  cost_total     numeric(14,2) not null default 0, -- total modal (harga beli x qty)
  profit         numeric(14,2) not null default 0, -- untung
  received       numeric(14,2) not null default 0, -- uang diterima (tunai)
  change_due     numeric(14,2) not null default 0, -- kembalian
  note           text not null default '',
  created_at     timestamptz not null default now()
);

create index if not exists sales_sold_at_idx on sales(sold_at desc);
create index if not exists sales_code_idx on sales(code);

create table if not exists sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references sales(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  size_id      uuid references product_sizes(id) on delete set null,
  product_name text not null,
  size         text not null,
  qty          integer not null check (qty > 0),
  buy_price    numeric(14,2) not null default 0,
  sell_price   numeric(14,2) not null,
  subtotal     numeric(14,2) not null
);

create index if not exists sale_items_sale_idx on sale_items(sale_id);
create index if not exists sale_items_product_idx on sale_items(product_id);