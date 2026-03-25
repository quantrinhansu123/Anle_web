import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, MapPin, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { Candidate, InterviewFormState } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode?: boolean;
  onClose: () => void;
  candidateId: string | null;
  candidatesData: Candidate[];
  ivForm: InterviewFormState;
  setIvField: <K extends keyof InterviewFormState>(key: K, value: InterviewFormState[K]) => void;
}

const AddEditInterviewDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode = false,
  onClose,
  candidateId,
  candidatesData,
  ivForm,
  setIvField,
}) => {
  if (!isOpen && !isClosing) return null;

  const candidate = candidatesData.find(c => c.id === candidateId);

  const {
    ivRound, ivStatus, ivDate, ivTime, ivFormat, ivLocation,
    ivEvalStatus, ivEvalScore, ivEvalComment, ivResult, ivNote,
  } = ivForm;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out',
          isClosing ? 'opacity-0' : 'animate-in fade-in duration-300',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          'relative w-full max-w-[750px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border',
          isClosing
            ? 'dialog-slide-out'
            : 'dialog-slide-in',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Calendar size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isEditMode ? 'Edit Interview Schedule' : 'Add Interview Schedule'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* INTERVIEW SESSION INFO */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Interview Session Info</span>
            </div>
            <div className="p-5 space-y-4">
              {/* Candidate */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Candidate <span className="text-red-500">*</span></label>
                <div className="w-full px-4 py-2.5 bg-muted/10 border border-border rounded-xl text-[13px] text-muted-foreground flex items-center justify-between">
                  <span>{candidate?.name} · {candidate?.positionId}</span>
                  <ChevronRight size={16} className="opacity-30" />
                </div>
              </div>

              {/* Round + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-foreground">Round <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={ivRound}
                    onChange={e => setIvField('ivRound', e.target.value)}
                    className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                    Status
                  </label>
                  <SearchableSelect
                    options={[
                      { value: 'waiting', label: 'Waiting' },
                      { value: 'done', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                    value={ivStatus}
                    onValueChange={(v: string) => setIvField('ivStatus', v)}
                    placeholder="Status"
                  />
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                    <Calendar size={13} className="text-muted-foreground/50" />
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={ivDate}
                    onChange={e => setIvField('ivDate', e.target.value)}
                    className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                    <span className="text-muted-foreground/50 text-[12px]">&#9719;</span>
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={ivTime}
                    onChange={e => setIvField('ivTime', e.target.value)}
                    className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              {/* Format */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Format <span className="text-red-500">*</span></label>
                <SearchableSelect
                  options={[
                    { value: 'direct', label: 'In-person' },
                    { value: 'online', label: 'Online' },
                    { value: 'phone', label: 'Phone' },
                  ]}
                  value={ivFormat}
                  onValueChange={(v: string) => setIvField('ivFormat', v)}
                  placeholder="Select format"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                  <MapPin size={13} className="text-muted-foreground/50" />
                  Location / Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ivLocation}
                  onChange={e => setIvField('ivLocation', e.target.value)}
                  placeholder="Location or meeting link"
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* EVALUATION */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
              <User size={16} className="text-primary" />
              <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Evaluation</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Evaluation Status</label>
                <SearchableSelect
                  options={[
                    { value: 'none', label: 'Not Evaluated' },
                    { value: 'pass', label: 'Pass' },
                    { value: 'fail', label: 'Fail' },
                    { value: 'pending', label: 'Under Review' },
                  ]}
                  value={ivEvalStatus}
                  onValueChange={(v: string) => setIvField('ivEvalStatus', v)}
                  placeholder="Not Evaluated"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Score / Criteria</label>
                <input
                  type="text"
                  value={ivEvalScore}
                  onChange={e => setIvField('ivEvalScore', e.target.value)}
                  placeholder="e.g. 8/10 or Meets requirements"
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Comments</label>
                <textarea
                  rows={4}
                  value={ivEvalComment}
                  onChange={e => setIvField('ivEvalComment', e.target.value)}
                  className="w-full px-4 py-3 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Result</label>
                <input
                  type="text"
                  value={ivResult}
                  onChange={e => setIvField('ivResult', e.target.value)}
                  placeholder="e.g. Passed, wait for Round 2"
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Notes</label>
                <textarea
                  rows={3}
                  value={ivNote}
                  onChange={e => setIvField('ivNote', e.target.value)}
                  className="w-full px-4 py-3 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-[13px] font-bold transition-all"
          >
            Cancel
          </button>
          <button className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group">
            <User size={16} />
            {isEditMode ? 'Save Changes' : 'Add New'}
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddEditInterviewDialog;
