create table if not exists public.custom_products (
  slug text primary key,
  name text not null,
  tagline text not null,
  description text not null,
  category text not null,
  featured_eyebrow text not null,
  featured_title text not null,
  featured_description text not null,
  cta_label text not null,
  gradient text not null,
  active boolean not null default true,
  listing_image_path text not null default '',
  images jsonb not null default '[]'::jsonb,
  page_prices jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text,
  customer_email text,
  customer_name text,
  product_slug text not null,
  product_name text not null,
  page_count integer not null,
  color_count integer not null,
  hex_width integer not null,
  source_file_path text not null default '',
  source_file_name text not null default '',
  source_file_content_type text,
  permission_confirmed boolean not null default true,
  status text not null default 'received',
  deliverables jsonb not null default '[]'::jsonb,
  amount_total integer,
  currency text,
  payment_status text not null default 'unpaid',
  paid_at timestamptz,
  admin_notified_at timestamptz,
  ready_email_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.custom_products enable row level security;
alter table public.custom_orders enable row level security;
