-- FMS dashboard: all aggregates and monthly series are scoped to [p_from, p_inclusive] (inclusive calendar dates, UTC components).
-- Both arguments are required so PostgREST/Supabase cannot fall back to a legacy zero-argument overload.

drop function if exists public.fms_dashboard_stats();
drop function if exists public.fms_dashboard_stats(date, date);

create or replace function public.fms_dashboard_stats(
  p_from date,
  p_to date
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with
  counts as (
    select
      (
        select count(distinct sh.customer_id)::bigint
        from sales s
        join shipments sh on sh.id = s.shipment_id
        where coalesce(s.quote_date, (s.created_at at time zone 'UTC')::date)
              between p_from and p_to
          and sh.customer_id is not null
      ) as customer_count,
      (
        select count(*)::bigint from shipments sh
        where (sh.created_at at time zone 'UTC')::date between p_from and p_to
      ) as shipment_count
  ),
  rev as (
    select (
      coalesce((
        select sum(si.total)
        from sales_items si
        join sales s on s.id = si.sales_id
        where coalesce(s.quote_date, (s.created_at at time zone 'UTC')::date) between p_from and p_to
      ), 0)
      + coalesce((
        select sum(sc.amount_ex_vat + sc.vat_amount)
        from sales_charge_items sc
        join sales s on s.id = sc.sales_id
        where coalesce(s.quote_date, (s.created_at at time zone 'UTC')::date) between p_from and p_to
      ), 0)
    )::numeric as total_revenue_vnd
  ),
  cst as (
    select (
      coalesce((
        select sum(pi.total)
        from purchasing_items pi
        where (pi.created_at at time zone 'UTC')::date between p_from and p_to
      ), 0)
    )::numeric as total_cost_vnd
  ),
  shipment_status as (
    select jsonb_agg(
      jsonb_build_object('status', status, 'count', cnt) order by cnt desc
    ) as arr
    from (
      select sh.status, count(*)::int as cnt
      from shipments sh
      where (sh.created_at at time zone 'UTC')::date between p_from and p_to
      group by sh.status
    ) s
  ),
  months as (
    select generate_series(
      date_trunc('month', p_from::timestamp),
      date_trunc('month', p_to::timestamp),
      interval '1 month'
    ) as m
  ),
  ship_vol as (
    select date_trunc('month', sh.created_at at time zone 'UTC') as m,
           coalesce(sum(sh.quantity), 0)::numeric as volume
    from shipments sh
    where (sh.created_at at time zone 'UTC')::date between p_from and p_to
    group by 1
  ),
  sale_rev as (
    select
      date_trunc(
        'month',
        coalesce(s.quote_date::timestamptz, s.created_at at time zone 'UTC')
      ) as m,
      sum(
        (select coalesce(sum(si.total), 0) from sales_items si where si.sales_id = s.id)
        + (
          select coalesce(sum(amount_ex_vat + vat_amount), 0)
          from sales_charge_items sc
          where sc.sales_id = s.id
        )
      )::numeric as revenue
    from sales s
    where coalesce(s.quote_date, (s.created_at at time zone 'UTC')::date) between p_from and p_to
    group by 1
  ),
  monthly as (
    select jsonb_agg(
      jsonb_build_object(
        'month', trim(to_char(months.m, 'Mon YYYY')),
        'monthStart', months.m,
        'volumeTeu', coalesce(v.volume, 0),
        'revenueVnd', coalesce(r.revenue, 0)
      ) order by months.m
    ) as arr
    from months
    left join ship_vol v on v.m = months.m
    left join sale_rev r on r.m = months.m
  ),
  by_service as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'name', coalesce(nullif(trim(service_mode), ''), 'Unspecified'),
          'revenueVnd', svc_rev
        ) order by svc_rev desc
      ),
      '[]'::jsonb
    ) as arr
    from (
      select
        s.service_mode,
        sum(
          (select coalesce(sum(si.total), 0) from sales_items si where si.sales_id = s.id)
          + (
            select coalesce(sum(amount_ex_vat + vat_amount), 0)
            from sales_charge_items sc
            where sc.sales_id = s.id
          )
        )::numeric as svc_rev
      from sales s
      where coalesce(s.quote_date, (s.created_at at time zone 'UTC')::date) between p_from and p_to
      group by s.service_mode
    ) x
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'totalRevenueVnd', (select total_revenue_vnd from rev),
      'totalCostVnd', (select total_cost_vnd from cst),
      'customerCount', (select customer_count::int from counts),
      'totalShipments', (select shipment_count::int from counts),
      'grossProfitVnd',
        (select total_revenue_vnd from rev) - (select total_cost_vnd from cst)
    ),
    'shipmentStatus', coalesce((select arr from shipment_status), '[]'::jsonb),
    'monthly', coalesce((select arr from monthly), '[]'::jsonb),
    'revenueByService', (select arr from by_service)
  );
$$;

comment on function public.fms_dashboard_stats(date, date) is 'FMS dashboard JSON aggregates; requires inclusive date range p_from .. p_to.';

grant execute on function public.fms_dashboard_stats(date, date) to service_role;
grant execute on function public.fms_dashboard_stats(date, date) to authenticated;
