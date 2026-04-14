-- Business dashboard: quotation revenue breakdowns + distinct customers per shipment status (date-scoped).

create or replace function public.business_dashboard_stats(
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
  sale_base as (
    select
      s.id as sales_id,
      s.sales_person_id,
      s.service_mode,
      sh.customer_id,
      (
        select coalesce(sum(si.total), 0)
        from sales_items si
        where si.sales_id = s.id
      )
      + (
        select coalesce(sum(sc.amount_ex_vat + vat_amount), 0)
        from sales_charge_items sc
        where sc.sales_id = s.id
      )::numeric as revenue_vnd
    from sales s
    left join shipments sh on sh.id = s.shipment_id
    where coalesce(s.quote_date, (s.created_at at time zone 'UTC')::date) between p_from and p_to
  ),
  by_person as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('name', display_name, 'revenueVnd', rev) order by rev desc
      ),
      '[]'::jsonb
    ) as arr
    from (
      select * from (
        select
          coalesce(nullif(trim(e.full_name), ''), 'Unassigned Sales') as display_name,
          sum(sb.revenue_vnd)::numeric as rev
        from sale_base sb
        left join employees e on e.id = sb.sales_person_id
        group by coalesce(nullif(trim(e.full_name), ''), 'Unassigned Sales')
        having sum(sb.revenue_vnd) <> 0
      ) z
      order by rev desc
      limit 30
    ) x
  ),
  by_customer as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('name', display_name, 'revenueVnd', rev) order by rev desc
      ),
      '[]'::jsonb
    ) as arr
    from (
      select * from (
        select
          coalesce(nullif(trim(c.company_name), ''), 'Unknown') as display_name,
          sum(sb.revenue_vnd)::numeric as rev
        from sale_base sb
        left join customers c on c.id = sb.customer_id
        group by c.id, c.company_name
        having sum(sb.revenue_vnd) <> 0
      ) z
      order by rev desc
      limit 40
    ) y
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
        sb.service_mode,
        sum(sb.revenue_vnd)::numeric as svc_rev
      from sale_base sb
      group by sb.service_mode
    ) svc
  ),
  by_shipment_status as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'name', initcap(replace(st.status, '_', ' ')),
          'count', st.cnt
        ) order by st.cnt desc
      ),
      '[]'::jsonb
    ) as arr
    from (
      select sh.status, count(distinct sh.customer_id)::int as cnt
      from shipments sh
      where (sh.created_at at time zone 'UTC')::date between p_from and p_to
        and sh.customer_id is not null
      group by sh.status
    ) st
  )
  select jsonb_build_object(
    'salesRevenueByPerson', (select arr from by_person),
    'customerRevenue', (select arr from by_customer),
    'revenueByService', (select arr from by_service),
    'customersByShipmentStatus', (select arr from by_shipment_status)
  );
$$;

comment on function public.business_dashboard_stats(date, date) is
  'Business dashboard JSON: sales by person, revenue by customer, by service_mode, distinct customers by shipment status; inclusive date range.';

grant execute on function public.business_dashboard_stats(date, date) to service_role;
grant execute on function public.business_dashboard_stats(date, date) to authenticated;
