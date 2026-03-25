-- Migration: 20260325_seed_mock_data
-- Description: Thêm dữ liệu mẫu (mock data) cho toàn bộ hệ thống
-- Author: Antigravity
-- Date: 2026-03-25

-- ============================================================
-- UP
-- ============================================================

-- 1. CUSTOMERS
INSERT INTO customers (company_name, email, phone, address, tax_code)
VALUES 
('F-Solution Co., Ltd', 'contact@f-solution.vn', '02431234567', 'Duy Tan, Cau Giay, Hanoi', '0101234567'),
('Global Logistics JSC', 'info@globallogistics.com', '02839876543', 'Le Loi, District 1, Ho Chi Minh City', '0309876543'),
('ABC Trading Corp', 'sales@abctrading.vn', '02435556666', 'Khuat Duy Tien, Thanh Xuan, Hanoi', '0105556666');

-- 2. SUPPLIERS
INSERT INTO suppliers (id, company_name, email, phone, address, tax_code)
VALUES 
('GLS', 'Green Line Shipping', 'ops@gls-shipping.com', '02831112222', 'Cat Lai, District 2, Ho Chi Minh City', '0301112222'),
('ABT', 'An Binh Transport', 'booking@anbinhtrans.vn', '02432223333', 'Hai Ba Trung, Hanoi', '0102223333'),
('GTC', 'Golden Ocean Corp', 'charter@goldenocean.com', '0085233334444', 'Hong Kong', 'HK-33334444');

-- 3. EMPLOYEES (PIC)
INSERT INTO employees (full_name, email)
VALUES 
('Nguyen Van A', 'anv@logistics.com'),
('Tran Thi B', 'btt@logistics.com'),
('Le Van C', 'clv@logistics.com');

-- 4. SHIPMENTS
INSERT INTO shipments (customer_id, supplier_id, commodity, hs_code, quantity, packing, vessel_voyage, term, transport_sea, load_fcl, pol, pod, etd, eta)
SELECT 
  c.id, 'GLS', 'Electronic components', '8517.12.00', 500.00, 'Cartons', 'EVER GREEN V.0123W', 'CIF', true, true, 'HAI PHONG, VN', 'LOS ANGELES, US', '2026-04-01', '2026-04-25'
FROM customers c WHERE c.company_name = 'F-Solution Co., Ltd' LIMIT 1;

INSERT INTO shipments (customer_id, supplier_id, commodity, hs_code, quantity, packing, vessel_voyage, term, transport_sea, load_lcl, pol, pod, etd, eta)
SELECT 
  c.id, 'ABT', 'Interior Furniture', '9403.60.00', 12.50, 'Pallets', 'MAERSK LINE V.9988S', 'FOB', true, true, 'HO CHI MINH, VN', 'HAMBURG, DE', '2026-04-10', '2026-05-15'
FROM customers c WHERE c.company_name = 'ABC Trading Corp' LIMIT 1;

-- 5. SALES (báo giá)
INSERT INTO sales_items (shipment_id, description, rate, quantity, unit, currency, exchange_rate, tax_percent)
SELECT s.id, 'Sea Freight (FCL)', 1500.00, 1.0, 'CTR', 'USD', 25450, 0
FROM shipments s WHERE s.commodity = 'Electronic components' LIMIT 1;

INSERT INTO sales_items (shipment_id, description, rate, quantity, unit, currency, exchange_rate, tax_percent)
SELECT s.id, 'Trucking Hanoi - Hai Phong', 2500000.00, 1.0, 'TRIP', 'VND', 1, 10
FROM shipments s WHERE s.commodity = 'Electronic components' LIMIT 1;

-- 6. PURCHASING (mua hàng)
INSERT INTO purchasing_items (shipment_id, supplier_id, pic_id, description, rate, quantity, unit, currency, exchange_rate, tax_percent)
SELECT s.id, 'GLS', e.id, 'Sea Freight Buy', 1200.00, 1.0, 'CTR', 'USD', 25450, 0
FROM shipments s, employees e 
WHERE s.commodity = 'Electronic components' AND e.full_name = 'Nguyen Van A' LIMIT 1;

-- 7. CONTRACTS
INSERT INTO contracts (customer_id, supplier_id, pic_id, no_contract, payment_term, type_logistic)
SELECT c.id, 'GLS', e.id, 'FS-GLS-2026-001', '30 days after arrival', true
FROM customers c, employees e 
WHERE c.company_name = 'F-Solution Co., Ltd' AND e.full_name = 'Nguyen Van A' LIMIT 1;

-- 8. PAYMENT REQUESTS
INSERT INTO payment_requests (shipment_id, account_name, account_number, bank_name)
SELECT s.id, 'Green Line Shipping Ltd', '1234567890', 'Vietcombank'
FROM shipments s WHERE s.commodity = 'Electronic components' LIMIT 1;

-- 9. PAYMENT REQUEST INVOICES
INSERT INTO payment_request_invoices (payment_request_id, no_invoice, description, date_issue, payable_amount)
SELECT pr.id, 'INV-GLS-001', 'Ocean Freight invoice', current_date, 38175000
FROM payment_requests pr 
JOIN shipments s ON pr.shipment_id = s.id 
WHERE s.commodity = 'Electronic components' LIMIT 1;

-- 10. DEBIT NOTES
INSERT INTO debit_notes (shipment_id, note_date)
SELECT s.id, current_date
FROM shipments s WHERE s.commodity = 'Electronic components' LIMIT 1;

-- 11. DEBIT NOTE ITEMS
INSERT INTO debit_note_invoice_items (debit_note_id, description, unit, rate, quantity, tax_percent)
SELECT dn.id, 'Sea Freight charges', 'CTR', 40000000, 1, 0
FROM debit_notes dn
JOIN shipments s ON dn.shipment_id = s.id
WHERE s.commodity = 'Electronic components' LIMIT 1;

INSERT INTO debit_note_chi_ho_items (debit_note_id, description, unit, rate, quantity)
SELECT dn.id, 'Seal fee at Hai Phong Port', 'PCS', 500000, 1
FROM debit_notes dn
JOIN shipments s ON dn.shipment_id = s.id
WHERE s.commodity = 'Electronic components' LIMIT 1;


-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DELETE FROM debit_note_chi_ho_items;
-- DELETE FROM debit_note_invoice_items;
-- DELETE FROM debit_notes;
-- DELETE FROM payment_request_invoices;
-- DELETE FROM payment_requests;
-- DELETE FROM contracts;
-- DELETE FROM purchasing_items;
-- DELETE FROM sales_items;
-- DELETE FROM shipments;
-- DELETE FROM employees;
-- DELETE FROM suppliers;
-- DELETE FROM customers;
