import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FileCheck2, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { shipmentService } from '../../services/shipmentService';
import { formatDate } from '../../lib/utils';
import { useToastContext } from '../../contexts/ToastContext';
import type { Shipment } from './types';

type DeliveryNoteForm = {
  doc_no: string;
  delivery_date: string;
  receiver_name: string;
  receiver_contact: string;
  delivery_condition: string;
  remarks: string;
};

const EMPTY_FORM: DeliveryNoteForm = {
  doc_no: '',
  delivery_date: '',
  receiver_name: '',
  receiver_contact: '',
  delivery_condition: '',
  remarks: '',
};

const DeliveryNotePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: shipmentId } = useParams<{ id: string }>();
  const { success: toastOk, error: toastErr } = useToastContext();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const [form, setForm] = useState<DeliveryNoteForm>(EMPTY_FORM);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!shipmentId) {
        setLoading(false);
        return;
      }
      try {
        const [shipmentData, note] = await Promise.all([
          shipmentService.getShipmentById(shipmentId),
          shipmentService.getDeliveryNote(shipmentId).catch(() => null),
        ]);
        if (cancelled) return;
        setShipment(shipmentData);
        if (note) {
          setForm({
            doc_no: note.doc_no || '',
            delivery_date: note.delivery_date || '',
            receiver_name: note.receiver_name || '',
            receiver_contact: note.receiver_contact || '',
            delivery_condition: note.delivery_condition || '',
            remarks: note.remarks || '',
          });
          setIssuedAt(note.issued_at || null);
        } else {
          const defaultDocNo = shipmentData.master_job_no
            ? `DN-${shipmentData.master_job_no}`
            : `DN-${shipmentData.id.slice(0, 8).toUpperCase()}`;
          setForm((prev) => ({ ...prev, doc_no: defaultDocNo }));
        }
      } catch {
        if (!cancelled) setShipment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  const setField = useCallback((k: keyof DeliveryNoteForm, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  }, []);

  const handleSave = useCallback(
    async (issue: boolean) => {
      if (!shipmentId) return;
      setSaving(true);
      try {
        const now = new Date().toISOString();
        const res = await shipmentService.upsertDeliveryNote(shipmentId, {
          ...form,
          delivery_date: form.delivery_date || null,
          status: issue ? 'issued' : 'draft',
          issued_at: issue ? now : null,
          snapshot: {
            shipment_code: shipment?.code || '',
            shipment_job_no: shipment?.master_job_no || '',
            ...form,
          },
        });
        setIssuedAt(res.issued_at || null);
        toastOk(issue ? 'Delivery note issued.' : 'Delivery note saved.');
      } catch (e) {
        toastErr(e instanceof Error ? e.message : 'Could not save delivery note');
      } finally {
        setSaving(false);
      }
    },
    [shipmentId, form, shipment, toastOk, toastErr],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="rounded-2xl border border-border bg-white p-6 text-center">
          <p className="font-bold text-slate-900">Shipment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-[13px] font-bold text-slate-700"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="text-right">
            <h1 className="text-lg font-black text-slate-900">Delivery Note</h1>
            <p className="text-[12px] text-muted-foreground">{shipment.code || shipment.master_job_no || shipment.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Doc No</span>
            <input className="h-10 rounded-lg border border-border px-3 text-[13px]" value={form.doc_no} onChange={(e) => setField('doc_no', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Delivery Date</span>
            <input type="date" className="h-10 rounded-lg border border-border px-3 text-[13px]" value={form.delivery_date} onChange={(e) => setField('delivery_date', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Receiver Name</span>
            <input className="h-10 rounded-lg border border-border px-3 text-[13px]" value={form.receiver_name} onChange={(e) => setField('receiver_name', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Receiver Contact</span>
            <input className="h-10 rounded-lg border border-border px-3 text-[13px]" value={form.receiver_contact} onChange={(e) => setField('receiver_contact', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Delivery Condition</span>
            <input className="h-10 rounded-lg border border-border px-3 text-[13px]" value={form.delivery_condition} onChange={(e) => setField('delivery_condition', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Remarks</span>
            <textarea className="min-h-[120px] rounded-lg border border-border px-3 py-2 text-[13px]" value={form.remarks} onChange={(e) => setField('remarks', e.target.value)} />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <p className="text-[12px] text-muted-foreground">
            {issuedAt ? `Issued at ${formatDate(issuedAt)}` : 'Status: Draft'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave(false)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-[13px] font-bold text-slate-700 disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <FileCheck2 size={15} />}
              Issue Delivery Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryNotePage;
