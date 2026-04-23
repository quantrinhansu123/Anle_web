# Sales → Ops → Docs UAT Checklist

## Sales Workflow

- Create quotation in `Draft` without `shipment_id`, with CRM customer selected.
- Move `Draft -> Confirmed -> Sent -> Won` using action buttons.
- Verify invalid transitions are blocked (for example `Draft -> Won`).
- Use `Send Email` action and verify entry is written to `quotation_email_logs`.
- Mark quotation `Lost` and confirm customer pipeline moves to `lost`.

## Create Job & Operations

- From `Won` quotation, click `Create Job` and verify shipment is created exactly once.
- Re-run `Create Job` and confirm API returns existing linked shipment (idempotent behavior).
- Confirm shipment opens SOP screen with generated `master_job_no`.
- Verify B/L lines save and include `loading_date` and `delivery_date`.

## Documentation Persistence

- Open `Arrival Notice`, click `Issue`, reload page, and verify issued timestamp remains.
- Confirm arrival notice record exists in `arrival_notices` with saved snapshot data.
- Open `Delivery Note`, save draft, reload, and verify values persist.
- Issue delivery note and confirm `delivery_notes.status = issued` and `issued_at` is set.

## Backward Compatibility

- Existing quotation rows with `final`/`converted` still render correctly in Sales pages.
- Legacy read routes still return expected response shape for existing screens.
- Customer Kanban displays `won` column without breaking existing statuses.
