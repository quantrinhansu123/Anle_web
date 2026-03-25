import {
  FileText, FileSignature,
  Users, Building2,
  BadgeDollarSign, CreditCard, Banknote,
  // Settings, ShieldCheck, Database,
  // GraduationCap, Award,
  // Globe, Search, PlusCircle,
  // BarChart3, PieChart, TrendingUp,
  // Mail, Bell, Clock
} from 'lucide-react';
import type { ModuleCardProps } from '../components/ui/ModuleCard';

export const moduleData: Record<string, { section: string; items: ModuleCardProps[] }[]> = {
  '/shipments': [
    // {
    //   section: 'Ocean Freight',
    //   items: [
    //     { icon: Ship, title: 'FCL Shipments', description: 'Full Container Load ocean freight management.', colorScheme: 'blue' },
    //     { icon: Anchor, title: 'LCL Shipments', description: 'Less than Container Load ocean freight.', colorScheme: 'blue' },
    //     { icon: FileText, title: 'Master B/L', description: 'Manage Master Bill of Ladings.', colorScheme: 'purple' },
    //     { icon: FileCheck, title: 'House B/L', description: 'Manage House Bill of Ladings.', colorScheme: 'purple' }
    //   ]
    // },
    // {
    //   section: 'Air & Land Freight',
    //   items: [
    //     { icon: Plane, title: 'Air Freight', description: 'International air cargo shipments.', colorScheme: 'blue' },
    //     { icon: Truck, title: 'Land Transport', description: 'Domestic and cross-border trucking.', colorScheme: 'orange' },
    //     { icon: FileText, title: 'AWB Management', description: 'Air Waybill tracking and documentation.', colorScheme: 'blue' }
    //   ]
    // },
    // {
    //   section: 'Customs & Documentation',
    //   items: [
    //     { icon: ClipboardList, title: 'Customs Clearance', description: 'Customs declaration and clearance status.', colorScheme: 'emerald' },
    //     { icon: ShieldCheck, title: 'Insurance', description: 'Cargo insurance policies and claims.', colorScheme: 'teal' },
    //     { icon: FileSignature, title: 'Permits', description: 'Import/Export permits and licenses.', colorScheme: 'emerald' }
    //   ]
    // },
    {
      section: 'Details',
      items: [
        { icon: FileText, title: 'Shipments', description: 'General shipment data and specifications.', colorScheme: 'slate', path: '/shipments/information' },
        // { icon: Users, title: 'Customer', description: 'Detailed client profiles involved in shipments.', colorScheme: 'blue' },
        // { icon: Building2, title: 'Supplier', description: 'Logistics provider and carrier info.', colorScheme: 'orange' },
      ]
    }
  ],
  '/customers': [
    {
      section: 'Client Management',
      items: [
        { icon: Building2, title: 'Customer Directory', description: 'Comprehensive list of all clients.', colorScheme: 'blue', path: '/customers/directory' },
        // { icon: UserPlus, title: 'New Customer', description: 'Onboard a new client to the system.', colorScheme: 'green' },
        // { icon: Search, title: 'Client Search', description: 'Advanced search for customer records.', colorScheme: 'slate' }
      ]
    },
    // {
    //   section: 'Sales & CRM',
    //   items: [
    //     { icon: TrendingUp, title: 'Sales Leads', description: 'Track potential shipments and clients.', colorScheme: 'pink' },
    //     { icon: BarChart3, title: 'Client Analytics', description: 'Revenue and volume reports per client.', colorScheme: 'purple' },
    //     { icon: Mail, title: 'Communications', description: 'Email logs and meeting notes.', colorScheme: 'blue' }
    //   ]
    // }
  ],
  '/suppliers': [
    {
      section: 'Vendor Management',
      items: [
        { icon: Users, title: 'Supplier Directory', description: 'Carriers, agents, and service providers.', colorScheme: 'orange', path: '/suppliers/directory' },
        // { icon: Truck, title: 'Carriers', description: 'Shipping lines and airlines directory.', colorScheme: 'blue' },
        // { icon: Award, title: 'Vendor Rating', description: 'Performance evaluation of suppliers.', colorScheme: 'orange' }
      ]
    },
    // {
    //   section: 'Procurement',
    //   items: [
    //     { icon: FileSignature, title: 'Service Agreements', description: 'Negotiated rates and contracts.', colorScheme: 'teal' },
    //     { icon: PlusCircle, title: 'New Vendor', description: 'Add a new service provider.', colorScheme: 'green' }
    //   ]
    // }
  ],
  '/financials': [
    {
      section: 'Accounts Receivable',
      items: [
        // { icon: Receipt, title: 'Invoices', description: 'Issue and track sales invoices.', colorScheme: 'green' },
        { icon: BadgeDollarSign, title: 'Sales Items', description: 'Quotation items and service rates.', colorScheme: 'blue', path: '/financials/sales' },
        { icon: CreditCard, title: 'Debit Notes', description: 'Customer debit note management.', colorScheme: 'blue', path: '/financials/debit-notes' },
        // { icon: TrendingUp, title: 'Collections', description: 'Monitor pending payments from clients.', colorScheme: 'emerald' }
      ]
    },
    {
      section: 'Accounts Payable',
      items: [
        { icon: Banknote, title: 'Purchasing', description: 'Manage purchasing items and costs.', colorScheme: 'orange', path: '/financials/purchasing' },
        { icon: Banknote, title: 'Payment Requests', description: 'Internal requests for supplier payments.', colorScheme: 'orange', path: '/financials/payment-requests' },
        // { icon: FileCheck, title: 'Vendor Invoices', description: 'Manage incoming invoices from suppliers.', colorScheme: 'red' }
      ]
    },
    // {
    //   section: 'Reporting',
    //   items: [
    //     { icon: BarChart3, title: 'Profit & Loss', description: 'Shipment level and monthly P&L.', colorScheme: 'purple' },
    //     { icon: PieChart, title: 'Financial Summary', description: 'Overview of revenue and expenses.', colorScheme: 'blue' }
    //   ]
    // }
  ],
  '/contracts': [
    {
      section: 'Contract Lifecycle',
      items: [
        { icon: FileSignature, title: 'Contract List', description: 'Comprehensive list of all shipping contracts.', colorScheme: 'blue', path: '/contracts/directory' },
        // { icon: FileSignature, title: 'Active Contracts', description: 'Currently valid shipping contracts.', colorScheme: 'blue' },
        // { icon: Clock, title: 'Renewals', description: 'Upcoming contract expirations.', colorScheme: 'orange' },
        // { icon: FileCheck, title: 'Templates', description: 'Standard contract templates.', colorScheme: 'slate' }
      ]
    }
  ],
  // '/employees': [
  //   {
  //     section: 'Staff Directory',
  //     items: [
  //       { icon: Users, title: 'Employee List', description: 'Company staff and roles.', colorScheme: 'blue' },
  //       { icon: UserCog, title: 'Roles & Permissions', description: 'Manage system access levels.', colorScheme: 'purple' },
  //       { icon: GraduationCap, title: 'Training', description: 'Staff training and certifications.', colorScheme: 'emerald' }
  //     ]
  //   }
  // ],
  // '/system': [
  //   {
  //     section: 'General Configuration',
  //     items: [
  //       { icon: Settings, title: 'System Settings', description: 'General application configuration.', colorScheme: 'slate' },
  //       { icon: Globe, title: 'Ports & Airports', description: 'Manage global port/airport codes.', colorScheme: 'blue' },
  //       { icon: Database, title: 'Standard Rates', description: 'Default surcharge and rate schedules.', colorScheme: 'purple' }
  //     ]
  //   },
  //   {
  //     section: 'Security & Logs',
  //     items: [
  //       { icon: ShieldCheck, title: 'Security Audit', description: 'Login history and activity logs.', colorScheme: 'red' },
  //       { icon: Bell, title: 'Notification Rules', description: 'Configure automated system alerts.', colorScheme: 'orange' }
  //     ]
  //   }
  // ]
};
