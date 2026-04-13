export type JobBound = 'import' | 'export' | 'domestic' | 'transit';
export type JobWorkflowStatus = 'draft' | 'closed' | 'cancelled';

export interface FmsJobBlLine {
  id: string;
  job_id: string;
  sort_order: number;
  name_1: string | null;
  sea_customer: string | null;
  air_customer: string | null;
  name_2: string | null;
  package_text: string | null;
  unit_text: string | null;
  sea_etd: string | null;
  sea_eta: string | null;
  air_etd: string | null;
  air_eta: string | null;
}

/** Keyed by tab id: sea | air | trucking | customs | others */
export type FmsJobServiceDetails = Record<string, Record<string, unknown>>;

export interface FmsJob {
  id: string;
  master_job_no: string;
  job_date: string | null;
  services: string | null;
  bound: JobBound | null;
  customer_id: string | null;
  customer_pic: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  quotation_id: string | null;
  performance_date: string | null;
  created_by_id: string | null;
  created_on: string;
  product_pic_id: string | null;
  operators: string | null;
  salesperson_id: string | null;
  sales_team: string | null;
  sales_department: string | null;
  customer_com: string | null;
  liner_com: string | null;
  bl_status: string | null;
  bl_status_detail: string | null;
  workflow_status: JobWorkflowStatus;
  master_bl_number: string | null;
  master_bl_carrier: string | null;
  master_bl_remarks: string | null;
  priority_rank: number;
  updated_at: string;
  service_details?: FmsJobServiceDetails | null;
  customers?: { id: string; company_name: string; email?: string; phone?: string; sales_staff?: string } | null;
  quotation?: {
    id: string;
    no_doc?: string;
    quote_date?: string;
    created_at?: string;
    sales_person_id?: string;
    sales_person?: { id: string; full_name: string } | null;
  } | null;
  product_pic?: { id: string; full_name: string } | null;
  salesperson?: { id: string; full_name: string } | null;
  created_by?: { id: string; full_name: string } | null;
  bl_lines?: FmsJobBlLine[];
}

export type FmsJobBlLineInput = Omit<FmsJobBlLine, 'job_id'> & { job_id?: string };

export interface CreateFmsJobDto {
  master_job_no?: string | null;
  job_date?: string | null;
  services?: string | null;
  bound?: JobBound | null;
  customer_id?: string | null;
  customer_pic?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  quotation_id?: string | null;
  performance_date?: string | null;
  product_pic_id?: string | null;
  operators?: string | null;
  salesperson_id?: string | null;
  sales_team?: string | null;
  sales_department?: string | null;
  customer_com?: string | null;
  liner_com?: string | null;
  bl_status?: string | null;
  bl_status_detail?: string | null;
  workflow_status?: JobWorkflowStatus;
  master_bl_number?: string | null;
  master_bl_carrier?: string | null;
  master_bl_remarks?: string | null;
  priority_rank?: number;
  bl_lines?: FmsJobBlLineInput[];
  service_details?: FmsJobServiceDetails | null;
}

export type UpdateFmsJobDto = CreateFmsJobDto;
