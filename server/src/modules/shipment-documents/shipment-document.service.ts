import { supabase } from '../../config/supabase';
import type {
  CreateShipmentDocumentDto,
  ShipmentDocument,
  ShipmentDocumentType,
  UpdateShipmentDocumentDto,
} from './shipment-document.types';

const REQUIRED_DOC_TYPES: ShipmentDocumentType[] = [
  'commercial_invoice',
  'packing_list',
  'sales_contract',
];

const READY_STATUSES = new Set(['verified', 'issued']);

export class ShipmentDocumentService {
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
