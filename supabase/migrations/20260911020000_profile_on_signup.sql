-- Auto-create a profiles row the moment someone signs up, so a profile
-- always exists alongside the auth.users record (no client-side race
-- where auth succeeds but the profile insert fails/never happens).
--
-- display_name / location can be passed in via supabase.auth.signUp()'s
-- `options.data`; falls back to the email's local part if not supplied.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'location'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
