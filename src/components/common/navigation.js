import { BarChart2, Boxes, ScanLine, ArrowRightLeft, TrendingUp, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Overview', icon: BarChart2, color: '#6366f1', href: '/' },
  { name: 'Stock', icon: Boxes, color: '#22c55e', href: '/products' },
  { name: 'Scan', icon: ScanLine, color: '#f59e0b', href: '/orders' },
  { name: 'Moves', icon: ArrowRightLeft, color: '#ec4899', href: '/sales' },
  { name: 'Reports', icon: TrendingUp, color: '#3b82f6', href: '/analytics' },
  { name: 'Settings', icon: Settings, color: '#6ee7b7', href: '/settings' },
];
