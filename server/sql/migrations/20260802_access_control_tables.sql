-- Access control: role combination keys + view permissions
CREATE TABLE IF NOT EXISTS access_role_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  department_code text NOT NULL,
  position text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS access_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL REFERENCES access_role_keys(key) ON DELETE CASCADE,
  view_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_key, view_path)
);

CREATE INDEX IF NOT EXISTS idx_access_role_permissions_role_key
  ON access_role_permissions (role_key);

CREATE INDEX IF NOT EXISTS idx_access_role_keys_dept
  ON access_role_keys (department_code);
