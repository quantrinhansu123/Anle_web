import {
  LayoutDashboard,
  Package,
  Users,
  BadgeDollarSign,
  Copyright,
  Settings
} from 'lucide-react';
import React from 'react';

export type SidebarItem = {
  icon: React.ElementType;
  label: string;
  path: string;
};

export const sidebarMenu: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Order', path: '/order' },
  { icon: Users, label: 'Internal', path: '/internal' },
  { icon: BadgeDollarSign, label: 'Accountant', path: '/accountant' },
  { icon: Settings, label: 'System', path: '/system' }
];

// Additional items seen on the dashboard
export const extraMenuItems: SidebarItem[] = [
  { icon: Copyright, label: 'Copyright', path: '/copyright' },
];
