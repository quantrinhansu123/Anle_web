import React, { useState, useEffect } from 'react';
import {
  Search, Plus, RefreshCcw, Edit, Trash2,
  ChevronLeft, BadgeDollarSign, Save, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exchangeRateService, type ExchangeRate } from '../services/exchangeRateService';
import { useToastContext } from '../contexts/ToastContext';

const ExchangeRatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // Add State
  const [isAdding, setIsAdding] = useState(false);
  const [newCurrency, setNewCurrency] = useState('');
  const [newRate, setNewRate] = useState<number>(0);

  const formatWithDots = (val: number | string) => {
    if (!val && val !== 0) return '';
    const num = typeof val === 'string' ? val.replace(/\D/g, '') : Math.round(val).toString();
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseDots = (val: string) => {
    return Number(val.replace(/\D/g, '')) || 0;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await exchangeRateService.getAll();
      setRates(data);
    } catch (err) {
      console.error('Failed to fetch exchange rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (rate: ExchangeRate) => {
    setEditingId(rate.id);
    setEditValue(rate.rate);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await exchangeRateService.update(id, editValue);
      setEditingId(null);
      fetchData();
      success('Exchange rate updated successfully');
    } catch (err) {
      error('Failed to update rate');
    }
  };

  const handleAdd = async () => {
    if (!newCurrency || newRate <= 0) {
      error('Please enter valid currency code and rate');
      return;
    }
    try {
      await exchangeRateService.upsert({ currency_code: newCurrency.toUpperCase(), rate: newRate });
      setIsAdding(false);
      setNewCurrency('');
      setNewRate(0);
      fetchData();
      success('Exchange rate added successfully');
    } catch (err) {
      error('Failed to add rate');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exchange rate?')) return;
    try {
      await exchangeRateService.delete(id);
      fetchData();
      success('Exchange rate deleted successfully');
    } catch (err) {
      error('Failed to delete rate');
    }
  };

  const filteredRates = rates.filter(r =>
    r.currency_code.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-sm border border-amber-500/20">
          <BadgeDollarSign size={28} />
        </div>
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground uppercase tracking-tight">
            <span className="text-amber-600 text-xl">Setting</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Exchange Rates</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => navigate('/system')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"
              >
                <ChevronLeft size={16} />Back
              </button>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="Search currency..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="p-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 text-white rounded-xl text-[13px] font-bold shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-all font-inter"
              >
                <Plus size={16} />
                Add Currency
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto border-t border-border bg-slate-50/20">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-b border-border/40 w-16">Actions</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-b border-border/40">Loại tiền</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-b border-border/40">Tỷ giá (VNĐ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white font-inter">
              {isAdding && (
                <tr className="bg-amber-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={handleAdd} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"><Save size={14} /></button>
                      <button onClick={() => setIsAdding(false)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><X size={14} /></button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      placeholder="USD, EUR..."
                      className="w-24 px-2 py-1 bg-white border border-border rounded-md text-[13px] font-bold focus:ring-1 focus:ring-amber-500 outline-none"
                      value={newCurrency}
                      onChange={(e) => setNewCurrency(e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      placeholder="0"
                      className="w-32 px-2 py-1 bg-white border border-border rounded-md text-[13px] font-bold focus:ring-1 focus:ring-amber-500 outline-none"
                      value={formatWithDots(newRate)}
                      onChange={(e) => setNewRate(parseDots(e.target.value))}
                    />
                  </td>
                </tr>
              )}
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={3} className="px-6 py-8 border-b border-border/40"></td>
                  </tr>
                ))
              ) : filteredRates.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center italic text-muted-foreground opacity-60">No exchange rates defined.</td>
                </tr>
              ) : (
                filteredRates.map(rate => (
                  <tr key={rate.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      {editingId === rate.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleSaveEdit(rate.id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><Save size={14} /></button>
                          <button onClick={handleCancelEdit} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(rate)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(rate.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-bold text-foreground">{rate.currency_code}</span>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === rate.id ? (
                        <input
                          type="text"
                          className="w-32 px-2 py-1 bg-white border border-amber-500 rounded-md text-[14px] font-bold focus:ring-2 focus:ring-amber-500/20 outline-none shadow-sm"
                          value={formatWithDots(editValue)}
                          onChange={(e) => setEditValue(parseDots(e.target.value))}
                          autoFocus
                        />
                      ) : (
                        <span className="text-[14px] font-bold text-slate-700 tabular-nums">
                          {rate.rate.toLocaleString('vi-VN')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-[12px] font-medium text-slate-500">
            Total currencies: <b>{filteredRates.length}</b>
          </span>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 italic">
            All rates are relative to 1 unit of the currency to VNĐ.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRatesPage;
