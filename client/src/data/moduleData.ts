import {
  FileText, FileSignature, Anchor,
  Users,
  BadgeDollarSign, CreditCard,
  Truck, Handshake, Package, ShoppingCart, Palette, Building2, ImageIcon, Boxes,
  Calendar, Activity, LayoutDashboard, LayoutGrid, Database, Zap, Mail, Link as LinkIcon, Briefcase, GraduationCap, Grid,
  MessageSquare, Banknote, Coins, AppWindow, Receipt,
  Bot, Shield, UserCircle, BarChart3, ClipboardList, Scale, LineChart, ArrowRightLeft, CalendarRange,
} from 'lucide-react';
import type { ModuleCardProps } from '../components/ui/ModuleCard';

export const moduleData: Record<string, { section: string; items: ModuleCardProps[] }[]> = {
  '/shipping': [
    {
      section: 'Logistics',
      items: [
        { icon: LayoutDashboard, title: 'Dashboard FMS', description: 'Freight operations and shipment overview.', colorScheme: 'blue', path: '/shipping/dashboard-fms' },
        { icon: BarChart3, title: 'Business Dashboard', description: 'Business metrics and transportation performance.', colorScheme: 'emerald', path: '/shipping/business-dashboard' },
        { icon: BadgeDollarSign, title: 'Sales', description: 'Quotes, orders, and service rates.', colorScheme: 'amber', path: '/financials/sales', requiredDepartments: ['sales', 'finance', 'bod'] },
        { icon: ClipboardList, title: 'Shipments', description: 'Shipment board: SOP tracking, B/L, operators, and priority.', colorScheme: 'blue', path: '/shipments/information', requiredDepartments: ['logistics', 'finance', 'bod'] },
        { icon: Anchor, title: 'House Sea B/L', description: 'Table of house B/L: MBL, HBL, containers, parties, schedule, and operators.', colorScheme: 'cyan', path: '/shipping/house-sea-bl', requiredDepartments: ['logistics', 'finance', 'bod'] },
        { icon: Package, title: 'Transport Services', description: 'Manage freight charge catalog and transport services.', colorScheme: 'slate', path: '/financials/sales-charges', requiredDepartments: ['logistics', 'finance', 'bod'] },
        { icon: CreditCard, title: 'Payment Management', description: 'Payment requests and cost flow.', colorScheme: 'teal', path: '/financials/payment-requests', requiredDepartments: ['finance', 'bod'] },
        { icon: FileText, title: 'Debit Notes', description: 'Customer debit notes and credit-note handling.', colorScheme: 'blue', path: '/financials/debit-notes', requiredDepartments: ['finance', 'bod'] },
      ]
    }
  ],
  '/inventory': [
    {
      section: 'Inventory',
      items: [
        {
          icon: LayoutGrid,
          title: 'Overview',
          description: 'Receipts, internal transfers, deliveries, and returns by location.',
          colorScheme: 'emerald',
          path: '/inventory/overview',
        },
        {
          icon: Boxes,
          title: 'Stock on hand',
          description: 'Quantities, valuation, and availability by warehouse and category.',
          colorScheme: 'slate',
          path: '/inventory/stock',
        },
      ],
    },
  ],
  '/operations': [
    {
      section: 'Logistics & Supply Chain',
      items: [
        { icon: Package, title: 'Shipments', description: 'General shipment data and specifications.', colorScheme: 'slate', path: '/shipments/information' },
        { icon: Database, title: 'Inventory', description: 'Stock, warehouses, overview, and operations hub.', colorScheme: 'emerald', path: '/inventory' },
        { icon: Truck, title: 'Fleet', description: 'Manage vehicles, contracts, and costs.', colorScheme: 'slate', path: '/fleet' },
      ]
    },
    {
      section: 'Trading',
      items: [
        { icon: ShoppingCart, title: 'Purchasing', description: 'Manage purchasing items and costs.', colorScheme: 'orange', path: '/financials/purchasing', requiredDepartments: ['procurement', 'finance', 'bod'] },
        { icon: FileSignature, title: 'Contracts', description: 'Comprehensive list of all shipping contracts.', colorScheme: 'slate', path: '/contracts/directory', requiredDepartments: ['sales', 'procurement', 'finance', 'bod'] },
        { icon: FileText, title: 'Pending Approvals', description: 'Review and approve pending purchase orders.', colorScheme: 'teal', path: '/financials/po-approvals', requiredRoles: ['ceo', 'director', 'manager'] },
      ]
    }
  ],
  '/marketing': [
    {
      section: 'Customer Relations',
      items: [
        { icon: Handshake, title: 'CRM', description: 'Manage leads, opportunities, and interactions.', colorScheme: 'blue', path: '/crm' },
        { icon: Building2, title: 'Customers', description: 'Manage customer accounts and details.', colorScheme: 'teal', path: '/customers/directory' },
        { icon: Building2, title: 'Suppliers', description: 'Manage supplier accounts and details.', colorScheme: 'amber', path: '/suppliers/directory' },
        { icon: Users, title: 'Contacts', description: 'Unified directory for customers and suppliers.', colorScheme: 'slate', path: '/contacts/directory' },
      ]
    },
    {
      section: 'Digital Presence',
      items: [
        { icon: AppWindow, title: 'Website', description: 'Design and manage corporate websites.', colorScheme: 'slate', path: '/website' },
        { icon: Mail, title: 'Email Marketing', description: 'Manage email campaigns and subscribers.', colorScheme: 'amber', path: '/email-marketing' },
        { icon: LinkIcon, title: 'Link Tracker', description: 'Track URL clicks and marketing performance.', colorScheme: 'cyan', path: '/link-tracker' },
      ]
    }
  ],
  '/hr': [
    {
      section: 'Human Resources',
      items: [
        { icon: Users, title: 'Employees', description: 'Company staff directory and roles.', colorScheme: 'orange', path: '/employees/directory' },
        { icon: Briefcase, title: 'Recruitment', description: 'Manage candidates and interview sessions.', colorScheme: 'blue', path: '/employees/candidates' },
      ]
    },
    {
      section: 'Work & Development',
      items: [
        { icon: LayoutDashboard, title: 'Projects', description: 'Manage tasks, sprints, and project scopes.', colorScheme: 'emerald', path: '/projects' },
        { icon: GraduationCap, title: 'eLearning', description: 'Internal courses and employee training.', colorScheme: 'purple', path: '/elearning' },
      ]
    }
  ],
  '/finance': [
    {
      section: 'Accounting',
      items: [
        {
          icon: LayoutDashboard,
          title: 'Accounting dashboard',
          description: 'Overview of invoices, payables, and cash flow.',
          colorScheme: 'blue',
          path: '/financials/accounting-dashboard',
        },
        {
          icon: Receipt,
          title: 'Invoices',
          description: 'Browse, filter, and open customer invoices across jobs.',
          colorScheme: 'slate',
          path: '/financials/invoices',
        },
        { icon: FileText, title: 'Invoicing', description: 'Create and manage customer invoices.', colorScheme: 'teal', path: '/financials/invoicing' },
        {
          icon: Scale,
          title: 'Balance sheet',
          description: 'B01-DN style: line items, codes, balances — view and export.',
          colorScheme: 'emerald',
          path: '/financials/balance-sheet',
        },
        {
          icon: LineChart,
          title: 'Profit and loss',
          description: 'B02-DN style income statement: revenue, costs, and net profit.',
          colorScheme: 'purple',
          path: '/financials/profit-loss',
        },
        {
          icon: ArrowRightLeft,
          title: 'Statement of cash flows',
          description: 'B03-DN: operating, investing, and financing cash movements.',
          colorScheme: 'cyan',
          path: '/financials/cash-flow',
        },
        {
          icon: CalendarRange,
          title: 'Accounts receivable aging',
          description: 'Open A/R by partner and bucket (1–30, 31–60, …) as of a date.',
          colorScheme: 'amber',
          path: '/financials/receivable-aging',
        },
        {
          icon: ClipboardList,
          title: 'Approval Requests',
          description: 'Manage and review pending approval workflow requests.',
          colorScheme: 'purple',
          path: '/financials/approvals',
          requiredRoles: ['ceo', 'director', 'manager']
        },
      ]
    },
    {
      section: 'Expense Management',
      items: [
        {
          icon: Banknote,
          title: 'Customer expenses',
          description: 'Record and reconcile customer-related expenses and reimbursements.',
          colorScheme: 'orange',
          path: '/financials/expenses',
        },
        { icon: Coins, title: 'Salary advances', description: 'Employee salary advance requests.', colorScheme: 'cyan', path: '/financials/advances' },
      ]
    }
  ],
  '/reports': [
    {
      section: 'Reports',
      items: [
        {
          icon: BarChart3,
          title: 'Job Profit by Performance Date',
          description: 'Sell, buy, VAT, and margin by job scoped to performance date.',
          colorScheme: 'emerald',
          path: '/reports/job-profit-by-performance-date',
        },
      ],
    },
  ],
  '/productivity': [
    {
      section: 'Collaboration',
      items: [
        { icon: MessageSquare, title: 'Discuss', description: 'Internal team chat and discussion channels.', colorScheme: 'blue', path: '/discuss' },
        { icon: Calendar, title: 'Calendar', description: 'Schedule meetings and company events.', colorScheme: 'amber', path: '/calendar' },
      ]
    },
    {
      section: 'Dashboards',
      items: [
        { icon: Activity, title: 'Activity Dashboard', description: 'Overview of recent activities and notifications.', colorScheme: 'emerald', path: '/activity-dashboard' },
        { icon: LayoutDashboard, title: 'My Dashboard', description: 'Personalized widgets and quick links.', colorScheme: 'slate', path: '/my-dashboard' },
      ]
    },
    {
      section: 'AI & Tools',
      items: [
        { icon: Bot, title: 'AI Assistant', description: 'Intelligent assistant to help with system tasks.', colorScheme: 'purple', path: '/ai-assistant' }
      ]
    }
  ],
  '/system': [
    {
      section: 'Configuration',
      items: [
        { icon: Palette, title: 'Appearance', description: 'Customize UI theme, colors, and fonts.', colorScheme: 'blue', path: '/settings' },
        { icon: UserCircle, title: 'My Profile', description: 'Manage your personal account settings.', colorScheme: 'blue', path: '/profile' },
        { icon: Building2, title: 'Company Info', description: 'Manage company profile, logos, and contacts.', colorScheme: 'orange', path: '/system/company-info' },
        { icon: Zap, title: 'Exchange Rates', description: 'General application configuration for currency.', colorScheme: 'amber', path: '/system/exchange-rates' },
        { icon: ImageIcon, title: 'Image Gallery', description: 'Upload images to host and get URLs.', colorScheme: 'teal', path: '/system/image-gallery' },
        { icon: Shield, title: 'Legal & Copyright', description: 'System license and terms of service.', colorScheme: 'slate', path: '/copyright' },
      ]
    },
    {
      section: 'System Administration',
      items: [
        { icon: Grid, title: 'Apps', description: 'App store, manage modules and integrations.', colorScheme: 'emerald', path: '/apps' },
        { icon: LayoutDashboard, title: 'Job Queue', description: 'Monitor background jobs and system tasks.', colorScheme: 'slate', path: '/system/job-queue' },
        { icon: Activity, title: 'Mass Activities', description: 'Configure dynamic actions for bulk data.', colorScheme: 'purple', path: '/system/mass-activities' },
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
