export type CustomsLaneType = 'green' | 'yellow' | 'red';

export type PhytosanitaryStatus = 'pending' | 'in_progress' | 'passed' | 'failed';

export type CustomsClearanceStatus =
  | 'draft'
  | 'submitted'
  | 'inspecting'
  | 'released'
  | 'on_hold'
  | 'rejected';

export interface CustomsClearance {
  id: string;
  shipment_id: string;
  hs_code: string;
  hs_confirmed: boolean;
  declaration_no?: string | null;
  lane_type?: CustomsLaneType | null;
  phytosanitary_status: PhytosanitaryStatus;
  status: CustomsClearanceStatus;
  hold_reason?: string | null;
  released_at?: string | null;
  escalated_to_manager: boolean;
  created_at: string;
}

export interface CreateCustomsClearanceDto {
  shipment_id: string;
  hs_code: string;
  hs_confirmed?: boolean;
  declaration_no?: string | null;
  lane_type?: CustomsLaneType | null;
  phytosanitary_status?: PhytosanitaryStatus;
  status?: CustomsClearanceStatus;
  hold_reason?: string | null;
  released_at?: string | null;
  escalated_to_manager?: boolean;
}

export interface UpdateCustomsClearanceDto extends Partial<CreateCustomsClearanceDto> {}
