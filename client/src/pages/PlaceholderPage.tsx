import React from 'react';
import { Rocket, Info } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PlaceholderPage: React.FC = () => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    
    // Fallbacks if formatting is needed
    if (!lastPart) return 'Module';
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col items-center justify-center -mt-2 min-h-[70vh]">
      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center max-w-md w-full p-10 text-center relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
        
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary ring-8 ring-primary/5">
          <Rocket size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
          {getPageTitle(location.pathname)}
        </h1>
        
        <p className="text-[14px] text-muted-foreground mb-6 leading-relaxed">
          This module is currently under development. Stay tuned for upcoming updates!
        </p>

        <div className="bg-blue-50 text-blue-700 rounded-xl p-4 flex items-start gap-3 text-left border border-blue-100">
          <Info size={18} className="shrink-0 mt-0.5" />
          <p className="text-[12px] font-medium leading-relaxed">
            The core UI shell has been created. Feature implementations will be added in upcoming phases based on the project roadmap.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
