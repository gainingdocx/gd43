-- INSERT ... RETURNING must be able to evaluate ownership directly before
-- a helper subquery can observe the just-inserted row.
drop policy if exists "shipments_select_participant" on public.shipments;
create policy "shipments_select_participant" on public.shipments for select to authenticated
  using (owner = (select auth.uid()) or public.can_access_shipment(id));
