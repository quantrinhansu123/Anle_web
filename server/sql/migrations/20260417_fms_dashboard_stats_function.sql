-- Aggregated stats for FMS dashboard (single RPC)

create or replace function public.fms_dashboard_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with
  counts as (
    select
      (select count(*)::bigint from customers) as customer_count,
      (select count(*)::bigint from shipments) as shipment_count
  ),
  rev as (
    select
      (
        coalesce((select sum(total) from sales_items), 0)
        + coalesce((select sum(amount_ex_vat + vat_amount) from sales_charge_items), 0)
      )::numeric as total_revenue_vnd
  ),
  cst as (
    select coalesce(sum(total), 0)::numeric as total_cost_vnd from purchasing_items
  ),
  shipment_status as (
    select jsonb_agg(
      jsonb_build_object('status', status, 'count', cnt) order by cnt desc
    ) as arr
    from (
      select status, count(*)::int as cnt
      from shipments
      group by status
    ) s
  ),
  months as (
    select generate_series(
      date_trunc('month', (current_timestamp at time zone 'UTC')::timestamptz) - interval '11 months',
      date_trunc('month', (current_timestamp at time zone 'UTC')::timestamptz),
      interval '1 month'
    ) as m
  ),
  ship_vol as (
    select date_trunc('month', created_at at time zone 'UTC') as m,
           coalesce(sum(quantity), 0)::numeric as volume
    from shipments
    group by 1
  ),
  sale_rev as (
    select
      date_trunc(
        'month',
        coalesce(s.quote_date::timestamptz, s.created_at at time zone 'UTC')
      ) as m,
      sum(
        (select coalesce(sum(total), 0) from sales_items si where si.sales_id = s.id)
        + (
          select coalesce(sum(amount_ex_vat + vat_amount), 0)
          from sales_charge_items sc
          where sc.sales_id = s.id
        )
      )::numeric as revenue
    from sales s
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
          (select coalesce(sum(total), 0) from sales_items si where si.sales_id = s.id)
          + (
            select coalesce(sum(amount_ex_vat + vat_amount), 0)
            from sales_charge_items sc
            where sc.sales_id = s.id
          )
        )::numeric as svc_rev
      from sales s
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

comment on function public.fms_dashboard_stats() is 'JSON aggregates for FMS dashboard (revenue, cost, shipments, charts).';

grant execute on function public.fms_dashboard_stats() to service_role;
grant execute on function public.fms_dashboard_stats() to authenticated;
