import { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  ChevronDown, 
  Calendar, 
  User, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle,
  Award,
  Sparkles,
  MapPin,
  Languages,
  Globe,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useComplaintsStore } from '../../store/useComplaintsStore';
import { useAuthStore } from '../../store/useAuthStore';
import CredentialPointsModal from '../credentials/CredentialPointsModal';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../utils/aiTranslations';

interface TopNavbarProps {
  toggleSidebar: () => void;
}

export default function TopNavbar({ toggleSidebar }: TopNavbarProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { setSearchQuery } = useComplaintsStore();
  const user = useAuthStore((state) => state.user);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('28 Sep 2026 - 28 Sep 2026');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setIsDateRangeOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangCode = (i18n.language ? i18n.language.split('-')[0] : 'en') as SupportedLanguage;

  const handleSelectLanguage = (code: SupportedLanguage) => {
    i18n.changeLanguage(code);
    setIsLangMenuOpen(false);
  };

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value;
      setSearchQuery(val);
      navigate('/complaints');
    }
  };

  return (
    <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-20">
      {/* Left Area: Toggle + Global Search */}
      <div className="flex items-center flex-1 gap-4 max-w-2xl">
        <button 
          onClick={toggleSidebar}
          className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Box */}
        <div className="w-full relative hidden sm:block">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by ID, name, phone, email, location, food type..."
            onKeyDown={handleGlobalSearch}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right Area: Actions, Notification, Date Selector, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 ml-4">
        {/* Live GPS Map Quick Shortcut */}
        <button
          onClick={() => {
            const roleRoute = user?.role === 'SUPERMARKET_OFFICIAL' ? '/supermarket/tracking' : user?.role === 'HEAD_OFFICE_ADMIN' ? '/admin/tracking' : '/user/tracking';
            navigate(roleRoute);
          }}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/90 rounded-xl text-xs font-bold text-blue-900 transition-all shadow-2xs group cursor-pointer"
          title="Open Live Volunteer Route on Google Map"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <MapPin className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
          <span>Live GPS Map</span>
        </button>

        {/* Sustainability Credential Points Pill */}
        <button
          onClick={() => setIsCredentialModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 hover:from-amber-500/20 hover:to-teal-500/20 border border-amber-300/80 rounded-xl text-xs font-bold text-amber-900 transition-all shadow-2xs group cursor-pointer"
          title="View Sustainability Credential Points, Tier & Certificate"
        >
          <Award className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition-transform" />
          <span className="font-extrabold">{(user?.creditPoints || 1285).toLocaleString()}</span>
          <span className="hidden sm:inline text-amber-700/80 font-semibold text-[11px]">Pts</span>
          <span className="text-[10px] text-amber-800 font-extrabold uppercase bg-amber-200/60 border border-amber-300/70 px-1.5 py-0.2 rounded-md">
            {user?.tier || 'Gold'}
          </span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">3</span>
          </button>

          {/* Notifications Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 space-y-3 animate-in fade-in z-30">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900">Notifications</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  2 New
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">High Priority Complaint</p>
                    <p className="text-gray-600 text-[11px]">Case FC-2026-00124 (Dairy Product) flagged for urgent inspection.</p>
                    <p className="text-[10px] text-gray-400 mt-1">12 minutes ago</p>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Lab Test Report Verified</p>
                    <p className="text-gray-600 text-[11px]">Sample analysis for Case FC-2026-00122 uploaded.</p>
                    <p className="text-[10px] text-gray-400 mt-1">1 hour ago</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsNotificationOpen(false);
                    navigate('/alerts');
                  }}
                  className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-center font-semibold text-xs rounded-xl transition-colors block"
                >
                  View All Alerts & Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="relative hidden md:block" ref={dateRef}>
          <button
            onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{selectedDateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {isDateRangeOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-30 text-xs">
              {[
                '28 Sep 2026 - 28 Sep 2026',
                'Last 7 Days',
                'This Month',
                'Quarter to Date',
                'Year 2026 (All)'
              ].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setSelectedDateRange(range);
                    setIsDateRangeOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    selectedDateRange === range ? 'font-semibold text-emerald-700 bg-emerald-50' : 'text-gray-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Multi-Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-2xs cursor-pointer group"
            title="Translate Project / Change Language"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-12 transition-transform" />
            <span className="text-sm leading-none">
              {SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode)?.flag || '🌐'}
            </span>
            <span className="font-extrabold uppercase text-[11px] text-slate-800 hidden sm:inline">
              {currentLangCode}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-40 text-xs animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  Select Language
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                  8 Languages
                </span>
              </div>

              <div className="py-1 max-h-64 overflow-y-auto space-y-0.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = currentLangCode === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/70'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{lang.flag}</span>
                        <div>
                          <div className="font-bold text-xs leading-snug">{lang.nativeName}</div>
                          <div className="text-[10px] text-slate-400 leading-none">{lang.name}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative border-l border-gray-200 pl-4 sm:pl-5" ref={profileRef}>
          {(() => {
            const user = useAuthStore((state) => state.user);
            const logout = useAuthStore((state) => state.logout);

            const userInitials = user?.fullName
              ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : 'FC';

            const userRoleName = user?.role === 'HEAD_OFFICE_ADMIN'
              ? 'Head Office Admin'
              : user?.role === 'SUPERMARKET_OFFICIAL'
                ? (user?.supermarket?.name ? `Official • ${user.supermarket.name}` : 'Supermarket Official')
                : 'Citizen / Donor';

            const profileRoute = user?.role === 'NORMAL_USER'
              ? '/user/settings'
              : user?.role === 'SUPERMARKET_OFFICIAL'
                ? '/supermarket/settings'
                : '/admin/settings';

            return (
              <>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 hover:opacity-90 focus:outline-none transition-opacity text-left cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                    user?.role === 'HEAD_OFFICE_ADMIN' ? 'bg-purple-100 border-purple-200 text-purple-700' :
                    user?.role === 'SUPERMARKET_OFFICIAL' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                    'bg-emerald-100 border-emerald-200 text-emerald-700'
                  }`}>
                    {userInitials}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.fullName || 'User'}</p>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight">{userRoleName}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-30 text-xs animate-in fade-in">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{user?.fullName || 'User'}</p>
                      <p className="text-[10px] text-gray-400">{user?.email || 'user@foodcovering.gov'}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 font-mono">
                        {user?.role || 'NORMAL_USER'}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate(profileRoute);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Account Profile</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Sustainability Credential Points & Certificate Modal */}
      <CredentialPointsModal 
        isOpen={isCredentialModalOpen} 
        onClose={() => setIsCredentialModalOpen(false)} 
      />
    </header>
  );
}
