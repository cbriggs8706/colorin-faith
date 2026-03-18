alter table public.products
  add column if not exists images jsonb not null default '[]'::jsonb,
  add column if not exists downloads jsonb not null default '[]'::jsonb;

alter table public.products
  drop column if exists emoji;
