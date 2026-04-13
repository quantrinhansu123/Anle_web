import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomNav from './MobileBottomNav';
import { clsx } from 'clsx';

/** Sales editor routes: fullscreen on small screens (no app top bar / bottom nav). */
export function isSalesEditorImmersiveMobileRoute(pathname: string): boolean {
  const p = pathname.split('/').filter(Boolean);
  if (p[0] !== 'financials' || p[1] !== 'sales') return false;
  if (p.length === 3) {
    if (p[2] === 'new') return true;
    if (p[2] === 'quotation') return false;
    return true;
  }
  if (p.length === 4 && p[3] === 'edit' && p[2] !== 'quotation') return true;
  return false;
}

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const immersiveMobile = isSalesEditorImmersiveMobileRoute(pathname);

  return (
    <div className="flex h-full min-h-0 w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div 
        className={clsx(
          /* min-h-0: allow flex child <main> to shrink so overflow-y-auto scrolls inside layout only (no double body + main scrollbars). */
          "flex min-h-0 min-w-0 w-full flex-1 flex-col transition-all duration-300 print:ml-0",
          sidebarOpen ? "lg:ml-64" : "lg:ml-[72px]"
        )}
      >
        <div className={clsx('shrink-0', immersiveMobile && 'hidden md:block')}>
          <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        {/* Scrollable Content */}
        <main
          className={clsx(
            'min-h-0 flex-1 custom-scrollbar overscroll-y-contain print:p-0 print:overflow-visible',
            immersiveMobile
              ? 'flex flex-col overflow-hidden p-0 md:overflow-y-auto md:p-4 lg:p-6 md:pb-6'
              : 'overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6',
          )}
        >
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        {!immersiveMobile && <MobileBottomNav />}
      </div>
    </div>
  );
};

export default MainLayout;
