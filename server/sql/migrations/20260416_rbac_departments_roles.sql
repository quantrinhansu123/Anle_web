-- Migration: 20260416_rbac_departments_roles
-- Description: Add RBAC system with departments, teams, roles, and approval workflow
-- Author: Antigravity
-- Date: 2026-04-16

-- ============================================================
-- UP
-- ============================================================

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  code text PRIMARY KEY,
  name text NOT NULL,
  name_vi text,
  description text,
  parent_code text REFERENCES departments(code) ON DELETE SET NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Create teams table (sub-departments)
CREATE TABLE IF NOT EXISTS teams (
  code text PRIMARY KEY,
  name text NOT NULL,
  name_vi text,
  department_code text REFERENCES departments(code) ON DELETE CASCADE,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Update employees table with RBAC fields
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS department_code text REFERENCES departments(code) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_code text REFERENCES teams(code) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS spending_limit numeric DEFAULT 0;

-- 4. Create approval_requests table
CREATE TABLE IF NOT EXISTS approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,                    -- 'deal', 'purchase', 'expense', 'vendor_selection', 'price_override'
  title text NOT NULL,
  description text,
  amount numeric DEFAULT 0,
  currency text DEFAULT 'VND',
  
  -- Workflow: Sales → Procurement → Logistics → Finance → BOD
  status text DEFAULT 'pending',         -- 'pending', 'in_review', 'approved', 'rejected', 'cancelled'
  current_step text,                     -- which department currently reviewing
  
  -- Reference to source entity
  reference_type text,                   -- 'sales_order', 'purchase_order', 'shipment', 'expense'
  reference_id text,                     -- ID of the referenced entity
  
  -- People
  requester_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  current_approver_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  final_approver_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Timestamps
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  
  -- Metadata
  notes text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Create approval_steps table (track each step in the workflow)
CREATE TABLE IF NOT EXISTS approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id uuid REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_order int NOT NULL,               -- 1, 2, 3, 4, 5
  department_code text REFERENCES departments(code),
  step_name text NOT NULL,               -- 'Sales Review', 'Procurement Check', etc.
  status text DEFAULT 'pending',         -- 'pending', 'approved', 'rejected', 'skipped'
  approver_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  notes text,
  acted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 6. Seed departments
INSERT INTO departments (code, name, name_vi, sort_order) VALUES
  ('bod', 'BOD / CEO', 'Ban Giám đốc', 1),
  ('finance', 'Finance & Accounting', 'Tài chính & Kế toán', 2),
  ('logistics', 'Logistics', 'Vận hành Logistics (SCM)', 3),
  ('procurement', 'Procurement', 'Mua hàng (Sourcing)', 4),
  ('sales', 'Sales', 'Kinh doanh (Trading)', 5),
  ('strategy', 'Strategy / PMO', 'Chiến lược / PMO', 6)
ON CONFLICT (code) DO NOTHING;

-- 7. Seed teams
INSERT INTO teams (code, name, name_vi, department_code, sort_order) VALUES
  -- Finance & Accounting
  ('tax', 'Tax Accountant', 'Kế toán thuế', 'finance', 1),
  ('cost_control', 'Internal Accountant (Cost Control)', 'Kiểm soát chi phí nội bộ', 'finance', 2),
  -- Logistics - Documentation
  ('export_docs', 'Export Documentation', 'Chứng từ xuất (B/L, VGM, Export)', 'logistics', 1),
  ('import_docs', 'Import Documentation', 'Chứng từ nhập (AN, DO, Manifest)', 'logistics', 2),
  -- Logistics - Customs & Compliance
  ('customs', 'Customs Clearance', 'Thông quan hải quan', 'logistics', 3),
  ('quarantine', 'Quarantine', 'Kiểm dịch', 'logistics', 4),
  -- Logistics - Transport
  ('transport', 'Transport Coordination', 'Điều phối vận tải', 'logistics', 5),
  ('fleet', 'Container / Fleet Tracking', 'Theo dõi xe & container', 'logistics', 6),
  -- Logistics - International Agents
  ('china_agents', 'China Border Agents', 'Đại lý biên giới Trung Quốc', 'logistics', 7),
  ('overseas_fwd', 'Overseas Forwarders', 'Đại lý vận chuyển quốc tế', 'logistics', 8),
  -- Procurement
  ('domestic_supplier', 'Domestic Supplier Team', 'NCC nội địa (VN)', 'procurement', 1),
  ('intl_supplier', 'International Supplier Team', 'NCC quốc tế', 'procurement', 2),
  ('qc', 'Quality Control', 'Kiểm đếm & Kiểm tra chất lượng', 'procurement', 3),
  -- Sales
  ('domestic_sales', 'Domestic Sales', 'Kinh doanh nội địa', 'sales', 1),
  ('china_market', 'China Market', 'Thị trường Trung Quốc', 'sales', 2),
  ('asean_market', 'ASEAN Market', 'Thị trường ASEAN', 'sales', 3),
  ('other_markets', 'Other Markets', 'Thị trường khác', 'sales', 4),
  ('customer_service', 'Customer Service / Account Management', 'CSKH / Quản lý tài khoản', 'sales', 5)
ON CONFLICT (code) DO NOTHING;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_code);
CREATE INDEX IF NOT EXISTS idx_employees_team ON employees(team_code);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester ON approval_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approver ON approval_requests(current_approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_request ON approval_steps(approval_request_id);

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DROP INDEX IF EXISTS idx_approval_steps_request;
-- DROP INDEX IF EXISTS idx_approval_requests_approver;
-- DROP INDEX IF EXISTS idx_approval_requests_requester;
-- DROP INDEX IF EXISTS idx_approval_requests_status;
-- DROP INDEX IF EXISTS idx_employees_manager;
-- DROP INDEX IF EXISTS idx_employees_team;
-- DROP INDEX IF EXISTS idx_employees_department;
-- DROP INDEX IF EXISTS idx_employees_role;
-- DROP TABLE IF EXISTS approval_steps;
-- DROP TABLE IF EXISTS approval_requests;
-- ALTER TABLE employees DROP COLUMN IF EXISTS spending_limit;
-- ALTER TABLE employees DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE employees DROP COLUMN IF EXISTS manager_id;
-- ALTER TABLE employees DROP COLUMN IF EXISTS team_code;
-- ALTER TABLE employees DROP COLUMN IF EXISTS department_code;
-- ALTER TABLE employees DROP COLUMN IF EXISTS role;
-- DROP TABLE IF EXISTS teams;
-- DROP TABLE IF EXISTS departments;
