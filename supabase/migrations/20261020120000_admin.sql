-- Data of the school site's admin panel and contact form. Only the server reaches these tables,
-- with the secret (service_role) key: RLS is on without policies, so the public keys get nothing.
-- Safe to run again (e.g. pasted in the SQL Editor first, then applied by `npm run db:push`).

create table if not exists public.entries (
  id text primary key,
  kind text not null,
  title text not null,
  body text not null default '',
  category text not null default '',
  year text not null default '',
  date text not null default '',
  image text not null default '',
  file text not null default '',
  source text not null default '',
  details text not null default '',
  gallery text not null default '',
  attachments text not null default '',
  published integer not null default 1
);
create index if not exists entries_kind_year on public.entries (kind, year);

create table if not exists public.messages (
  id text primary key,
  first text not null,
  last text not null,
  email text not null,
  phone text not null default '',
  message text not null,
  created bigint not null,
  ip text not null
);
create index if not exists messages_ip_created on public.messages (ip, created);

create table if not exists public.contact_tokens (
  id text primary key,
  created bigint not null,
  ip text not null
);
create index if not exists contact_tokens_ip_created on public.contact_tokens (ip, created);

create table if not exists public.auth_limits (
  key text primary key,
  attempts integer not null,
  started bigint not null
);

alter table public.entries enable row level security;
alter table public.messages enable row level security;
alter table public.contact_tokens enable row level security;
alter table public.auth_limits enable row level security;
revoke all on public.entries, public.messages, public.contact_tokens, public.auth_limits from anon, authenticated;
-- Granted explicitly rather than relying on the project's default privileges for new tables.
grant select, insert, update, delete on public.entries, public.messages, public.contact_tokens, public.auth_limits to service_role;

-- Counts a sign-in attempt in a 15-minute window and returns the attempts so far.
create or replace function public.auth_attempt(attempt_key text, now_ms bigint) returns integer
language plpgsql set search_path = '' as $$
declare
  window_start bigint := now_ms - 15 * 60 * 1000;
  result integer;
begin
  insert into public.auth_limits as l (key, attempts, started) values (attempt_key, 1, now_ms)
  on conflict (key) do update set
    attempts = case when l.started < window_start then 1 else l.attempts + 1 end,
    started = case when l.started < window_start then now_ms else l.started end
  returning attempts into result;
  delete from public.auth_limits where started < now_ms - 86400000;
  return result;
end $$;

-- Issues a one-time contact form token; false while the address holds 30 unused ones from the last hour.
-- Both contact functions take a per-address lock first, so parallel requests cannot all pass the same count.
create or replace function public.contact_token(token_id text, ip_hash text, now_ms bigint) returns boolean
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('contact'), hashtext(ip_hash));
  delete from public.contact_tokens where created < now_ms - 3600000;
  if (select count(*) from public.contact_tokens where ip = ip_hash and created > now_ms - 3600000) >= 30 then
    return false;
  end if;
  insert into public.contact_tokens (id, created, ip) values (token_id, now_ms, ip_hash);
  return true;
end $$;

-- Spends the token (at least 2.5 s old, at most an hour) and stores the message, at most 5 per hour
-- from one address. Returns 'ok', 'expired' or 'limit'.
create or replace function public.contact_submit(token_id text, ip_hash text, now_ms bigint, message_id text,
  first_name text, last_name text, email_address text, phone_number text, message_text text) returns text
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('contact'), hashtext(ip_hash));
  delete from public.contact_tokens where id = token_id and ip = ip_hash and created < now_ms - 2500 and created > now_ms - 3600000;
  if not found then return 'expired'; end if;
  if (select count(*) from public.messages where ip = ip_hash and created > now_ms - 3600000) >= 5 then
    return 'limit';
  end if;
  insert into public.messages (id, first, last, email, phone, message, created, ip)
  values (message_id, first_name, last_name, email_address, phone_number, message_text, now_ms, ip_hash);
  return 'ok';
end $$;

revoke execute on function public.auth_attempt(text, bigint) from public, anon, authenticated;
revoke execute on function public.contact_token(text, text, bigint) from public, anon, authenticated;
revoke execute on function public.contact_submit(text, text, bigint, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.auth_attempt(text, bigint) to service_role;
grant execute on function public.contact_token(text, text, bigint) to service_role;
grant execute on function public.contact_submit(text, text, bigint, text, text, text, text, text, text) to service_role;

-- Uploaded files. Public: published documents and photos are open to everyone, and each object
-- sits under an unguessable random id. Uploads happen only through signed URLs issued to the admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 52428800, array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/webp',
  'application/pkcs7-signature', 'application/pkcs7-mime'
])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
