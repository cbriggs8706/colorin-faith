create extension if not exists pgcrypto;

create table if not exists public.products (
  slug text primary key,
  name text not null,
  description text not null,
  price numeric(10,2) not null,
  stripe_price_id text not null default '',
  category text not null,
  page_count integer not null,
  tagline text not null,
  gradient text not null,
  audience text[] not null default '{}',
  features text[] not null default '{}',
  related_products text[] not null default '{}',
  featured boolean not null default false,
  listing_image_path text not null default '',
  images jsonb not null default '[]'::jsonb,
  downloads jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscribers (
  email text primary key,
  first_name text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null
);

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

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text,
  username text,
  password_hash text,
  is_admin boolean not null default false
);

create unique index if not exists users_username_lower_key
  on public.users (lower(username))
  where username is not null;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references public.users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text
);

create unique index if not exists accounts_provider_provider_account_id_key
  on public.accounts(provider, "providerAccountId");

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  "sessionToken" text not null unique,
  "userId" uuid not null references public.users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists public.verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null
);

create unique index if not exists verification_tokens_identifier_token_key
  on public.verification_tokens(identifier, token);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text,
  stripe_session_id text not null,
  product_slug text not null,
  product_name text not null,
  variant_id text not null default 'standard',
  variant_name text not null default 'Standard',
  variant_page_count integer not null default 1,
  quantity integer not null default 1,
  amount_total integer,
  currency text,
  payment_status text not null default 'unpaid',
  paid_at timestamptz,
  receipt_emailed_at timestamptz,
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

create unique index if not exists orders_session_product_key
  on public.orders (stripe_session_id, product_slug, variant_id);

create index if not exists orders_customer_email_idx
  on public.orders (customer_email, created_at desc);

alter table public.products enable row level security;
alter table public.subscribers enable row level security;
alter table public.site_content enable row level security;
alter table public.custom_products enable row level security;
alter table public.users enable row level security;
alter table public.accounts enable row level security;
alter table public.sessions enable row level security;
alter table public.verification_tokens enable row level security;
alter table public.orders enable row level security;
alter table public.custom_orders enable row level security;
