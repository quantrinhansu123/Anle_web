import {
  FileText, FileSignature,
  Users,
  BadgeDollarSign, CreditCard,
  Settings, Truck, Handshake, Package, ShoppingCart, Palette, Building2
} from 'lucide-react';
import type { ModuleCardProps } from '../components/ui/ModuleCard';

export const moduleData: Record<string, { section: string; items: ModuleCardProps[] }[]> = {
  '/order': [
    {
      section: 'Order',
      items: [
        { icon: Package, title: 'Shipments', description: 'General shipment data and specifications.', colorScheme: 'slate', path: '/shipments/information' },
        { icon: BadgeDollarSign, title: 'Sales', description: 'Quotation items and service rates.', colorScheme: 'amber', path: '/financials/sales' },
        { icon: ShoppingCart, title: 'Purchasing Department', description: 'Manage purchasing items and costs.', colorScheme: 'orange', path: '/financials/purchasing' },
        { icon: FileSignature, title: 'Contracts', description: 'Comprehensive list of all shipping contracts.', colorScheme: 'slate', path: '/contracts/directory' },
      ]
    }
  ],
  '/internal': [
    {
      section: 'Internal',
      items: [
        { icon: Users, title: 'Employees', description: 'Company staff and roles.', colorScheme: 'orange', path: '/employees/directory' },
        { icon: Truck, title: 'Suppliers', description: 'Carriers, agents, and service providers.', colorScheme: 'orange', path: '/suppliers/directory' },
        { icon: Handshake, title: 'Customers', description: 'Comprehensive list of all clients.', colorScheme: 'blue', path: '/customers/directory' },
      ]
    },
  ],
  '/accountant': [
    {
      section: 'Accountant',
      items: [
        { icon: CreditCard, title: 'Debits', description: 'Customer debit note management.', colorScheme: 'blue', path: '/financials/debit-notes' },
        { icon: FileText, title: 'Payment Requests', description: 'Internal requests for supplier payments.', colorScheme: 'teal', path: '/financials/payment-requests' },
        { icon: Settings, title: 'Settings', description: 'General application configuration for currency and exchange rates.', colorScheme: 'amber', path: '/system/exchange-rates' },
      ]
    },
  ],
  '/system': [
    {
      section: 'System',
      items: [
        { icon: Palette, title: 'Appearance', description: 'Customize UI theme, colors, and fonts.', colorScheme: 'blue', path: '/settings' },
        { icon: Building2, title: 'Company Information', description: 'Manage company profile, logos, and contacts.', colorScheme: 'orange', path: '/system/company-info' },
      ]
    }
  ]
};

export const getDirectPath = (path: string): string => {
  const sections = moduleData[path];
  if (sections && sections.length === 1 && sections[0].items.length === 1) {
    return sections[0].items[0].path || path;
  }
  return path;
};
