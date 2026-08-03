-- Atomic, idempotent, and ordered Paddle fulfillment.

alter table public.subscriptions
  add column if not exists event_occurred_at timestamptz;

create or replace function public.apply_paddle_subscription_event(
  p_event_id text,
  p_event_type text,
  p_event_occurred_at timestamptz,
  p_owner uuid,
  p_customer_id text,
  p_subscription_id text,
  p_status text,
  p_catalog_plan text,
  p_effective_plan text,
  p_price_id text,
  p_current_period_end timestamptz,
  p_scheduled_change_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  event_claimed boolean := false;
  affected_rows integer := 0;
begin
  insert into public.paddle_webhook_events (event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing
  returning true into event_claimed;

  if not coalesce(event_claimed, false) then
    return false;
  end if;

  insert into public.subscriptions (
    owner, paddle_customer_id, paddle_sub_id, status, plan, price_id,
    current_period_end, scheduled_change_at, event_occurred_at, updated_at
  ) values (
    p_owner, p_customer_id, p_subscription_id, p_status, p_catalog_plan,
    p_price_id, p_current_period_end, p_scheduled_change_at,
    p_event_occurred_at, now()
  )
  on conflict (owner) do update set
    paddle_customer_id = excluded.paddle_customer_id,
    paddle_sub_id = excluded.paddle_sub_id,
    status = excluded.status,
    plan = excluded.plan,
    price_id = excluded.price_id,
    current_period_end = excluded.current_period_end,
    scheduled_change_at = excluded.scheduled_change_at,
    event_occurred_at = excluded.event_occurred_at,
    updated_at = now()
  where public.subscriptions.event_occurred_at is null
     or excluded.event_occurred_at >= public.subscriptions.event_occurred_at;

  get diagnostics affected_rows = row_count;

  if affected_rows > 0 then
    update public.profiles set plan = p_effective_plan where id = p_owner;
  end if;

  return affected_rows > 0;
end;
$$;

revoke all on function public.apply_paddle_subscription_event(
  text, text, timestamptz, uuid, text, text, text, text, text, text,
  timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.apply_paddle_subscription_event(
  text, text, timestamptz, uuid, text, text, text, text, text, text,
  timestamptz, timestamptz
) to service_role;
