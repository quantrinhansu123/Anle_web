import React, { useState } from 'react';
import { ActionCard } from '../components/ui/ActionCard';
import type { ActionCardProps } from '../components/ui/ActionCard';
import {
  Package, Users, BadgeDollarSign, Handshake,
  Search, Star, Truck
} from 'lucide-react';
import { clsx } from 'clsx';
import { moduleData, getDirectPath } from '../data/moduleData';
import { ModuleCard } from '../components/ui/ModuleCard';
import { useBookmarks } from '../hooks/useBookmarks';

const dashboardModules: ActionCardProps[] = [
  {
    icon: Truck,
    title: 'Logistics',
    description: 'FMS, Business Dashboard, Sales, jobs, payments, and debit notes.',
    href: '/shipping',
    colorScheme: 'blue'
  },
  {
    icon: Package,
    title: 'Trading',
    description: 'Logistics, Inventory, Fleet, and Trading.',
    href: '/operations',
    colorScheme: 'slate'
  },
  {
    icon: Handshake,
    title: 'CRM & Marketing',
    description: 'Customer relations, Website, and Marketing.',
    href: '/marketing',
    colorScheme: 'indigo'
  },
  {
    icon: Users,
    title: 'HR & Projects',
    description: 'Employees, Recruitment, Projects, and eLearning.',
    href: '/hr',
    colorScheme: 'emerald'
  },
  {
    icon: BadgeDollarSign,
    title: 'Finance',
    description: 'Invoicing, Expenses, and Accounting.',
    href: '/finance',
    colorScheme: 'amber'
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
        "bg-card rounded-xl shadow-sm border border-border p-1.5 flex flex-col items-stretch gap-3 mb-6 lg:mb-8 transition-all duration-300",
        activeTab === 'all' ? "w-full" : "w-full sm:max-w-fit"
      )}>
        <div className="grid grid-cols-3 bg-muted/20 rounded-lg p-0.5 shrink-0 w-full sm:max-w-fit">
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
            All <span className="hidden sm:inline">Functions</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-5">
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
            <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-muted-foreground bg-card rounded-2xl border border-border border-dashed animate-in fade-in zoom-in-95 duration-500">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Star size={24} className="text-muted-foreground/40" />
              </div>
              <p className="max-w-[280px] mx-auto text-[13px] leading-relaxed">
                No items bookmarked yet. <br className="hidden sm:block" />
                Start by clicking the star icon on any module.
              </p>
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

              const orderedNames = [
                'Logistics',
                'Logistics & Supply Chain', 'Trading',
                'Customer Relations', 'Digital Presence',
                'Human Resources', 'Work & Development',
                'Accounting', 'Expense Management',
                'Collaboration', 'Dashboards',
                'Configuration', 'System Administration'
              ];

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
