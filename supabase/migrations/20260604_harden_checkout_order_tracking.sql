alter table public.orders
  add column if not exists customer_user_id uuid references public.users(id) on delete set null;

alter table public.custom_orders
  add column if not exists customer_user_id uuid references public.users(id) on delete set null;

create index if not exists orders_customer_user_id_idx
  on public.orders (customer_user_id, created_at desc);

create index if not exists custom_orders_customer_user_id_idx
  on public.custom_orders (customer_user_id, created_at desc);
