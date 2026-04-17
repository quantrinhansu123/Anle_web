import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateShipmentDocumentDto,
  ShipmentDocument,
  ShipmentDocumentStatus,
  ShipmentDocumentType,
  UpdateShipmentDocumentDto,
} from './shipment-document.types';

const REQUIRED_DOC_TYPES: ShipmentDocumentType[] = [
  'commercial_invoice',
  'packing_list',
  'sales_contract',
];

const READY_STATUSES = new Set(['verified', 'issued']);

/**
 * Document types that require shipment-level cross-checks before verification.
 * Per SOP Section II.1: block issuance if HS code / Incoterms / commodity are wrong or missing.
 */
const CROSS_CHECK_DOC_TYPES = new Set<ShipmentDocumentType>([
  'commercial_invoice',
  'packing_list',
  'sales_contract',
  'co_form_e',
  'bill_of_lading',
]);

export class ShipmentDocumentService {
  /**
   * SOP Cross-check: Before verifying/issuing certain document types,
   * validate that the parent shipment has required fields set.
   * - commodity must be non-empty
   * - hs_code must be non-empty
   * - term (incoterms) must be non-empty
   * - is_hs_confirmed must be true (customs has confirmed the HS code)
   */
  private async assertCrossCheck(
    shipmentId: string,
    docType: ShipmentDocumentType,
    newStatus: ShipmentDocumentStatus,
  ): Promise<void> {
    // Only check when moving to verified or issued
    if (!READY_STATUSES.has(newStatus)) return;
    // Only check for document types that require cross-validation
    if (!CROSS_CHECK_DOC_TYPES.has(docType)) return;

    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('commodity, hs_code, term, is_hs_confirmed')
      .eq('id', shipmentId)
      .single();

    if (error) throw error;
    if (!shipment) throw new AppError('Shipment not found for cross-check', 404);

    const issues: string[] = [];

    if (!shipment.commodity || shipment.commodity.trim() === '') {
      issues.push('Commodity/product name is missing on the shipment');
    }
    if (!shipment.hs_code || shipment.hs_code.trim() === '') {
      issues.push('HS code is missing on the shipment');
    }
    if (!shipment.term || shipment.term.trim() === '') {
      issues.push('Incoterms is missing on the shipment');
    }
    if (!shipment.is_hs_confirmed) {
      issues.push('HS code has not been confirmed by Customs team');
    }

    if (issues.length > 0) {
      throw new AppError(
        `Cannot ${newStatus === 'verified' ? 'verify' : 'issue'} ${docType}: ${issues.join('; ')}`,
        400,
      );
    }
  }
  private async syncShipmentDocsReady(shipmentId: string): Promise<void> {
    const { data, error } = await supabase
      .from('shipment_documents')
      .select('doc_type, status')
      .eq('shipment_id', shipmentId);

    if (error) throw error;

    const rows = data ?? [];
    const isDocsReady = REQUIRED_DOC_TYPES.every((docType) =>
      rows.some((row) => row.doc_type === docType && READY_STATUSES.has(row.status)),
    );

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('status')
      .eq('id', shipmentId)
      .single();

    if (shipmentError) throw shipmentError;

    const patch: { is_docs_ready: boolean; status?: string } = {
      is_docs_ready: isDocsReady,
    };

    // Auto-progress to docs_ready when shipment already reached planned stage.
    if (isDocsReady && shipment?.status === 'planned') {
      patch.status = 'docs_ready';
    }

    const { error: updateError } = await supabase
      .from('shipments')
      .update(patch)
      .eq('id', shipmentId);

    if (updateError) throw updateError;
  }

  async findAll(
    page = 1,
    limit = 20,
    shipmentId?: string,
  ): Promise<{ data: ShipmentDocument[]; count: number }> {
    const from = (page - 1) * limit;
    let query = supabase
      .from('shipment_documents')
      .select('*, verified_by:employees(full_name)', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    if (shipmentId) {
      query = query.eq('shipment_id', shipmentId);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<ShipmentDocument | null> {
    const { data, error } = await supabase
      .from('shipment_documents')
      .select('*, verified_by:employees(full_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateShipmentDocumentDto): Promise<ShipmentDocument> {
    const payload: CreateShipmentDocumentDto = {
      ...dto,
      status: dto.status ?? 'draft',
      version: dto.version ?? 1,
    };

    const { data, error } = await supabase
      .from('shipment_documents')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await this.syncShipmentDocsReady(payload.shipment_id);
    return data;
  }

  async update(id: string, dto: UpdateShipmentDocumentDto): Promise<ShipmentDocument> {
    // If status is changing to verified/issued, run SOP cross-check first
    if (dto.status && READY_STATUSES.has(dto.status)) {
      const current = await this.findById(id);
      if (!current) throw new AppError('Document not found', 404);
      await this.assertCrossCheck(current.shipment_id, current.doc_type, dto.status);
    }

    const { data, error } = await supabase
      .from('shipment_documents')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.syncShipmentDocsReady(data.shipment_id);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { data: current, error: currentError } = await supabase
      .from('shipment_documents')
      .select('shipment_id')
      .eq('id', id)
      .single();

    if (currentError) throw currentError;

    const { error } = await supabase
      .from('shipment_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.syncShipmentDocsReady(current.shipment_id);
  }
}
