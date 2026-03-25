import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, Globe, Facebook, Users, MessageCircle, 
  Video, Phone, ShieldCheck, Upload, 
  Loader2 
} from 'lucide-react';
import type { SystemSettings } from '../../types/systemSettings';
import { apiFetch } from '../../lib/api';
import { systemSettingsService } from '../../services/systemSettingsService';
import { toast } from '../../lib/toast';

const CompanyInfoPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await systemSettingsService.getSettings();
      setSettings(data);
      if (data.logo_url) setLogoPreview(data.logo_url);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);

      let logoUrl = settings.logo_url;

      // Handle logo upload if new file selected
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        
        try {
          const uploadData = await apiFetch<{ url: string }>('/upload', {
            method: 'POST',
            body: formData
          });
          logoUrl = uploadData.url;
        } catch (err: any) {
          throw new Error(err.message || 'Logo upload failed');
        }
      }

      const updatedData = await systemSettingsService.updateSettings(settings.id, { 
        ...settings, 
        logo_url: logoUrl 
      });

      setSettings(updatedData);
      toast.success('Changes saved successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading system information...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
            <Building2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Company Information</h1>
            <p className="text-muted-foreground text-sm">Manage company profile, logos, and contact information for the system.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-[14px] font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              <h2 className="text-[14px] font-bold text-foreground">General Profile</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Company Name</label>
                  <input 
                    name="company_name"
                    value={settings?.company_name || ''}
                    onChange={handleChange}
                    className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Representative</label>
                  <input 
                    name="representative"
                    value={settings?.representative || ''}
                    onChange={handleChange}
                    className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Tax Code</label>
                  <input 
                    name="tax_code"
                    value={settings?.tax_code || ''}
                    onChange={handleChange}
                    className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Address / Headquarters</label>
                <textarea 
                  name="address"
                  value={settings?.address || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">System Version</label>
                  <input 
                    name="version"
                    value={settings?.version || ''}
                    onChange={handleChange}
                    className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">License Date</label>
                  <input 
                    type="date"
                    name="license_date"
                    value={settings?.license_date || ''}
                    onChange={handleChange}
                    className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              <h2 className="text-[14px] font-bold text-foreground">Socials & Community</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-muted-foreground flex items-center gap-2"><Globe size={14}/> Website</label>
                    <input 
                      name="website"
                      value={settings?.website || ''}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2 text-[14px] outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-muted-foreground flex items-center gap-2"><Facebook size={14}/> Facebook Fanpage</label>
                    <input 
                      name="facebook"
                      value={settings?.facebook || ''}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2 text-[14px] outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-muted-foreground flex items-center gap-2"><Users size={14}/> Community Group</label>
                    <input 
                      name="community_group"
                      value={settings?.community_group || ''}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2 text-[14px] outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-muted-foreground flex items-center gap-2"><MessageCircle size={14}/> Zalo Community</label>
                    <input 
                      name="zalo"
                      value={settings?.zalo || ''}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2 text-[14px] outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-muted-foreground flex items-center gap-2"><Video size={14}/> TikTok Channel</label>
                    <input 
                      name="tiktok"
                      value={settings?.tiktok || ''}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2 text-[14px] outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls (Logo, Contacts) */}
        <div className="space-y-6">
          {/* Logo Section */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-[14px] font-bold text-foreground mb-4 uppercase tracking-wider">Company Logo</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-border overflow-hidden bg-muted/30 flex items-center justify-center relative group">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <Building2 size={40} className="text-muted-foreground/30" />
                )}
                <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload size={20} />
                  <span className="text-[10px] font-bold mt-1">UPDATE</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Recommended: Square image, transparent background PNG.<br/>Max size: 2MB.
              </p>
            </div>
          </div>

          {/* Technical Support */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h2 className="text-[13px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16}/> Tech Support
            </h2>
            <div className="space-y-3">
              <input 
                name="tech_support_name"
                value={settings?.tech_support_name || ''}
                onChange={handleChange}
                placeholder="Name"
                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary transition-all"
              />
              <input 
                name="tech_support_role"
                value={settings?.tech_support_role || ''}
                onChange={handleChange}
                placeholder="Role"
                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary transition-all"
              />
              <input 
                name="tech_support_phone"
                value={settings?.tech_support_phone || ''}
                onChange={handleChange}
                placeholder="Phone"
                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary transition-all"
              />
              <input 
                name="tech_support_email"
                value={settings?.tech_support_email || ''}
                onChange={handleChange}
                placeholder="Email"
                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Business Support */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h2 className="text-[13px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-2">
              <Phone size={16}/> Business Inquiry
            </h2>
            <div className="space-y-3">
              <input 
                name="business_support_name"
                value={settings?.business_support_name || ''}
                onChange={handleChange}
                placeholder="Name"
                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary transition-all"
              />
              <input 
                name="business_support_role"
                value={settings?.business_support_role || ''}
                onChange={handleChange}
                placeholder="Role"
                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary transition-all"
              />
              <input 
                name="business_support_phone"
                value={settings?.business_support_phone || ''}
                onChange={handleChange}
                placeholder="Phone"
                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary transition-all"
              />
              <input 
                name="business_support_email"
                value={settings?.business_support_email || ''}
                onChange={handleChange}
                placeholder="Email"
                className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPage;
