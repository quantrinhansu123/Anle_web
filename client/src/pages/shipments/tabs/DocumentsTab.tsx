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
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  shipmentId, documents, newDocType, setNewDocType, newDocNumber, setNewDocNumber,
  isCreatingDocument, handleCreateDocument, handleChangeDocStatus, handleDeleteDoc, documentActionLoadingId
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
          <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Documents ({documents.length})</p>
          {documents.length === 0 ? (
            <p className="text-[12px] text-slate-400">No documents available.</p>
          ) : (
            <div className="space-y-1.5">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between gap-2 text-[12px]">
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
            </div>
          )}
        </div>

        {/* Quick add */}
        {shipmentId ? (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-600 uppercase">Add New Document</p>
            <div className="flex gap-2">
              <select value={newDocType} onChange={e => setNewDocType(e.target.value as any)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:ring-2 focus:ring-cyan-500/20">
                <option value="commercial_invoice">Commercial Invoice</option>
                <option value="packing_list">Packing List</option>
                <option value="sales_contract">Sales Contract</option>
                <option value="co_form_e">CO Form E</option>
                <option value="phytosanitary">Phytosanitary</option>
                <option value="bill_of_lading">Bill of Lading</option>
                <option value="import_document">Import Document</option>
              </select>
              <input type="text" value={newDocNumber} onChange={e => setNewDocNumber(e.target.value)} placeholder="Document number (optional)"
                className="w-[180px] px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:ring-2 focus:ring-cyan-500/20" />
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
