import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';

export interface ApprovalRequest {
  id?: string;
  type: string;
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  status?: string;
  current_step?: string;
  reference_type?: string;
  reference_id?: string;
  requester_id: string;
  current_approver_id?: string;
  final_approver_id?: string;
}

export const approvalRequestService = {
  async getAll(role?: string, department_code?: string, userId?: string) {
    let query = supabase.from('approval_requests').select('*, requester:requester_id(full_name), approver:current_approver_id(full_name)');

    // Filtering based on role/department (simplified logic)
    if (role !== 'ceo') {
      if (department_code) {
        // Show requests for their department or requests they made
        // This logic might need refinement based on exact requirements
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new AppError(error.message, 400);
    return data || [];
  },

  async create(dto: ApprovalRequest) {
    const { data, error } = await supabase
      .from('approval_requests')
      .insert(dto)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  },

  async approve(id: string, approverId: string, notes?: string) {
    // This would involve updating the request status and potentially moving to the next step
    const { data, error } = await supabase
      .from('approval_requests')
      .update({ 
        status: 'approved', // simplified for now
        reviewed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        notes 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  },

  async reject(id: string, approverId: string, reason: string) {
    const { data, error } = await supabase
      .from('approval_requests')
      .update({ 
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        rejected_at: new Date().toISOString(),
        rejection_reason: reason 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  }
};
