-- HomeLink Rwanda: market-readiness release.
-- Part 1 closes security gaps. Part 2 adds apartments, viewings, reviews,
-- long-stay fields, saved searches and display currencies.

-- ---------------------------------------------------------------------------
-- PART 1: SECURITY
-- ---------------------------------------------------------------------------

-- RLS policies run as the calling user, so that user must be able to execute
-- has_role. A previous migration revoked this, which breaks permission checks.
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;

-- True when the caller is a trusted context: an admin, a backend service call
-- (no auth.uid), an update made from inside another trigger, or a server function
-- that has set homelink.internal for its own transaction.
create or replace function public.is_trusted_write()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is null
      or pg_trigger_depth() > 1
      or current_setting('homelink.internal', true) = 'on'
      or public.has_role(auth.uid(), 'admin');
$$;
grant execute on function public.is_trusted_write() to anon, authenticated;

-- Vendors may edit their public details but not their own trust or billing state.
create or replace function public.guard_vendor_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.is_trusted_write() then return new; end if;
  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.free_posts_used := 0;
    new.subscription_status := 'free';
    new.subscription_expires_at := null;
  else
    new.is_verified := old.is_verified;
    new.free_posts_used := old.free_posts_used;
    new.subscription_status := old.subscription_status;
    new.subscription_expires_at := old.subscription_expires_at;
  end if;
  return new;
end; $$;
drop trigger if exists vendors_guard on public.vendors;
create trigger vendors_guard before insert or update on public.vendors
  for each row execute procedure public.guard_vendor_fields();

-- Users may not lift their own ban.
create or replace function public.guard_profile_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.is_trusted_write() then return new; end if;
  if tg_op = 'INSERT' then new.is_banned := false;
  else new.is_banned := old.is_banned; end if;
  return new;
end; $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute procedure public.guard_profile_fields();

create or replace function public.assert_not_banned()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null
     and exists (select 1 from public.profiles where id = auth.uid() and is_banned) then
    raise exception 'This account has been suspended' using errcode = '42501';
  end if;
  return new;
end; $$;

-- Listing approval, promotion and view counts are server-controlled, and the
-- plan limit is enforced here rather than only in the browser.
create or replace function public.guard_listing_fields()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v public.vendors%rowtype;
  plan public.sub_status;
  active_count integer;
begin
  if public.is_trusted_write() then return new; end if;

  if tg_op = 'INSERT' then
    new.is_approved := false;
    new.is_featured := false;
    new.views_count := 0;

    select * into v from public.vendors where id = new.vendor_id;
    plan := case
      when v.subscription_expires_at is not null and v.subscription_expires_at < now() then 'free'
      else coalesce(v.subscription_status, 'free')
    end;
    if plan = 'free' and coalesce(v.free_posts_used, 0) >= 3 then
      raise exception 'Free post limit reached' using errcode = 'P0001';
    end if;
    if plan = 'basic' then
      select count(*) into active_count from public.listings
       where vendor_id = new.vendor_id and is_available;
      if active_count >= 10 then
        raise exception 'Basic plan limit reached' using errcode = 'P0001';
      end if;
    end if;
    return new;
  end if;

  new.is_featured := old.is_featured;
  new.views_count := old.views_count;
  new.is_approved := old.is_approved;
  -- Changing what a listing claims sends it back for review.
  if new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.cover_image_url is distinct from old.cover_image_url
     or new.district is distinct from old.district then
    new.is_approved := false;
  end if;
  return new;
end; $$;
drop trigger if exists listings_guard on public.listings;
create trigger listings_guard before insert or update on public.listings
  for each row execute procedure public.guard_listing_fields();

create or replace function public.count_free_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.vendors set free_posts_used = free_posts_used + 1
   where id = new.vendor_id and subscription_status = 'free';
  return new;
end; $$;
drop trigger if exists listings_count_free_post on public.listings;
create trigger listings_count_free_post after insert on public.listings
  for each row execute procedure public.count_free_post();

drop trigger if exists listings_not_banned on public.listings;
create trigger listings_not_banned before insert on public.listings
  for each row execute procedure public.assert_not_banned();
drop trigger if exists messages_not_banned on public.messages;
create trigger messages_not_banned before insert on public.messages
  for each row execute procedure public.assert_not_banned();

-- The only self-service way to become a vendor. Admin can never be self-assigned.
drop policy if exists "vendors_insert_self" on public.vendors;
create or replace function public.become_vendor()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'vendor')
    on conflict (user_id, role) do nothing;
  insert into public.vendors (id) values (auth.uid()) on conflict (id) do nothing;
end; $$;
revoke execute on function public.become_vendor() from public, anon;
grant execute on function public.become_vendor() to authenticated;

-- View counts: visitors cannot update listings directly, so count through here.
create or replace function public.record_listing_view(_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('homelink.internal', 'on', true);
  update public.listings set views_count = views_count + 1
   where id = _listing_id and is_approved and is_available;
  perform set_config('homelink.internal', 'off', true);
end; $$;
grant execute on function public.record_listing_view(uuid) to anon, authenticated;

-- Contact details are for signed-in users only, and a person's phone and home
-- district are visible only to themselves and admins.
create or replace function public.get_my_profile()
returns setof public.profiles language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid();
$$;
revoke execute on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

create or replace function public.admin_list_profiles()
returns setof public.profiles language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return query select * from public.profiles order by created_at desc;
end; $$;
revoke execute on function public.admin_list_profiles() from public, anon;
grant execute on function public.admin_list_profiles() to authenticated;

revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, avatar_url, created_at, is_banned) on public.profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART 2: NEW FEATURES
-- ---------------------------------------------------------------------------

alter table public.vendors
  add column if not exists bio text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists vendor_type text not null default 'individual'
    check (vendor_type in ('individual', 'agency', 'apartment_operator'));

revoke select on public.vendors from anon;
grant select (id, business_name, is_verified, created_at, bio, languages, vendor_type, subscription_status)
  on public.vendors to anon;

-- Apartment buildings and complexes. Each available unit is a listing.
create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text,
  district text not null,
  sector text,
  cell text,
  address_details text,
  cover_image_url text,
  total_units integer check (total_units is null or total_units > 0),
  year_built integer check (year_built is null or year_built between 1900 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists buildings_vendor_idx on public.buildings(vendor_id);
create trigger buildings_touch before update on public.buildings
  for each row execute procedure public.touch_updated_at();
alter table public.buildings enable row level security;
grant select on public.buildings to anon;
grant select, insert, update, delete on public.buildings to authenticated;
grant all on public.buildings to service_role;
create policy "buildings_public_read" on public.buildings for select using (true);
create policy "buildings_vendor_insert" on public.buildings for insert
  with check (auth.uid() = vendor_id and public.has_role(auth.uid(), 'vendor'));
create policy "buildings_vendor_update" on public.buildings for update
  using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);
create policy "buildings_vendor_delete" on public.buildings for delete using (auth.uid() = vendor_id);
create policy "buildings_admin_all" on public.buildings for all using (public.has_role(auth.uid(), 'admin'));

alter table public.listings
  add column if not exists building_id uuid references public.buildings(id) on delete set null,
  add column if not exists unit_label text,
  add column if not exists min_stay_months integer check (min_stay_months is null or min_stay_months > 0),
  add column if not exists available_from date,
  add column if not exists deposit_months numeric check (deposit_months is null or deposit_months >= 0),
  add column if not exists utilities_included boolean not null default false,
  add column if not exists english_lease boolean not null default false,
  add column if not exists video_url text,
  add column if not exists has_hot_water boolean not null default false,
  add column if not exists has_ac boolean not null default false,
  add column if not exists has_laundry boolean not null default false,
  add column if not exists has_gym boolean not null default false,
  add column if not exists has_pool boolean not null default false,
  add column if not exists has_elevator boolean not null default false,
  add column if not exists has_workspace boolean not null default false,
  add column if not exists has_housekeeping boolean not null default false,
  add column if not exists pets_allowed boolean not null default false;
create index if not exists listings_building_idx on public.listings(building_id);
create index if not exists listings_price_idx on public.listings(price);
create index if not exists listings_created_idx on public.listings(created_at desc);

-- A unit can only be attached to the vendor's own building.
create or replace function public.guard_listing_building()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.building_id is not null and not exists (
    select 1 from public.buildings where id = new.building_id and vendor_id = new.vendor_id
  ) then
    raise exception 'That building belongs to another account' using errcode = '42501';
  end if;
  return new;
end; $$;
drop trigger if exists listings_building_guard on public.listings;
create trigger listings_building_guard before insert or update of building_id, vendor_id on public.listings
  for each row execute procedure public.guard_listing_building();

-- Viewing requests, in person or by video call for people still abroad.
create table if not exists public.viewing_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  preferred_at timestamptz not null,
  mode text not null default 'in_person' check (mode in ('in_person', 'video')),
  move_in_date date,
  stay_months integer check (stay_months is null or stay_months > 0),
  message text check (message is null or char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'cancelled')),
  vendor_note text check (vendor_note is null or char_length(vendor_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists viewing_client_idx on public.viewing_requests(client_id, created_at desc);
create index if not exists viewing_vendor_idx on public.viewing_requests(vendor_id, status, preferred_at);
create trigger viewing_touch before update on public.viewing_requests
  for each row execute procedure public.touch_updated_at();

create or replace function public.guard_viewing_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if tg_op = 'INSERT' then
    select vendor_id into owner from public.listings
     where id = new.listing_id and is_approved and is_available;
    if owner is null then
      raise exception 'This listing is not available' using errcode = 'P0001';
    end if;
    if owner = new.client_id then
      raise exception 'You cannot request a viewing of your own listing' using errcode = 'P0001';
    end if;
    new.vendor_id := owner;
    new.status := 'pending';
    new.vendor_note := null;
    return new;
  end if;

  if public.is_trusted_write() then return new; end if;
  new.listing_id := old.listing_id;
  new.client_id := old.client_id;
  new.vendor_id := old.vendor_id;
  if auth.uid() = old.vendor_id then
    new.preferred_at := old.preferred_at;
    new.mode := old.mode;
    new.message := old.message;
    new.move_in_date := old.move_in_date;
    new.stay_months := old.stay_months;
    if new.status not in ('pending', 'confirmed', 'declined') then new.status := old.status; end if;
  else
    new.vendor_note := old.vendor_note;
    if new.status <> 'cancelled' then new.status := old.status; end if;
  end if;
  return new;
end; $$;
create trigger viewing_guard before insert or update on public.viewing_requests
  for each row execute procedure public.guard_viewing_request();
create trigger viewing_not_banned before insert on public.viewing_requests
  for each row execute procedure public.assert_not_banned();

alter table public.viewing_requests enable row level security;
grant select, insert, update on public.viewing_requests to authenticated;
grant all on public.viewing_requests to service_role;
create policy "viewing_read_parties" on public.viewing_requests for select
  using (auth.uid() in (client_id, vendor_id) or public.has_role(auth.uid(), 'admin'));
create policy "viewing_insert_client" on public.viewing_requests for insert
  with check (auth.uid() = client_id);
create policy "viewing_update_parties" on public.viewing_requests for update
  using (auth.uid() in (client_id, vendor_id)) with check (auth.uid() in (client_id, vendor_id));

-- Reviews come only from people whose viewing was confirmed and has taken place.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (vendor_id, reviewer_id)
);
create or replace function public.can_review_vendor(_vendor_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.viewing_requests
     where vendor_id = _vendor_id and client_id = auth.uid()
       and status = 'confirmed' and preferred_at < now()
  );
$$;
grant execute on function public.can_review_vendor(uuid) to authenticated;

alter table public.reviews enable row level security;
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
create policy "reviews_public_read" on public.reviews for select using (true);
create policy "reviews_insert_eligible" on public.reviews for insert
  with check (auth.uid() = reviewer_id and public.can_review_vendor(vendor_id));
create policy "reviews_update_own" on public.reviews for update
  using (auth.uid() = reviewer_id) with check (auth.uid() = reviewer_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = reviewer_id);
create policy "reviews_admin_all" on public.reviews for all using (public.has_role(auth.uid(), 'admin'));

create or replace view public.vendor_ratings with (security_invoker = true) as
  select vendor_id, round(avg(rating), 1) as average_rating, count(*)::integer as review_count
    from public.reviews group by vendor_id;
grant select on public.vendor_ratings to anon, authenticated;

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  filters jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists saved_searches_user_idx on public.saved_searches(user_id);
alter table public.saved_searches enable row level security;
grant select, insert, update, delete on public.saved_searches to authenticated;
grant all on public.saved_searches to service_role;
create policy "saved_searches_own" on public.saved_searches for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Prices are stored in RWF. These rates only convert the display and are set by admins.
create table if not exists public.exchange_rates (
  currency text primary key check (currency ~ '^[A-Z]{3}$'),
  rwf_per_unit numeric not null check (rwf_per_unit > 0),
  updated_at timestamptz not null default now()
);
create trigger exchange_rates_touch before update on public.exchange_rates
  for each row execute procedure public.touch_updated_at();
alter table public.exchange_rates enable row level security;
grant select on public.exchange_rates to anon, authenticated;
grant insert, update, delete on public.exchange_rates to authenticated;
grant all on public.exchange_rates to service_role;
create policy "rates_public_read" on public.exchange_rates for select using (true);
create policy "rates_admin_all" on public.exchange_rates for all using (public.has_role(auth.uid(), 'admin'));
-- Starting values only. Update them in Admin > Exchange rates before launch.
insert into public.exchange_rates (currency, rwf_per_unit) values
  ('USD', 1450), ('EUR', 1680), ('GBP', 1940)
on conflict (currency) do nothing;
