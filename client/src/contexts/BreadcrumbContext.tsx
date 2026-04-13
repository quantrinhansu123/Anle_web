import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type BreadcrumbTrailItem = { path: string; label: string };

interface BreadcrumbContextType {
  dynamicTitle: string | null;
  setDynamicTitle: (title: string | null) => void;
  /** When set, Topbar renders this trail instead of deriving from the URL. Cleared with `null`. */
  customBreadcrumbs: BreadcrumbTrailItem[] | null;
  setCustomBreadcrumbs: (crumbs: BreadcrumbTrailItem[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const BreadcrumbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbTrailItem[] | null>(null);

  return (
    <BreadcrumbContext.Provider
      value={{ dynamicTitle, setDynamicTitle, customBreadcrumbs, setCustomBreadcrumbs }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = () => {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
};
