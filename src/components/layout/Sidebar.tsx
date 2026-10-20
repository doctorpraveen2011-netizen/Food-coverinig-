import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Gift, 
  MapPin, 
  Map, 
  FileText, 
  Users, 
  Settings, 
  Leaf,
  ShieldCheck,
  Bell,
  Package,
  Building2,
  FileCheck,
  Recycle,
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'NORMAL_USER';

  // Role-specific navigation items
  let navItems: Array<{ name: string; icon: any; path: string; badge?: string }> = [];

  if (role === 'NORMAL_USER') {
    navItems = [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/user/dashboard' },
      { name: 'AI Food & Waste Scan', icon: Sparkles, path: '/user/ai-scan' },
      { name: 'My Donations', icon: Gift, path: '/user/donations' },
      { name: 'Report Spoilage', icon: ShieldCheck, path: '/user/complaints' },
      { name: 'Live Tracking', icon: MapPin, path: '/user/tracking' },
      { name: 'My Profile', icon: Settings, path: '/user/settings' },
    ];
  } else if (role === 'SUPERMARKET_OFFICIAL') {
    navItems = [
      { name: 'Store Dashboard', icon: LayoutDashboard, path: '/supermarket/dashboard' },
      { name: 'Food Inventory', icon: Package, path: '/supermarket/inventory' },
      { name: 'Live GPS Tracking', icon: MapPin, path: '/supermarket/tracking', badge: 'LIVE' },
      { name: 'AI Food & Waste Scan', icon: Sparkles, path: '/supermarket/ai-scan' },
      { name: 'Surplus Donations', icon: Gift, path: '/supermarket/donations' },
      { name: 'Store Complaints', icon: ShieldCheck, path: '/supermarket/complaints' },
      { name: 'Audit Reports', icon: FileText, path: '/supermarket/reports' },
      { name: 'Store Settings', icon: Settings, path: '/supermarket/settings' },
    ];
  } else {
    // HEAD_OFFICE_ADMIN
    navItems = [
      { name: 'Executive Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'AI Food & Waste Scan', icon: Sparkles, path: '/admin/ai-scan' },
      { name: 'Supermarkets', icon: Building2, path: '/admin/supermarkets' },
      { name: 'User Management', icon: Users, path: '/admin/users' },
      { name: 'Central Food Safety', icon: ShieldCheck, path: '/admin/complaints' },
      { name: 'Platform Donations', icon: Gift, path: '/admin/donations' },
      { name: 'Fleet Tracking', icon: MapPin, path: '/admin/tracking' },
      { name: 'City Map View', icon: Map, path: '/admin/map' },
      { name: 'Analytics & Reports', icon: FileText, path: '/admin/reports' },
      { name: 'Alerts & Broadcasts', icon: Bell, path: '/admin/alerts', badge: '3' },
      { name: 'Audit Ledger', icon: FileCheck, path: '/admin/audit-logs' },
      { name: 'System Settings', icon: Settings, path: '/admin/settings' },
    ];
  }

  return (
    <aside
      className={twMerge(
        clsx(
          "fixed inset-y-0 left-0 z-30 w-[245px] bg-white border-r border-slate-200 text-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col shrink-0 select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
          <Leaf className="w-5 h-5 fill-current" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-900 tracking-tight block">FoodCovering</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">2.0</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">Safe Food • Healthy Tomorrow</span>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Active Scope:</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            role === 'HEAD_OFFICE_ADMIN' ? 'bg-purple-600' :
            role === 'SUPERMARKET_OFFICIAL' ? 'bg-blue-600' :
            'bg-emerald-600'
          }`} />
          <span className="text-xs font-bold text-slate-800 truncate">
            {role === 'HEAD_OFFICE_ADMIN' ? 'Head Office Admin' :
             role === 'SUPERMARKET_OFFICIAL' ? (user?.supermarket?.name || 'Supermarket Official') :
             'Citizen / Donor'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              clsx(
                "group flex items-center justify-between px-3.5 py-2 text-xs rounded-xl transition-all relative",
                isActive
                  ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/70 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={clsx("w-4 h-4 shrink-0 transition-colors", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-700")} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Message Card */}
      <div className="p-3.5 m-3 bg-[#F0FDF4] rounded-2xl border border-emerald-100 relative overflow-hidden shadow-2xs">
        <div className="flex items-start gap-2.5 relative z-10">
          <div className="w-7 h-7 rounded-lg bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[11px] text-slate-900 leading-snug">Food Safety Starts with You</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              Report, verify, and prevent spoilage for everyone.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
