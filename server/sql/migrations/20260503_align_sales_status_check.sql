-- Align sales status constraint for mixed old/new workflows.
-- Keep legacy values (converted/final) for backward compatibility.

alter table sales
  drop constraint if exists sales_status_check;

alter table sales
  add constraint sales_status_check
  check (
    status in (
      'draft',
      'confirmed',
      'sent',
      'won',
      'lost',
      'converted',
      'final'
    )
  );

