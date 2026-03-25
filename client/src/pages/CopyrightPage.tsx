import React, { useEffect, useState } from 'react';
import { Copyright, Globe, Facebook, Users, MessageCircle, Video, Mail, Phone, ShieldCheck, Building2, ChevronRight, Loader2 } from 'lucide-react';
import type { SystemSettings } from '../types/systemSettings';
import { systemSettingsService } from '../services/systemSettingsService';

const CopyrightPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await systemSettingsService.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to fetch copyright info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading intellectual property info...</p>
      </div>
    );
  }

  // Fallback defaults if DB is empty
  const data: SystemSettings = settings || {
    id: '00000000-0000-0000-0000-000000000000',
    company_name: 'ANLE LOGISTICS TECHNOLOGY SOLUTIONS LTD.',
    representative: 'Mr. An Le',
    tax_code: '0123456789',
    address: 'Innovation Building, Ben Nghe Ward, District 1, Ho Chi Minh City, Vietnam',
    version: 'v2.4.0 (Stable)',
    license_date: '2024-01-01',
    website: 'https://anlelogistics.com',
    facebook: 'https://facebook.com/anlelogistics',
    community_group: 'https://facebook.com/groups/anlecommunity',
    zalo: 'https://zalo.me/anlegroup',
    tiktok: 'https://tiktok.com/@anlelogistics',
    tech_support_name: 'Mr. Tech Support',
    tech_support_role: 'Head of Technology',
    tech_support_phone: '+84 901 234 567',
    tech_support_email: 'support@anlelogistics.com',
    business_support_name: 'Ms. Business Sales',
    business_support_role: 'Sales Director',
    business_support_phone: '+84 909 876 543',
    business_support_email: 'sales@anlelogistics.com',
    logo_url: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {data.logo_url ? (
          <div className="w-16 h-16 rounded-full bg-white shadow-lg border border-border/50 flex items-center justify-center p-2.5 shrink-0 overflow-hidden group hover:scale-105 transition-transform duration-300">
            <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0 group hover:scale-105 transition-transform duration-300">
            <Copyright size={32} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Copyright Information</h1>
          <p className="text-muted-foreground text-sm">Intellectual property management and developer information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Developer Info */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              <h2 className="text-[13px] font-bold text-primary uppercase tracking-wider">Development & Operations</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Company / Organization</h3>
                  <p className="text-lg font-bold text-foreground">{data.company_name}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Representative</h3>
                    <p className="text-[14px] font-semibold text-foreground">{data.representative}</p>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tax Code</h3>
                    <p className="text-[14px] font-semibold text-foreground">{data.tax_code}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Headquarters</h3>
                  <p className="text-[14px] text-foreground leading-relaxed">
                    {data.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Permissions & Security */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              <h2 className="text-[13px] font-bold text-primary uppercase tracking-wider">Permissions & Security</h2>
            </div>
            <div className="p-6">
              <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
                This software, including all source code, interface designs, and databases, is the sole intellectual property of {data.company_name.split(' ')[0]} Logistics Solutions. 
                Any act of copying, modifying, or redistributing without written consent is a violation of international copyright laws.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-[14px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Current Version:</span>
                  <span className="font-bold text-foreground">{data.version}</span>
                </li>
                <li className="flex items-center gap-2 text-[14px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">License Date:</span>
                  <span className="font-bold text-foreground">
                    {new Date(data.license_date!).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </span>
                </li>
                <li className="flex items-center gap-2 text-[14px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[12px]">Registered at the Intellectual Property Office</span>
                </li>
              </ul>

              <p className="text-[11px] text-muted-foreground/60 italic border-t border-border pt-4">
                © 2024 - {new Date().getFullYear()} Copyright by {data.company_name.split(' ')[0]} Logistics. Protected by international digital copyright protection systems.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Social Links */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="text-[13px] font-bold text-foreground uppercase tracking-wider mb-4">Community Links</h2>
            <div className="space-y-2">
              {[
                { icon: Globe, label: 'Official Website', url: data.website },
                { icon: Facebook, label: 'Facebook Fanpage', url: data.facebook },
                { icon: Users, label: 'Community Group', url: data.community_group },
                { icon: MessageCircle, label: 'Zalo Community', url: data.zalo },
                { icon: Video, label: 'TikTok Channel', url: data.tiktok },
              ].map((item, idx) => (
                <a 
                  key={idx} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[13px] font-medium text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/50" />
                </a>
              ))}
            </div>
          </div>

          {/* Technical Support */}
          <ContactCard 
            title="Technical Support"
            name={data.tech_support_name!}
            role={data.tech_support_role!}
            phone={data.tech_support_phone!}
            email={data.tech_support_email!}
          />

          {/* Business Contact */}
          <ContactCard 
            title="Business Inquiry"
            name={data.business_support_name!}
            role={data.business_support_role!}
            phone={data.business_support_phone!}
            email={data.business_support_email!}
          />
        </div>
      </div>
    </div>
  );
};

const ContactCard = ({ title, name, role, phone, email }: { title: string, name: string, role: string, phone: string, email: string }) => (
  <div className="bg-primary rounded-2xl p-5 text-white shadow-lg shadow-primary/20">
    <h2 className="text-[15px] font-bold mb-1">{title}</h2>
    <div className="mb-4">
      <p className="text-[14px] font-bold">{name}</p>
      <p className="text-[12px] text-white/70">{role}</p>
    </div>
    <div className="space-y-0.5 mb-5 text-[12px] text-white/80 font-medium">
      <p>Phone: {phone}</p>
      <p>Email: {email}</p>
    </div>
    <div className="space-y-2">
      <a 
        href={`mailto:${email}`}
        className="w-full py-2 bg-white text-primary text-[13px] font-bold rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
      >
        <Mail size={16} />
        Email
      </a>
      <a 
        href={`tel:${phone}`}
        className="w-full py-2 bg-white/20 text-white text-[13px] font-bold rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2 border border-white/20"
      >
        <Phone size={16} />
        Call Now
      </a>
    </div>
  </div>
);

export default CopyrightPage;

