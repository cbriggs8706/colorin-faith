alter table public.products
  add column if not exists variants jsonb not null default '[]'::jsonb;

update public.products
set variants = jsonb_build_array(
  jsonb_build_object(
    'id', case
      when page_count > 0 then concat(page_count::text, '-pages')
      else 'standard'
    end,
    'name', case
      when page_count > 0 then concat(page_count::text, ' pages')
      else 'Standard'
    end,
    'price', price,
    'stripePriceId', stripe_price_id,
    'pageCount', page_count,
    'downloads', downloads
  )
)
where coalesce(jsonb_array_length(variants), 0) = 0;

alter table public.orders
  add column if not exists variant_id text not null default 'standard',
  add column if not exists variant_name text not null default 'Standard',
  add column if not exists variant_page_count integer not null default 1;

update public.orders
set
  variant_id = 'standard',
  variant_name = 'Standard',
  variant_page_count = 1
where variant_id = '' or variant_id is null;

drop index if exists public.orders_session_product_key;

create unique index if not exists orders_session_product_key
  on public.orders (stripe_session_id, product_slug, variant_id);
