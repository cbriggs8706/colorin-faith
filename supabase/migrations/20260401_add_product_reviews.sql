create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text,
  review_type text not null check (review_type in ('standard', 'custom')),
  order_id text not null,
  product_slug text not null,
  product_name text not null,
  variant_id text,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  review text not null,
  photo_paths jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists product_reviews_review_type_order_id_key
  on public.product_reviews (review_type, order_id);

create index if not exists product_reviews_customer_email_idx
  on public.product_reviews (customer_email, updated_at desc);

create index if not exists product_reviews_product_slug_status_idx
  on public.product_reviews (product_slug, status, updated_at desc);

alter table public.product_reviews enable row level security;
