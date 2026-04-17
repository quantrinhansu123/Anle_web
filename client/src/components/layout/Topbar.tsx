import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Calendar, Home, PanelLeft, 
  PanelLeftClose, User, Settings, LogOut, ChevronDown 
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { sidebarMenu, extraMenuItems } from '../../data/sidebarMenu';
import { moduleData } from '../../data/moduleData';
import { clsx } from 'clsx';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import NotificationBell from '../NotificationBell';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Topbar: React.FC<TopbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [time, setTime] = useState(new Date());
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { avatar } = useTheme();
  const { dynamicTitle, customBreadcrumbs } = useBreadcrumb();
  const { user, logout } = useAuth();

  const defaultAvatar = "https://ui-avatars.com/api/?name=Admin&background=random&color=random";
  const userAvatar = user?.avatar_url || avatar || defaultAvatar;

  // Enhanced breadcrumb logic
  const getLabel = (path: string) => {
    // Check specific module items in moduleData first
    for (const mainPath in moduleData) {
      for (const section of moduleData[mainPath]) {
        const found = section.items.find((item: any) => item.path === path);
        if (found) return found.title;
      }
    }
    
    // Check sidebar and extra menu items
    const menuItems = [...sidebarMenu, ...extraMenuItems, { path: '/profile', label: 'User Profile' }];
    const found = menuItems.find(item => item.path === path);
    if (found) return found.label;
    
    // Fallback labels for segments
    const segmentLabels: Record<string, string> = {
      'shipping': 'Shipping',
      'shipments': 'Shipments',
      'customers': 'Customers',
      'suppliers': 'Suppliers',
      'employees': 'Employees',
      'financials': 'Financials',
      'contracts': 'Contracts',
      'system': 'System',
      'candidates': 'Candidates',
      'ai-assistant': 'AI Assistant',
      'settings': 'Settings',
      'profile': 'Profile',
      'sea-house-bl': 'Sea House B/L',
      reports: 'Reports',
      'job-profit-by-performance-date': 'Job Profit by Performance Date',
      inventory: 'Inventory',
      overview: 'Overview',
      stock: 'Stock on hand',
    };
    
    // Check for dynamic breadcrumb override from global state/window
    const dynamicLabels = (window as any).breadcrumbOverrides || {};
    if (dynamicLabels[path]) return dynamicLabels[path];

    const segment = path.split('/').pop() || '';
    
    // If segment is a UUID, try to return better label
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(segment) && dynamicTitle) {
      return dynamicTitle;
    }

    return segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getBreadcrumbs = () => {
    const fullPath = location.pathname;
    const segments = fullPath.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    const b: { path: string; label: string }[] = [];

    // 1. Detect Parent Module (Order, Internal, Accountant, System)
    let parentModulePath: string | null = null;
    let currentPageItem: any = null;

    for (const mPath in moduleData) {
      for (const section of moduleData[mPath]) {
        // Find best matching item (longest path match)
        const matchedItem = section.items
          .filter(item => item.path && fullPath.startsWith(item.path))
          .sort((a: any, b: any) => (b.path?.length || 0) - (a.path?.length || 0))[0];
        
        if (matchedItem) {
          parentModulePath = mPath;
          currentPageItem = matchedItem;
          break;
        }
      }
      if (parentModulePath) break;
    }

    // 2. Add Module as First Breadcrumb
    if (parentModulePath) {
      const moduleItem = sidebarMenu.find(m => m.path === parentModulePath);
      if (moduleItem) {
        b.push({ path: parentModulePath, label: moduleItem.label });
      }
    }

    // 3. Add anchored page from moduleData
    if (currentPageItem && currentPageItem.path) {
      b.push({ path: currentPageItem.path, label: currentPageItem.title });

      // 4. Add remaining dynamic segments
      const remainingPath = fullPath.substring(currentPageItem.path.length);
      const dynamicSegments = remainingPath.split('/').filter(Boolean);
      let p = currentPageItem.path;
      dynamicSegments.forEach(seg => {
        p += `/${seg}`;
        b.push({ path: p, label: getLabel(p) });
      });
    } else {
      // 5. Fallback for pages not in moduleData
      segments.forEach((_, idx) => {
        const subPath = `/${segments.slice(0, idx + 1).join('/')}`;
        if (subPath === parentModulePath) return;
        const label = getLabel(subPath);
        if (b.length > 0 && label === b[b.length - 1].label) return;
        b.push({ path: subPath, label });
      });
    }

    return b;
  };

  const breadcrumbs =
    customBreadcrumbs && customBreadcrumbs.length > 0 ? customBreadcrumbs : getBreadcrumbs();

  const pageTitle = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Dashboard';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <header className="h-[55px] bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 z-30 sticky top-0 print:hidden">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-2 lg:gap-2.5">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-muted-foreground hover:bg-muted border border-border rounded-lg bg-card shadow-sm transition-colors shrink-0"
        >
          {sidebarOpen ? <PanelLeftClose size={12} /> : <PanelLeft size={12} />}
        </button>

        <div className="hidden sm:flex items-center gap-2 lg:gap-2.5">
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
            <Home size={14} strokeWidth={2} />
          </Link>

          <span className="text-muted-foreground/40 font-light">
            <svg width="5" height="8" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 9L5 5L1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          <Link to="/" className="text-muted-foreground text-[13px] font-medium hover:text-primary transition-colors">
            Home
          </Link>

          {breadcrumbs.map((crumb: { path: string; label: string }, idx: number) => (
            <React.Fragment key={crumb.path}>
              <span className="text-muted-foreground/40 font-light">
                <svg width="5" height="8" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 9L5 5L1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {idx === breadcrumbs.length - 1 ? (
                <div className="flex items-center bg-primary text-white px-1.5 py-0.5 rounded-lg text-[12px] font-bold shadow-sm ring-1 ring-primary/20">
                  {crumb.label}
                </div>
              ) : (
                <Link to={crumb.path} className="text-muted-foreground text-[13px] font-medium hover:text-primary transition-colors">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="sm:hidden font-semibold text-foreground text-sm">
          {pageTitle}
        </div>
      </div>

      {/* Right side: Clock, Notifications, User */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Clock & Date (Hidden on mobile) */}
        <div className="hidden md:flex items-center bg-card border border-border shadow-sm px-4 py-1.5 rounded-full gap-3 text-[13px]">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            <span className="font-bold text-foreground tabular-nums">{formatTime(time)}</span>
          </div>
          <div className="w-[1px] h-4 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={16} className="text-primary" />
            <span className="font-medium whitespace-nowrap">{formatDate(time)}</span>
          </div>
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile */}
        <div className="relative" ref={userDropdownRef}>
          <div 
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
            }}
            className={clsx(
              "flex items-center gap-3 pl-2 sm:pl-4 sm:border-l border-border cursor-pointer group transition-all duration-200",
              showUserDropdown && "opacity-80"
            )}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shadow-sm shadow-primary/5">
                <img 
                  src={userAvatar} 
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card shadow-sm shadow-emerald-500/50"></div>
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-bold leading-tight text-foreground group-hover:text-primary transition-colors">{user?.full_name || 'Administrator'}</span>
                <ChevronDown size={12} className={clsx("text-muted-foreground transition-transform duration-200", showUserDropdown && "rotate-180")} />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight font-medium">{user?.position ? `${user.position} ${user.department ? ` • ${user.department}` : ''}` : 'Anle Logistics Admin'}</span>
            </div>
          </div>

          {/* User Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="p-1.5 space-y-0.5">
                <button 
                  onClick={() => {
                    navigate('/profile');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/70">
                    <User size={18} />
                  </div>
                  <span className="text-[13px] font-semibold">My Profile</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigate('/settings');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/70">
                    <Settings size={18} />
                  </div>
                  <span className="text-[13px] font-semibold">Settings</span>
                </button>

                <div className="my-1 border-t border-border/50" />

                <button 
                   onClick={() => {
                    logout();
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center">
                    <LogOut size={18} />
                  </div>
                  <span className="text-[13px] font-bold">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
