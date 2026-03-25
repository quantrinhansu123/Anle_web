import React, { useState } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { ModuleCard } from '../components/ui/ModuleCard';
import { useLocation, useNavigate } from 'react-router-dom';
import { moduleData } from '../data/moduleData';
import { sidebarMenu } from '../data/sidebarMenu';
import { useBookmarks } from '../hooks/useBookmarks';

const ModulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { isBookmarked } = useBookmarks();

  const data = moduleData[location.pathname] || [];
  const currentItem = sidebarMenu.find(item => item.path === location.pathname);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      {/* Mobile Header (Only visible on small screens when inside a module) */}
      <div className="flex items-center gap-3 mb-4 sm:hidden">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-muted-foreground hover:bg-accent rounded-lg flex items-center justify-center bg-card border border-border shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-foreground">
          {currentItem?.label}
        </h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-6 relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground text-[13px] font-medium transition-colors bg-card shadow-sm"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="flex bg-muted rounded-lg p-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={clsx(
              "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200",
              activeTab === 'all'
                ? "bg-card text-primary shadow-sm ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={clsx(
              "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200 whitespace-nowrap",
              activeTab === 'bookmarks'
                ? "bg-card text-primary shadow-sm ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Bookmarks
          </button>
        </div>

        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="w-full text-[13px] bg-transparent border border-border rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
            placeholder="Search within module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'bookmarks' ? (() => {
        const bookmarkedItems = data.flatMap(s => s.items).filter(item => item.path && isBookmarked(item.path));

        if (bookmarkedItems.length === 0) {
          return (
            <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-2xl border border-border mt-4">
              No items bookmarked in this module yet.
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-in fade-in duration-500 mt-4">
            {bookmarkedItems.map((item, idx) => (
              <ModuleCard key={idx} {...item} />
            ))}
          </div>
        );
      })() : data.length > 0 ? (
        <div className="space-y-8">
          {data.map((section, idx) => {
            // Filter items by search query
            const filteredItems = section.items.filter(item => 
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              item.description.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <h2 className="text-[14px] font-bold text-primary mb-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    <span>{section.section}</span>
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
          })}
          
          {searchQuery && !data.some(s => s.items.some(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()))) && (
            <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-2xl border border-border">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-2xl border border-border border-dashed mt-4">
          This module is under development...
        </div>
      )}
    </div>
  );
};

export default ModulePage;
