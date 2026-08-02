export type AccessRoleKey = {
  id: string;
  key: string;
  department_code: string;
  position: string;
  role: string;
  created_at?: string;
};

export type CreateAccessRoleKeyDTO = {
  key: string;
  department_code: string;
  position: string;
  role: string;
};
