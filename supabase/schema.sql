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
  featured boolean not null default false,
  images jsonb not null default '[]'::jsonb,
  downloads jsonb not null default '[]'::jsonb,
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

alter table public.products enable row level security;
alter table public.subscribers enable row level security;
alter table public.site_content enable row level security;
