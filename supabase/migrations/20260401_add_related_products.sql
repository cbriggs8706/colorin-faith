alter table public.products
  add column if not exists related_products text[] not null default '{}';
