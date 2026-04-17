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
  requiredDepartments?: string[];
  requiredRoles?: string[];
};

export const sidebarMenu: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Truck, label: 'Shipping', path: '/shipping', requiredDepartments: ['logistics', 'finance', 'bod'] },
  { icon: Package, label: 'Operations', path: '/operations', requiredDepartments: ['logistics', 'procurement', 'finance', 'bod'] },
  { icon: Warehouse, label: 'Inventory', path: '/inventory', requiredDepartments: ['logistics', 'finance', 'bod'] },
  { icon: Handshake, label: 'CRM & Marketing', path: '/marketing', requiredDepartments: ['sales', 'bod'] },
  { icon: Users, label: 'HR & Projects', path: '/hr', requiredRoles: ['ceo', 'director', 'manager'] },
  { icon: BadgeDollarSign, label: 'Finance', path: '/finance', requiredDepartments: ['finance', 'bod'] },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Clock, label: 'Productivity', path: '/productivity' },
  { icon: Settings, label: 'System & Apps', path: '/system', requiredRoles: ['ceo', 'director'] }
];

// Additional items seen on the dashboard
export const extraMenuItems: SidebarItem[] = [
  { icon: Copyright, label: 'Copyright', path: '/copyright' },
];
