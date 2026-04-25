import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import type { ShipmentDocument, CreateShipmentDocumentDto } from '../../../services/shipmentDocumentService';

interface DocumentsTabProps {
  shipmentId?: string;
  documents: ShipmentDocument[];
  newDocType: CreateShipmentDocumentDto['doc_type'];
  setNewDocType: (val: CreateShipmentDocumentDto['doc_type']) => void;
  newDocNumber: string;
  setNewDocNumber: (val: string) => void;
  isCreatingDocument: boolean;
  handleCreateDocument: () => void;
  handleChangeDocStatus: (id: string, status: ShipmentDocument['status']) => void;
  handleDeleteDoc: (id: string) => void;
  documentActionLoadingId: string | null;
  contractLabel?: string | null;
  quotationLabel?: string | null;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  shipmentId, documents, newDocType, setNewDocType, newDocNumber, setNewDocNumber,
  isCreatingDocument, handleCreateDocument, handleChangeDocStatus, handleDeleteDoc, documentActionLoadingId,
  contractLabel, quotationLabel
}) => {
  return (
    <section className="bg-white rounded-2xl border border-cyan-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-cyan-50 bg-cyan-50/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-cyan-600" />
          <span className="text-[12px] font-bold text-cyan-600 uppercase tracking-wider">Documentation — Documents Set</span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-[12px] text-slate-500">Commercial Invoice, Packing List, Sales Contract, CO Form E, Phytosanitary, Bill of Lading</p>

        {/* Document list */}
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Documents ({documents.length + (contractLabel ? 1 : 0) + (quotationLabel ? 1 : 0)})</p>
          
          <div className="space-y-1.5">
            {/* Auto-linked Quotation */}
            {quotationLabel && (
              <div className="flex items-center justify-between gap-2 text-[12px] px-2 py-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Quotation</span>
                  <span className="text-slate-500 text-[11px]">({quotationLabel})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">Linked</span>
                </div>
              </div>
            )}

            {/* Auto-linked Contract */}
            {contractLabel && (
              <div className="flex items-center justify-between gap-2 text-[12px] px-2 py-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Contract</span>
                  <span className="text-slate-500 text-[11px]">({contractLabel})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">Linked</span>
                </div>
              </div>
            )}

            {/* User uploaded documents */}
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between gap-2 text-[12px] px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">{doc.doc_type}</span>
                  {doc.doc_number && <span className="text-slate-500 text-[11px]">({doc.doc_number})</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <select value={doc.status} onChange={e => handleChangeDocStatus(doc.id, e.target.value as ShipmentDocument['status'])}
                    disabled={documentActionLoadingId === doc.id}
                    className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold uppercase">
                    <option value="draft">draft</option><option value="verified">verified</option>
                    <option value="rejected">rejected</option><option value="issued">issued</option>
                  </select>
                  <button onClick={() => handleDeleteDoc(doc.id)} disabled={documentActionLoadingId === doc.id}
                    className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={11} /></button>
                </div>
              </div>
            ))}

            {documents.length === 0 && !contractLabel && !quotationLabel && (
              <p className="text-[12px] text-slate-400 px-2 py-1">No documents available.</p>
            )}
          </div>
        </div>

        {/* Quick add */}
        {shipmentId ? (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-600 uppercase">Add New Document</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Tên</label>
                <select
                  value={newDocType}
                  onChange={e => setNewDocType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:ring-2 focus:ring-cyan-500/20"
                >
                  <option value="commercial_invoice">Commercial Invoice</option>
                  <option value="packing_list">Packing List</option>
                  <option value="sales_contract">Sales Contract</option>
                  <option value="co_form_e">CO Form E</option>
                  <option value="phytosanitary">Phytosanitary</option>
                  <option value="bill_of_lading">Bill of Lading</option>
                  <option value="import_document">Import Document</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">File</label>
                <input
                  type="text"
                  value={newDocNumber}
                  onChange={e => setNewDocNumber(e.target.value)}
                  placeholder="File"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>
            <button onClick={handleCreateDocument} disabled={isCreatingDocument || !newDocType}
              className="w-full py-2 rounded-lg bg-cyan-600 border border-cyan-700 text-white text-[12px] font-bold disabled:opacity-50 hover:bg-cyan-700 transition-colors shadow-sm">
              {isCreatingDocument ? 'Uploading...' : 'Add Document'}
            </button>
          </div>
        ) : (
          <p className="text-[12px] text-red-500 italic">Save Shipment before uploading documents.</p>
        )}
      </div>
    </section>
  );
};

export default DocumentsTab;
