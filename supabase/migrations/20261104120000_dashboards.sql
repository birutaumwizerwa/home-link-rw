-- Daily view history for dashboards, in-app notifications and unread message counts.
-- Run this after 20261102120000_market_ready.sql.

create table if not exists public.listing_view_days (
  listing_id uuid not null references public.listings(id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0,
  primary key (listing_id, day)
);
create index if not exists listing_view_days_day_idx on public.listing_view_days(day);
alter table public.listing_view_days enable row level security;
grant select on public.listing_view_days to authenticated;
grant all on public.listing_view_days to service_role;
create policy "view_days_owner_read" on public.listing_view_days for select using (
  public.has_role(auth.uid(), 'admin')
  or exists (select 1 from public.listings l where l.id = listing_id and l.vendor_id = auth.uid())
);

create or replace function public.record_listing_view(_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('homelink.internal', 'on', true);
  update public.listings set views_count = views_count + 1
   where id = _listing_id and is_approved and is_available;
  if found then
    insert into public.listing_view_days (listing_id, day, views) values (_listing_id, current_date, 1)
      on conflict (listing_id, day) do update set views = public.listing_view_days.views + 1;
  end if;
  perform set_config('homelink.internal', 'off', true);
end; $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in (
    'viewing_requested', 'viewing_confirmed', 'viewing_declined', 'viewing_cancelled',
    'listing_approved', 'new_message', 'new_review'
  )),
  subject text,
  link text not null default '/',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;
create policy "notifications_own_read" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_own_update" on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.notify_viewing()
returns trigger language plpgsql security definer set search_path = public as $$
declare title text;
begin
  select l.title into title from public.listings l where l.id = new.listing_id;
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, subject, link)
    values (new.vendor_id, 'viewing_requested', title, '/dashboard?tab=viewings');
  elsif new.status is distinct from old.status then
    if new.status in ('confirmed', 'declined') then
      insert into public.notifications (user_id, kind, subject, link)
      values (new.client_id, 'viewing_' || new.status, title, '/viewings');
    elsif new.status = 'cancelled' then
      insert into public.notifications (user_id, kind, subject, link)
      values (new.vendor_id, 'viewing_cancelled', title, '/dashboard?tab=viewings');
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists viewing_notify on public.viewing_requests;
create trigger viewing_notify after insert or update on public.viewing_requests
  for each row execute procedure public.notify_viewing();

create or replace function public.notify_listing_approved()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_approved and not old.is_approved then
    insert into public.notifications (user_id, kind, subject, link)
    values (new.vendor_id, 'listing_approved', new.title, '/listing/' || new.id);
  end if;
  return new;
end; $$;
drop trigger if exists listing_notify_approved on public.listings;
create trigger listing_notify_approved after update of is_approved on public.listings
  for each row execute procedure public.notify_listing_approved();

create or replace function public.notify_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, link) values (new.vendor_id, 'new_review', '/vendor/' || new.vendor_id);
  return new;
end; $$;
drop trigger if exists review_notify on public.reviews;
create trigger review_notify after insert on public.reviews
  for each row execute procedure public.notify_review();

-- Keeps the conversation preview and unread counts correct on the server.
create or replace function public.on_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare c public.chats%rowtype; recipient uuid;
begin
  select * into c from public.chats where id = new.chat_id;
  recipient := case when new.sender_id = c.client_id then c.vendor_id else c.client_id end;
  update public.chats set
    last_message = left(new.content, 200),
    last_message_at = new.created_at,
    client_unread = client_unread + (recipient = c.client_id)::int,
    vendor_unread = vendor_unread + (recipient = c.vendor_id)::int
   where id = c.id;
  insert into public.notifications (user_id, kind, link) values (recipient, 'new_message', '/messages');
  return new;
end; $$;
drop trigger if exists message_after_insert on public.messages;
create trigger message_after_insert after insert on public.messages
  for each row execute procedure public.on_new_message();

create or replace function public.mark_chat_read(_chat_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.chats set
    client_unread = case when client_id = auth.uid() then 0 else client_unread end,
    vendor_unread = case when vendor_id = auth.uid() then 0 else vendor_unread end
   where id = _chat_id and auth.uid() in (client_id, vendor_id);
$$;
revoke execute on function public.mark_chat_read(uuid) from public, anon;
grant execute on function public.mark_chat_read(uuid) to authenticated;
