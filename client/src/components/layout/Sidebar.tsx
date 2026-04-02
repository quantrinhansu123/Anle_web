import React from 'react';
import { NavLink } from 'react-router-dom';
import { sidebarMenu, extraMenuItems } from '../../data/sidebarMenu';
import type { SidebarItem } from '../../data/sidebarMenu';
import { clsx } from 'clsx';
import { Loader2, Building2 } from 'lucide-react';
import { getDirectPath } from '../../data/moduleData';
import { systemSettingsService } from '../../services/systemSettingsService';
import type { SystemSettings } from '../../types/systemSettings';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [settings, setSettings] = React.useState<SystemSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await systemSettingsService.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to fetch sidebar info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const companyLogo = settings?.logo_url;
  const companyName = settings?.company_name || 'Anle Logistics';

  return (
    <>
      {/* Overlay - visible whenever sidebar is open ON MOBILE */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 bg-card border-r border-border transition-all duration-300 flex flex-col h-full print:hidden overflow-x-hidden w-64",
          isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0 lg:w-[72px]"
        )}
      >
        {/* Header / Logo */}
        <div className={clsx(
          "h-[65px] flex items-center border-b border-border shrink-0 transition-all duration-300",
          isOpen ? "px-4" : "px-[14px]"
        )}>
          {loading ? (
             <div className={clsx(
              "rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-all duration-300 animate-pulse",
              isOpen ? "w-10 h-10" : "w-11 h-11"
            )}>
              <Loader2 size={isOpen ? 20 : 24} className="animate-spin text-primary/40" />
            </div>
          ) : companyLogo ? (
            <img 
              src={companyLogo} 
              alt="Logo" 
              className={clsx(
                "rounded-xl object-contain shrink-0 transition-all duration-300 shadow-sm border border-border/50 bg-white",
                isOpen ? "w-10 h-10" : "w-11 h-11"
              )} 
            />
          ) : (
            <div className={clsx(
              "rounded-xl bg-primary text-white flex items-center justify-center shrink-0 transition-all duration-300 shadow-lg shadow-primary/20",
              isOpen ? "w-10 h-10" : "w-11 h-11"
            )}>
              <Building2 size={isOpen ? 22 : 26} />
            </div>
          )}
          <div className={clsx(
            "flex flex-col grow transition-all duration-300 transform origin-left overflow-hidden", 
            !isOpen ? "opacity-0 w-0 ml-0 -translate-x-4 pointer-events-none" : "opacity-100 w-auto ml-3 translate-x-0"
          )}>
            <span className="font-bold text-[14px] leading-tight text-foreground uppercase tracking-tight line-clamp-1 whitespace-nowrap">
              {companyName}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight font-medium whitespace-nowrap">Freight Forwarding CRM</span>
          </div>
        </div>
  
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2 custom-scrollbar flex flex-col items-stretch">
          {sidebarMenu.map((item) => (
            <NavItem 
              key={item.path} 
              item={{ ...item, path: getDirectPath(item.path) }} 
              isOpen={isOpen} 
              onClick={() => {
                if (window.innerWidth < 1024) setIsOpen(false);
              }} 
            />
          ))}
  
          <div className="my-4 border-t border-border w-full"></div>
  
          {extraMenuItems.map((item) => (
            <NavItem 
              key={item.path} 
              item={{ ...item, path: getDirectPath(item.path) }} 
              isOpen={isOpen} 
              onClick={() => {
                if (window.innerWidth < 1024) setIsOpen(false);
              }} 
            />
          ))}
        </nav>
      </aside>
    </>
  );
};

const NavItem = ({ item, onClick, isOpen }: { item: SidebarItem; onClick?: () => void; isOpen: boolean }) => {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap h-11 px-3 w-full justify-start',
          isActive
            ? 'bg-primary text-white shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )
      }
      title={!isOpen ? item.label : undefined}
    >
      <div className="flex items-center justify-center shrink-0 w-6 h-6 mr-3">
        <item.icon size={22} className={clsx("transition-transform duration-300", !isOpen && "mt-0.5")} strokeWidth={1.75} />
      </div>
      <span className={clsx(
        "transition-all duration-300 transform origin-left whitespace-nowrap overflow-hidden", 
        !isOpen ? "opacity-0 w-0 -translate-x-4 pointer-events-none" : "opacity-100 w-auto translate-x-0"
      )}>
        {item.label}
      </span>
    </NavLink>
  );
};

export default Sidebar;
