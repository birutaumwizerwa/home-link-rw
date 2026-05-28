
-- ENUMS
create type public.app_role as enum ('client', 'vendor', 'admin');
create type public.listing_kind as enum ('rent', 'sale');
create type public.property_kind as enum ('house', 'apartment', 'studio', 'room', 'commercial', 'villa');
create type public.price_period_kind as enum ('monthly', 'yearly', 'fixed');
create type public.sub_status as enum ('free', 'basic', 'pro');
create type public.sub_plan as enum ('basic', 'pro');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  phone text,
  location text,
  avatar_url text,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- USER_ROLES (separate for security; admin can never be self-assigned)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- VENDORS
create table public.vendors (
  id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  whatsapp_number text,
  is_verified boolean not null default false,
  free_posts_used integer not null default 0,
  subscription_status sub_status not null default 'free',
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- LISTINGS
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title text not null,
  description text,
  listing_type listing_kind not null,
  property_type property_kind not null,
  price numeric not null check (price >= 0),
  price_period price_period_kind not null default 'monthly',
  bedrooms integer not null default 0,
  bathrooms integer not null default 1,
  size_sqm numeric,
  district text not null,
  sector text,
  cell text,
  address_details text,
  has_kitchen boolean not null default false,
  has_furnished boolean not null default false,
  has_security boolean not null default false,
  has_parking boolean not null default false,
  has_wifi boolean not null default false,
  has_water boolean not null default false,
  has_generator boolean not null default false,
  has_balcony boolean not null default false,
  is_available boolean not null default true,
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  cover_image_url text,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_district_idx on public.listings(district);
create index listings_type_idx on public.listings(listing_type, property_type);
create index listings_approved_idx on public.listings(is_approved, is_available);

-- LISTING IMAGES
create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- SAVED LISTINGS
create table public.saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  listing_id uuid not null references public.listings on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

-- CHATS
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users on delete cascade,
  vendor_id uuid not null references auth.users on delete cascade,
  listing_id uuid references public.listings on delete set null,
  last_message text,
  last_message_at timestamptz,
  client_unread integer not null default 0,
  vendor_unread integer not null default 0,
  created_at timestamptz not null default now(),
  unique (client_id, vendor_id, listing_id)
);

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats on delete cascade,
  sender_id uuid not null references auth.users on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_chat_idx on public.messages(chat_id, created_at);

-- REPORTS
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users on delete set null,
  listing_id uuid not null references public.listings on delete cascade,
  reason text not null,
  details text,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- SUBSCRIPTIONS
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors on delete cascade,
  plan sub_plan not null,
  price_rwf integer not null,
  payment_method text not null default 'momo_manual',
  payment_reference text,
  activated_by uuid references auth.users on delete set null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- has_role security definer
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Auto-create profile + client role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'location'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'client');
  if coalesce(new.raw_user_meta_data->>'is_vendor', 'false') = 'true' then
    insert into public.user_roles (user_id, role) values (new.id, 'vendor');
    insert into public.vendors (id, business_name, whatsapp_number)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  end if;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger for listings
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

-- GRANTS
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select, insert, update, delete on public.vendors to authenticated;
grant select on public.vendors to anon;
grant all on public.vendors to service_role;

grant select, insert, update, delete on public.listings to authenticated;
grant select on public.listings to anon;
grant all on public.listings to service_role;

grant select, insert, update, delete on public.listing_images to authenticated;
grant select on public.listing_images to anon;
grant all on public.listing_images to service_role;

grant select, insert, update, delete on public.saved_listings to authenticated;
grant all on public.saved_listings to service_role;

grant select, insert, update, delete on public.chats to authenticated;
grant all on public.chats to service_role;

grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;

grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;

grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.vendors enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.saved_listings enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.subscriptions enable row level security;

-- profiles: anyone can read basic profile (for vendor display), users update own, admins update any
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles for all using (public.has_role(auth.uid(), 'admin'));

-- user_roles: users read own, admins manage
create policy "roles_read_own" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "roles_admin_manage" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- vendors: public read, vendor updates own, admin manages
create policy "vendors_read_all" on public.vendors for select using (true);
create policy "vendors_update_own" on public.vendors for update using (auth.uid() = id);
create policy "vendors_insert_self" on public.vendors for insert with check (auth.uid() = id);
create policy "vendors_admin_all" on public.vendors for all using (public.has_role(auth.uid(), 'admin'));

-- listings: public can see approved+available; vendors fully manage own; admin all
create policy "listings_public_read" on public.listings for select using (is_approved = true and is_available = true);
create policy "listings_vendor_read_own" on public.listings for select using (auth.uid() = vendor_id);
create policy "listings_vendor_insert" on public.listings for insert with check (auth.uid() = vendor_id and public.has_role(auth.uid(), 'vendor'));
create policy "listings_vendor_update" on public.listings for update using (auth.uid() = vendor_id);
create policy "listings_vendor_delete" on public.listings for delete using (auth.uid() = vendor_id);
create policy "listings_admin_all" on public.listings for all using (public.has_role(auth.uid(), 'admin'));

-- listing_images: public read if parent visible, vendor manages own
create policy "images_public_read" on public.listing_images for select using (true);
create policy "images_vendor_manage" on public.listing_images for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.vendor_id = auth.uid())
) with check (
  exists (select 1 from public.listings l where l.id = listing_id and l.vendor_id = auth.uid())
);
create policy "images_admin_all" on public.listing_images for all using (public.has_role(auth.uid(), 'admin'));

-- saved
create policy "saved_own" on public.saved_listings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- chats
create policy "chats_participants" on public.chats for select using (auth.uid() = client_id or auth.uid() = vendor_id);
create policy "chats_insert_client" on public.chats for insert with check (auth.uid() = client_id);
create policy "chats_update_participants" on public.chats for update using (auth.uid() = client_id or auth.uid() = vendor_id);

-- messages
create policy "messages_read_in_chat" on public.messages for select using (
  exists (select 1 from public.chats c where c.id = chat_id and (c.client_id = auth.uid() or c.vendor_id = auth.uid()))
);
create policy "messages_insert_in_chat" on public.messages for insert with check (
  auth.uid() = sender_id and
  exists (select 1 from public.chats c where c.id = chat_id and (c.client_id = auth.uid() or c.vendor_id = auth.uid()))
);

-- reports
create policy "reports_insert_auth" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "reports_read_own_or_admin" on public.reports for select using (auth.uid() = reporter_id or public.has_role(auth.uid(), 'admin'));
create policy "reports_admin_all" on public.reports for all using (public.has_role(auth.uid(), 'admin'));

-- subscriptions
create policy "subs_read_own" on public.subscriptions for select using (auth.uid() = vendor_id or public.has_role(auth.uid(), 'admin'));
create policy "subs_admin_all" on public.subscriptions for all using (public.has_role(auth.uid(), 'admin'));

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chats;

-- STORAGE BUCKET
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "listing_images_public_read" on storage.objects for select using (bucket_id = 'listing-images');
create policy "listing_images_vendor_upload" on storage.objects for insert with check (
  bucket_id = 'listing-images' and auth.uid() is not null
);
create policy "listing_images_vendor_update" on storage.objects for update using (
  bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "listing_images_vendor_delete" on storage.objects for delete using (
  bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]
);
