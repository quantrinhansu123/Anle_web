import {
  LayoutDashboard,
  Ship,
  Users,
  Building2,
  BadgeDollarSign,
  UserCircle,
  Copyright,
  FileText,
} from 'lucide-react';
import React from 'react';

export type SidebarItem = {
  icon: React.ElementType;
  label: string;
  path: string;
};

export const sidebarMenu: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Ship, label: 'Shipments', path: '/shipments' },
  { icon: Building2, label: 'Customers', path: '/customers' },
  { icon: Users, label: 'Suppliers', path: '/suppliers' },
  // { icon: Briefcase, label: 'Employees', path: '/employees' },
  { icon: FileText, label: 'Contracts', path: '/contracts' },
  { icon: BadgeDollarSign, label: 'Financials', path: '/financials' },
  // { icon: Settings, label: 'System', path: '/system' }
];

// Additional items seen on the dashboard
export const extraMenuItems: SidebarItem[] = [
  // { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
  { icon: Copyright, label: 'Copyright', path: '/copyright' },
  { icon: UserCircle, label: 'Profile', path: '/profile' }
];
