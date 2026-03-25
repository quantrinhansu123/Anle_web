import React, { useState } from 'react';
import { ActionCard } from '../components/ui/ActionCard';
import type { ActionCardProps } from '../components/ui/ActionCard';
import {
  Package, Users, BadgeDollarSign, Settings,
  Copyright, Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { moduleData, getDirectPath } from '../data/moduleData';
import { ModuleCard } from '../components/ui/ModuleCard';
import { useBookmarks } from '../hooks/useBookmarks';

const dashboardModules: ActionCardProps[] = [
  {
    icon: Package,
    title: 'Order',
    description: 'Shipments, Sales, Purchasing, and Contracts.',
    href: '/order',
    colorScheme: 'blue'
  },
  {
    icon: Users,
    title: 'Internal',
    description: 'Employees, Customers, and Suppliers.',
    href: '/internal',
    colorScheme: 'indigo'
  },
  {
    icon: BadgeDollarSign,
    title: 'Accountant',
    description: 'Debit Notes, Payment Requests, and Settings.',
    href: '/accountant',
    colorScheme: 'emerald'
  },
  {
    icon: Settings,
    title: 'System',
    description: 'System settings, security, and configuration.',
    href: '/system',
    colorScheme: 'slate' as any
  },
  {
    icon: Copyright,
    title: 'Copyright',
    description: 'Intellectual property and developer info.',
    href: '/copyright',
    colorScheme: 'blue'
  }
];

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'modules' | 'bookmarks' | 'all'>('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const { isBookmarked } = useBookmarks();



  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2 text-foreground">
          Welcome back, <span className="text-primary">Admin</span> 👋
        </h1>
      </div>

      <div className={clsx(
        "bg-card rounded-xl shadow-sm border border-border p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 lg:mb-8 transition-all duration-300",
        activeTab === 'all' ? "w-full" : "max-w-fit"
      )}>
        <div className="flex bg-muted/20 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setActiveTab('modules')}
            className={clsx(
              "px-4 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200",
              activeTab === 'modules'
                ? "bg-card text-primary shadow-sm ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Modules
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={clsx(
              "px-4 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200",
              activeTab === 'bookmarks'
                ? "bg-card text-primary shadow-sm ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Bookmarks
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={clsx(
              "px-4 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200",
              activeTab === 'all'
                ? "bg-card text-primary shadow-sm ring-1 ring-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Functions
          </button>
        </div>

        {/* Search Bar (Only shown on "All Functions" tab) */}
        {activeTab === 'all' && (
          <div className="flex-1 flex items-center bg-muted/20 rounded-lg px-3 py-1.5 animate-in slide-in-from-left-2 duration-300">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search modules, functions..."
              className="bg-transparent border-none outline-none text-[13px] text-foreground w-full ml-2 placeholder:text-muted-foreground/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {activeTab === 'modules' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-5">
          {dashboardModules.map((module, idx) => (
            <ActionCard
              key={idx}
              {...module}
              href={getDirectPath(module.href)}
            />
          ))}
        </div>
      )}

      {activeTab === 'bookmarks' && (() => {
        const allItems = Object.values(moduleData).flatMap(sections => sections.flatMap(s => s.items));
        const bookmarkedItems = allItems.filter(item => item.path && isBookmarked(item.path));

        if (bookmarkedItems.length === 0) {
          return (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border border-dashed">
              No items bookmarked yet. Start by clicking the star icon on any module.
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-in fade-in duration-500">
            {bookmarkedItems.map((item, idx) => (
              <ModuleCard key={idx} {...item} />
            ))}
          </div>
        );
      })()}

      {activeTab === 'all' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="space-y-8">
            {(() => {
              // Merge sections with the same name
              const sectionMap: Record<string, any[]> = {};
              Object.values(moduleData).flat().forEach(section => {
                if (!sectionMap[section.section]) {
                  sectionMap[section.section] = [];
                }
                sectionMap[section.section].push(...section.items);
              });

              // Specific order: Accountant, Internal, Order, System
              const orderedNames = ['Order', 'Internal', 'Accountant', 'System'];

              const sortedNames = Object.keys(sectionMap).sort((a, b) => {
                const idxA = orderedNames.indexOf(a);
                const idxB = orderedNames.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
              });

              return sortedNames.map((sectionName, idx) => {
                const items = sectionMap[sectionName];
                const filteredItems = items.filter(item =>
                  item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.description.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredItems.length === 0) return null;

                return (
                  <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                    <h2 className="text-[14px] font-bold text-primary mb-4 flex items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                        <span>{sectionName}</span>
                      </div>
                      <div className="h-px flex-1 bg-border/60"></div>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {filteredItems.map((item, itemIdx) => (
                        <ModuleCard key={itemIdx} {...item} />
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
