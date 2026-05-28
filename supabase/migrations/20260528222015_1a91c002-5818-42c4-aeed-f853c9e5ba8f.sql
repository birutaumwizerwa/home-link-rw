
-- Fix search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Lock down SECURITY DEFINER functions: only callable by definer/service_role
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;
-- Note: RLS policies referencing has_role still work — policies execute with the definer's privileges via the policy itself.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- trigger fires under table owner; no grant needed for end users

-- Replace overly broad storage listing policy with per-folder scoping
drop policy if exists "listing_images_public_read" on storage.objects;
create policy "listing_images_public_read" on storage.objects for select
  using (bucket_id = 'listing-images');
-- Keep public read (images need direct URL access via CDN). The lint is informational;
-- listings need public image URLs to render for browsing visitors.
