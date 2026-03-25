import React from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, 
  ShieldCheck, Camera, Key, Fingerprint, Globe, 
  Heart, GraduationCap, Landmark, Shield, Info,
  IdCard, UserCircle, BriefcaseIcon, MapPinIcon,
  HeartIcon, GraduationCapIcon, WalletIcon, ShieldCheckIcon,
  ClockIcon, Users, X, Edit, Trash2, Save
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const ProfilePage: React.FC = () => {
  const { avatar, setAvatar } = useTheme();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAvatar = "https://ui-avatars.com/api/?name=Admin&background=random&color=random&size=128";
  const displayAvatar = avatar || defaultAvatar;

  // Initialize preview avatar when modal opens
  useEffect(() => {
    if (isAvatarModalOpen) {
      setPreviewAvatar(avatar || null);
    }
  }, [isAvatarModalOpen, avatar]);

  // Close modal when clicking escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAvatarModalOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsAvatarModalOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = () => {
    if (previewAvatar !== null) {
      setAvatar(previewAvatar);
    } else {
      setAvatar(''); // If cleared
    }
    setIsAvatarModalOpen(false);
  };

  const handleRemoveAvatar = () => {
    setPreviewAvatar(null);
  };

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10 space-y-4 -mt-2">
        {/* Header */}
        <div className="flex items-center gap-4 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
            <UserCircle size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">User Profile</h1>
            <p className="text-muted-foreground text-xs">Manage your account information and preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Sidebar Profile (Sticky) */}
          <div className="lg:col-span-3">
            <div className="sticky top-0 self-start space-y-6">
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
                <div className="px-6 pb-6 -mt-10 flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-card bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden shadow-md">
                      <img 
                        src={displayAvatar} 
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-card shadow-sm" />
                  </div>

                  <div className="mt-4 text-center">
                    <h2 className="text-xl font-bold text-foreground">Administrator</h2>
                    <div className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                      System Admin
                    </div>
                  </div>

                  <div className="w-full mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail size={16} className="text-primary/60 shrink-0" />
                      <span className="truncate">admin@anlelogistics.com</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone size={16} className="text-primary/60 shrink-0" />
                      <span>+84 (0) 900 000 000</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Briefcase size={16} className="text-primary/60 shrink-0" />
                      <span>Management & IT</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Globe size={16} className="text-primary/60 shrink-0" />
                      <span>Anle Logistics HQ</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Calendar size={16} className="text-primary/60 shrink-0" />
                      <span>Joined Jan 2019</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-emerald-500 font-medium">
                      <ShieldCheck size={16} className="shrink-0" />
                      <span>Verified Account</span>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-3 mt-8">
                    <button 
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shadow-sm">
                        <Camera size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground italic">Change Photo</span>
                    </button>
                    <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shadow-sm">
                        <Key size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground italic">Security</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Information Sections */}
          <div className="lg:col-span-9 space-y-6">
            {/* Section 1: Personal Info */}
            <SectionContainer icon={UserCircle} title="PERSONAL INFORMATION">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoItem icon={User} label="Full Name" value="Administrator" />
                <InfoItem icon={Calendar} label="Date of Birth" value="Not updated" />
                <InfoItem icon={Fingerprint} label="Gender" value="Male" badge="Male" />
                <InfoItem icon={IdCard} label="ID Number" value="Not updated" />
                <InfoItem icon={Calendar} label="Date of Issue" value="Not updated" />
                <InfoItem icon={MapPin} label="Place of Issue" value="Not updated" />
                <InfoItem icon={Globe} label="Nationality" value="International" />
                <InfoItem icon={User} label="Ethnicity" value="Not updated" />
                <InfoItem icon={Info} label="Religion" value="Not updated" />
              </div>
            </SectionContainer>

            {/* Section 2: Work Info */}
            <SectionContainer icon={BriefcaseIcon} title="WORK INFORMATION">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoItem icon={Fingerprint} label="Employee ID" value="ADM-001" highlight />
                <InfoItem icon={Briefcase} label="Official Role" value="Logistics Manager" highlight />
                <InfoItem icon={Briefcase} label="Department" value="Operations & IT" highlight />
                <InfoItem icon={User} label="Grade" value="Not updated" />
                <InfoItem icon={Calendar} label="Joining Date" value="10/01/2019" />
                <InfoItem icon={ClockIcon} label="Seniority" value="7 years 2 months" />
                <InfoItem icon={FileText} label="Contract Type" value="Permanent" />
                <InfoItem icon={Calendar} label="Contract Expiry" value="N/A" />
                <InfoItem icon={MapPin} label="Work Location" value="Headquarters" />
              </div>
            </SectionContainer>

            {/* Section 3: Contact Info */}
            <SectionContainer icon={Mail} title="CONTACT INFORMATION">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoItem icon={Mail} label="Work Email" value="admin@anlelogistics.com" highlight />
                <InfoItem icon={Mail} label="Personal Email" value="Not updated" />
                <InfoItem icon={Phone} label="Mobile Phone" value="+84 900 000 000" highlight />
                <InfoItem icon={User} label="Emergency Contact" value="Not updated" />
                <InfoItem icon={Phone} label="Emergency Phone" value="Not updated" />
                <InfoItem icon={Heart} label="Relationship" value="Not updated" />
              </div>
              
              <div className="mt-8 pt-8 border-t border-border/50">
                <div className="flex items-center gap-2 mb-6">
                  <MapPinIcon size={16} className="text-primary" />
                  <h4 className="text-[12px] font-bold text-foreground">ADDRESS DETAILS</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoItem icon={MapPin} label="City / Province" value="Not updated" />
                  <InfoItem icon={MapPin} label="District" value="Not updated" />
                  <InfoItem icon={MapPin} label="Ward / Commune" value="Not updated" />
                  <InfoItem icon={MapPin} label="Primary Address" value="Not updated" />
                  <InfoItem icon={MapPin} label="Temporary Address" value="Not updated" cols={2} />
                </div>
              </div>
            </SectionContainer>

            {/* Section 4: Family & Education */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionContainer icon={HeartIcon} title="MARITAL & FAMILY">
                <div className="grid grid-cols-1 gap-6">
                  <InfoItem icon={Heart} label="Marital Status" value="Not updated" />
                  <InfoItem icon={Users} label="Dependents" value="0" />
                </div>
              </SectionContainer>

              <SectionContainer icon={GraduationCapIcon} title="EDUCATION & CERTIFICATES">
                <div className="grid grid-cols-1 gap-6">
                  <InfoItem icon={GraduationCap} label="Highest Degree" value="Not updated" />
                  <InfoItem icon={Briefcase} label="Major" value="Logistics" />
                  <InfoItem icon={Landmark} label="University" value="Not updated" />
                  <InfoItem icon={Calendar} label="Graduation Year" value="Not updated" />
                  <InfoItem icon={Shield} label="Certifications" value="Not updated" />
                </div>
              </SectionContainer>
            </div>

            {/* Section 5: Finance & Insurance */}
            <SectionContainer icon={WalletIcon} title="FINANCE & BANKING">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoItem icon={Landmark} label="Bank Account" value="Not updated" />
                <InfoItem icon={Landmark} label="Bank Name" value="Not updated" />
                <InfoItem icon={MapPin} label="Branch" value="Not updated" />
                <InfoItem icon={Fingerprint} label="Personal Tax ID" value="Not updated" />
              </div>

              <div className="mt-8 pt-8 border-t border-border/50">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheckIcon size={16} className="text-primary" />
                  <h4 className="text-[12px] font-bold text-foreground">INSURANCE</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoItem icon={Shield} label="Social Insurance" value="Not updated" />
                  <InfoItem icon={Shield} label="Health Insurance" value="Not updated" />
                  <InfoItem icon={Calendar} label="Enrollment Date" value="Not updated" />
                  <InfoItem icon={MapPin} label="Provider/Clinic" value="Not updated" />
                </div>
              </div>
            </SectionContainer>

            {/* Section 6: System Info */}
            <SectionContainer icon={Info} title="SYSTEM INFORMATION">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoItem icon={Calendar} label="Created Date" value="10/01/2019" />
                <InfoItem icon={User} label="Created By" value="system" />
                <InfoItem icon={Calendar} label="Last Updated" value="15/01/2025" />
                <InfoItem icon={User} label="Updated By" value="system" />
              </div>
            </SectionContainer>
          </div>
        </div>
      </div>

      {/* Change Avatar Modal - Moved outside to ensure fixed positioning relative to viewport */}
      {isAvatarModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleBackdropClick}
        >
          <div 
            ref={modalRef}
            className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="text-base font-bold text-foreground">Update Profile Photo</h3>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 flex flex-col items-center space-y-8">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <div className="relative">
                <div className="w-48 h-48 rounded-full border-4 border-card bg-primary/10 flex items-center justify-center text-6xl font-bold text-primary overflow-hidden shadow-inner">
                  <img 
                    src={previewAvatar || defaultAvatar} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-primary hover:underline transition-all text-sm font-bold"
                >
                  <Edit size={16} />
                  <span>Choose Photo</span>
                </button>
                <div className="w-[1px] h-4 bg-border" />
                <button 
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-2 text-red-500 hover:underline transition-all text-sm font-bold"
                >
                  <Trash2 size={16} />
                  <span>Remove</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted border border-border transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAvatar}
                className="px-8 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// UI Components
const SectionContainer: React.FC<{ icon: React.ElementType, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
        <Icon size={16} />
      </div>
      <h3 className="text-[13px] font-bold text-foreground tracking-tight">{title}</h3>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const InfoItem: React.FC<{ 
  icon: React.ElementType, 
  label: string, 
  value: string, 
  highlight?: boolean,
  badge?: string,
  cols?: number
}> = ({ icon: Icon, label, value, highlight, badge, cols = 1 }) => (
  <div className={clsx("space-y-1.5", cols === 2 && "md:col-span-2")}>
    <div className="flex items-center gap-1.5 text-muted-foreground/70">
      <Icon size={12} strokeWidth={2} />
      <p className="text-[11px] font-bold uppercase tracking-wider">{label}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className={clsx(
        "text-[14px]",
        highlight ? "font-bold text-foreground" : (value === "Not updated" || value === "N/A" ? "text-muted-foreground/40 italic" : "font-medium text-foreground")
      )}>
        {value}
      </span>
      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
          {badge}
        </span>
      )}
    </div>
  </div>
);

const FileText = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

export default ProfilePage;
