-- Migration: Step 3 - Migrate fms_job_bl_lines into shipment_bl_lines

INSERT INTO shipment_bl_lines (id, shipment_id, sort_order, name_1, sea_customer, air_customer, name_2, package_text, unit_text, sea_etd, sea_eta, air_etd, air_eta)
SELECT bl.id, m.shipment_id, bl.sort_order, bl.name_1, bl.sea_customer, bl.air_customer, bl.name_2, bl.package_text, bl.unit_text, bl.sea_etd, bl.sea_eta, bl.air_etd, bl.air_eta
FROM fms_job_bl_lines bl
JOIN _migration_job_shipment_map m ON bl.job_id = m.job_id;

/*
-- Verify all BL lines migrated:
SELECT count(*) AS original FROM fms_job_bl_lines;
SELECT count(*) AS migrated FROM shipment_bl_lines;
-- These two counts MUST match

-- Verify no orphaned BL lines:
SELECT count(*) FROM shipment_bl_lines WHERE shipment_id NOT IN (SELECT id FROM shipments);
-- Must be 0
*/
