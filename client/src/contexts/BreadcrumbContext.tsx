import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface BreadcrumbContextType {
  dynamicTitle: string | null;
  setDynamicTitle: (title: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const BreadcrumbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ dynamicTitle, setDynamicTitle }}>
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
