
create type public.app_role as enum ('admin','seller','customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text not null default '',
  phone text,
  address text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile delete" on public.profiles for delete to authenticated using (id = auth.uid());
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  emoji text not null default '🥤',
  sort_order int not null default 0
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public" on public.categories for select to anon, authenticated using (true);

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  shop_name text not null,
  owner_name text not null default '',
  email text,
  phone text,
  shop_phone text,
  address text,
  city text,
  state text,
  pincode text,
  logo_url text,
  avatar_url text,
  license_path text,
  description text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.sellers to anon, authenticated;
grant update, delete on public.sellers to authenticated;
grant all on public.sellers to service_role;
alter table public.sellers enable row level security;
create policy "sellers public" on public.sellers for select to anon, authenticated using (true);
create policy "seller updates own" on public.sellers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "seller deletes own" on public.sellers for delete to authenticated using (user_id = auth.uid());
create trigger sellers_touch before update on public.sellers for each row execute function public.touch_updated_at();

create or replace function public.protect_seller_verified() returns trigger language plpgsql set search_path=public as $$
begin
  if new.is_verified is distinct from old.is_verified and not public.has_role(auth.uid(),'admin') then
    new.is_verified = old.is_verified;
  end if;
  new.user_id = old.user_id;
  return new;
end $$;
create trigger sellers_protect before update on public.sellers for each row execute function public.protect_seller_verified();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  short_description text not null default '',
  ingredients text not null default '',
  volume text not null default '',
  price numeric(10,2) not null check (price >= 0),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_seller_idx on public.products(seller_id);
create index products_category_idx on public.products(category_id);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public" on public.products for select to anon, authenticated using (true);
create policy "seller inserts own products" on public.products for insert to authenticated
  with check (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()));
create policy "seller updates own products" on public.products for update to authenticated
  using (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()));
create policy "seller deletes own products" on public.products for delete to authenticated
  using (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()));
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1 check (quantity between 1 and 50),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "own cart" on public.cart_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'placed',
  total numeric(10,2) not null default 0,
  delivery_address text,
  payment_method text not null default 'cash_on_delivery',
  created_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders" on public.orders for select to authenticated using (user_id = auth.uid());

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  seller_id uuid references public.sellers(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null
);
create index order_items_order_idx on public.order_items(order_id);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "seller sees own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()));

create or replace function public.place_order(_address text) returns uuid
language plpgsql security definer set search_path = public as $$
declare _order uuid; _total numeric := 0;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from cart_items c join products p on p.id=c.product_id where c.user_id=auth.uid() and p.is_available) then
    raise exception 'Your cart is empty';
  end if;
  insert into orders(user_id, delivery_address) values (auth.uid(), _address) returning id into _order;
  insert into order_items(order_id, product_id, seller_id, product_name, unit_price, quantity)
    select _order, p.id, p.seller_id, p.name, p.price, c.quantity
    from cart_items c join products p on p.id=c.product_id
    where c.user_id=auth.uid() and p.is_available;
  select coalesce(sum(unit_price*quantity),0) into _total from order_items where order_id=_order;
  update orders set total=_total where id=_order;
  delete from cart_items where user_id=auth.uid();
  return _order;
end $$;
revoke execute on function public.place_order(text) from public, anon;
grant execute on function public.place_order(text) to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare _role text := coalesce(new.raw_user_meta_data->>'role','customer');
begin
  if _role not in ('customer','seller') then _role := 'customer'; end if;
  insert into profiles(id, username, full_name, phone, address)
  values (new.id, nullif(new.raw_user_meta_data->>'username',''), coalesce(new.raw_user_meta_data->>'full_name',''),
          new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'address');
  insert into user_roles(user_id, role) values (new.id, _role::app_role);
  if _role = 'seller' then
    insert into sellers(user_id, shop_name, owner_name, email, phone, shop_phone, address, city, state, pincode)
    values (new.id, coalesce(nullif(new.raw_user_meta_data->>'shop_name',''),'My Shop'),
      coalesce(new.raw_user_meta_data->>'full_name',''), new.email, new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'shop_phone', new.raw_user_meta_data->>'address', new.raw_user_meta_data->>'city',
      new.raw_user_meta_data->>'state', new.raw_user_meta_data->>'pincode');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create policy "media read" on storage.objects for select using (bucket_id='media');
create policy "media own upload" on storage.objects for insert to authenticated with check (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media own update" on storage.objects for update to authenticated using (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media own delete" on storage.objects for delete to authenticated using (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "licenses own read" on storage.objects for select to authenticated using (bucket_id='licenses' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
create policy "licenses own upload" on storage.objects for insert to authenticated with check (bucket_id='licenses' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "licenses own update" on storage.objects for update to authenticated using (bucket_id='licenses' and (storage.foldername(name))[1] = auth.uid()::text);

insert into public.categories (name, slug, emoji, sort_order) values
('Fresh Juice','fresh-juice','🍊',1),('Fruit Juice','fruit-juice','🍎',2),('Milkshake','milkshake','🥤',3),
('Smoothie','smoothie','🍓',4),('Coffee','coffee','☕',5),('Cold Coffee','cold-coffee','🧋',6),
('Black Coffee','black-coffee','🖤',7),('Tea','tea','🍵',8),('Mocktail','mocktail','🍹',9),
('Lemonade','lemonade','🍋',10),('Cool Drinks','cool-drinks','🧊',11),('Seasonal Drinks','seasonal','🌸',12);

insert into public.sellers (id, shop_name, owner_name, city, state, address, description, is_verified, logo_url) values
('11111111-1111-1111-1111-111111111111','Citrus & Co.','Ananya Rao','Bengaluru','Karnataka','12 MG Road','Cold-pressed juices squeezed every morning.',true,'/images/shop-citrus.jpg'),
('22222222-2222-2222-2222-222222222222','Bean Theory','Rahul Mehta','Mumbai','Maharashtra','4 Linking Road','Small-batch coffee roasted in-house.',true,'/images/shop-bean.jpg'),
('33333333-3333-3333-3333-333333333333','Shake Shack Lane','Priya Nair','Kochi','Kerala','88 Marine Drive','Thick shakes and fruity smoothies.',false,'/images/shop-shake.jpg');

insert into public.products (seller_id, category_id, name, short_description, ingredients, volume, price, is_featured, image_url)
select s, (select id from public.categories where slug=c), n, d, i, v, p, f, img from (values
('11111111-1111-1111-1111-111111111111'::uuid,'fresh-juice','Fresh Mango Juice','Alphonso mango blended with chilled water.','Mango, Water, Ice, Sugar','300 ml',120,true,'/images/mango.jpg'),
('11111111-1111-1111-1111-111111111111'::uuid,'fresh-juice','Watermelon Cooler','Pure watermelon with a pinch of mint.','Watermelon, Mint, Ice','350 ml',99,true,'/images/watermelon.jpg'),
('11111111-1111-1111-1111-111111111111'::uuid,'lemonade','Classic Mint Lemonade','Zesty lemon, fresh mint, sparkling soda.','Lemon, Mint, Soda, Sugar','330 ml',89,true,'/images/lemonade.jpg'),
('11111111-1111-1111-1111-111111111111'::uuid,'mocktail','Blue Lagoon','Blue syrup, lime and soda.','Blue syrup, Lime, Soda, Ice','350 ml',149,false,'/images/mocktail.jpg'),
('22222222-2222-2222-2222-222222222222'::uuid,'cold-coffee','Iced Caramel Latte','Double espresso over milk and caramel.','Espresso, Milk, Caramel, Ice','400 ml',180,true,'/images/cold-coffee.jpg'),
('22222222-2222-2222-2222-222222222222'::uuid,'coffee','Cappuccino','Velvety foam over a rich espresso.','Espresso, Steamed milk','250 ml',140,false,'/images/cappuccino.jpg'),
('22222222-2222-2222-2222-222222222222'::uuid,'black-coffee','Pour-over Black','Single-origin Chikmagalur beans.','Coffee, Water','250 ml',120,false,'/images/black-coffee.jpg'),
('22222222-2222-2222-2222-222222222222'::uuid,'tea','Masala Chai','Spiced tea brewed with ginger and cardamom.','Tea, Milk, Ginger, Cardamom','200 ml',60,false,'/images/chai.jpg'),
('33333333-3333-3333-3333-333333333333'::uuid,'milkshake','Strawberry Milkshake','Fresh strawberries with vanilla ice cream.','Strawberry, Milk, Ice cream','400 ml',160,true,'/images/strawberry-shake.jpg'),
('33333333-3333-3333-3333-333333333333'::uuid,'milkshake','Chocolate Oreo Shake','Thick chocolate shake with crushed cookies.','Milk, Chocolate, Oreo, Ice cream','400 ml',170,true,'/images/oreo-shake.jpg'),
('33333333-3333-3333-3333-333333333333'::uuid,'smoothie','Berry Blast Smoothie','Mixed berries, banana and yogurt.','Blueberry, Strawberry, Banana, Yogurt','350 ml',150,true,'/images/berry-smoothie.jpg'),
('33333333-3333-3333-3333-333333333333'::uuid,'seasonal','Tender Coconut Shake','Seasonal tender coconut, lightly sweet.','Tender coconut, Milk, Sugar','350 ml',130,false,'/images/coconut.jpg')
) as t(s,c,n,d,i,v,p,f,img);
