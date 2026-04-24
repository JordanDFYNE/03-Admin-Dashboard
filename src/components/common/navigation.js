import { BarChart2, Boxes, ScanLine, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Overview', icon: BarChart2, color: '#6366f1', href: '/' },
  { name: 'Stock', icon: Boxes, color: '#22c55e', href: '/products' },
  { name: 'Scan', icon: ScanLine, color: '#f59e0b', href: '/scan' },
  { name: 'TEST', icon: ScanLine, color: '#f97316', href: '/orders' },
  { name: 'Settings', icon: Settings, color: '#6ee7b7', href: '/settings' },
];
