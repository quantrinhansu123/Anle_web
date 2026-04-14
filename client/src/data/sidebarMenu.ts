import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  BadgeDollarSign,
  Copyright,
  Settings,
  Handshake,
  Clock,
  BarChart3,
  Warehouse,
} from 'lucide-react';
import React from 'react';

export type SidebarItem = {
  icon: React.ElementType;
  label: string;
  path: string;
};

export const sidebarMenu: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Truck, label: 'Shipping', path: '/shipping' },
  { icon: Package, label: 'Operations', path: '/operations' },
  { icon: Warehouse, label: 'Inventory', path: '/inventory' },
  { icon: Handshake, label: 'CRM & Marketing', path: '/marketing' },
  { icon: Users, label: 'HR & Projects', path: '/hr' },
  { icon: BadgeDollarSign, label: 'Finance', path: '/finance' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Clock, label: 'Productivity', path: '/productivity' },
  { icon: Settings, label: 'System & Apps', path: '/system' }
];

// Additional items seen on the dashboard
export const extraMenuItems: SidebarItem[] = [
  { icon: Copyright, label: 'Copyright', path: '/copyright' },
];
