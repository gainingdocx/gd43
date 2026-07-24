-- Progressive account onboarding. Authentication secrets remain exclusively
-- in Supabase Auth; this table stores only product profile/preferences.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists job_role text,
  add column if not exists company_type text,
  add column if not exists country_code text,
  add column if not exists timezone text,
  add column if not exists preferred_language text not null default 'en',
  add column if not exists default_translation_language text,
  add column if not exists date_format text not null default 'DD/MM/YYYY',
  add column if not exists measurement_system text not null default 'metric',
  add column if not exists primary_modes text[] not null default '{}',
  add column if not exists use_cases text[] not null default '{}',
  add column if not exists monthly_document_volume text,
  add column if not exists deadline_reminders boolean not null default true,
  add column if not exists review_notifications boolean not null default true,
  add column if not exists product_updates boolean not null default true,
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles drop constraint if exists profiles_country_code_format;
alter table public.profiles add constraint profiles_country_code_format
  check (country_code is null or country_code ~ '^[A-Z]{2}$');
alter table public.profiles drop constraint if exists profiles_measurement_system_check;
alter table public.profiles add constraint profiles_measurement_system_check
  check (measurement_system in ('metric', 'imperial'));
alter table public.profiles drop constraint if exists profiles_date_format_check;
alter table public.profiles add constraint profiles_date_format_check
  check (date_format in ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'));

revoke update on public.profiles from authenticated;
grant update (
  full_name, first_name, last_name, company, job_role, company_type,
  country_code, timezone, preferred_language, default_translation_language,
  date_format, measurement_system, primary_modes, use_cases,
  monthly_document_volume, deadline_reminders, review_notifications,
  product_updates, marketing_consent, terms_accepted_at, privacy_accepted_at,
  onboarding_completed_at
) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_name_value text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), '');
  last_name_value text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'last_name', '')), '');
  supplied_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '');
  accepted_at timestamptz := case
    when coalesce((new.raw_user_meta_data ->> 'accepted_terms')::boolean, false) then now()
    else null
  end;
begin
  insert into public.profiles (
    id, email, first_name, last_name, full_name, company,
    marketing_consent, terms_accepted_at, privacy_accepted_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    first_name_value,
    last_name_value,
    coalesce(supplied_name, nullif(trim(concat_ws(' ', first_name_value, last_name_value)), '')),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'company', '')), ''),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    accepted_at,
    accepted_at
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name = coalesce(public.profiles.last_name, excluded.last_name),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    company = coalesce(public.profiles.company, excluded.company),
    updated_at = now();
  return new;
exception
  when invalid_text_representation then
    insert into public.profiles (id, email, full_name)
    values (new.id, coalesce(new.email, ''), supplied_name)
    on conflict (id) do nothing;
    return new;
end;
$$;

update public.profiles p
set
  first_name = coalesce(p.first_name, nullif(trim(u.raw_user_meta_data ->> 'given_name'), '')),
  last_name = coalesce(p.last_name, nullif(trim(u.raw_user_meta_data ->> 'family_name'), '')),
  full_name = coalesce(p.full_name, nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), '')),
  timezone = coalesce(p.timezone, 'Asia/Calcutta')
from auth.users u
where u.id = p.id;
