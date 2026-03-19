create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text
);

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

alter table public.users
  add column if not exists username text,
  add column if not exists password_hash text,
  add column if not exists is_admin boolean not null default false;

create unique index if not exists users_username_lower_key
  on public.users (lower(username))
  where username is not null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text,
  stripe_session_id text not null,
  product_slug text not null,
  product_name text not null,
  quantity integer not null default 1,
  amount_total integer,
  currency text,
  payment_status text not null default 'unpaid',
  paid_at timestamptz,
  receipt_emailed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.orders
  add column if not exists stripe_session_id text,
  add column if not exists quantity integer not null default 1,
  add column if not exists receipt_emailed_at timestamptz;

create unique index if not exists orders_session_product_key
  on public.orders (stripe_session_id, product_slug);

create index if not exists orders_customer_email_idx
  on public.orders (customer_email, created_at desc);

alter table public.users enable row level security;
alter table public.accounts enable row level security;
alter table public.sessions enable row level security;
alter table public.verification_tokens enable row level security;
alter table public.orders enable row level security;
