import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { Leaf, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, CheckCircle2, Gift, Sparkles, ArrowRight } from 'lucide-react';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email/username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success && result.role) {
      // Dynamic routing strictly determined by server-verified role
      switch (result.role) {
        case 'NORMAL_USER':
          navigate('/user/dashboard', { replace: true });
          break;
        case 'SUPERMARKET_OFFICIAL':
          navigate('/supermarket/dashboard', { replace: true });
          break;
        case 'HEAD_OFFICE_ADMIN':
          navigate('/admin/dashboard', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
      }
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const quickLoginAndNavigate = async (demoEmail: string, demoPass: string, targetRoute?: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    setIsLoading(true);

    const result = await login(demoEmail, demoPass);
    setIsLoading(false);

    if (result.success && result.role) {
      if (targetRoute) {
        navigate(targetRoute, { replace: true });
        return;
      }
      switch (result.role) {
        case 'NORMAL_USER':
          navigate('/user/dashboard', { replace: true });
          break;
        case 'SUPERMARKET_OFFICIAL':
          navigate('/supermarket/dashboard', { replace: true });
          break;
        case 'HEAD_OFFICE_ADMIN':
          navigate('/admin/dashboard', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
      }
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand & Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mb-4 shadow-sm">
          <Leaf className="w-8 h-8 fill-current" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          FoodCovering <span className="text-emerald-600 font-semibold text-2xl">2.0</span>
        </h2>
        <p className="mt-1 text-sm text-emerald-700 font-semibold tracking-wide">
          Safe Food • Healthy Tomorrow
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Intelligent food safety enforcement, commercial surplus monitoring & public donation ecosystem.
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address or Username
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter registered email or username"
                className="appearance-none block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="appearance-none block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded accent-emerald-600"
                />
                <span className="text-xs font-medium text-slate-600">Remember this session</span>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>SIGN IN TO DASHBOARD</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Helper & Direct Access Credential Points */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Role Test Logins & Credential Points
            </p>

            {/* FEATURED: Direct Credential Point for Supermarket Official Surplus Donations */}
            <div className="mb-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-md border border-blue-500/40">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-white/15 text-white">
                    <Gift className="w-4 h-4 text-blue-200" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-wide">
                    Supermarket Official • Surplus & Credits
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  Direct 1-Click
                </span>
              </div>
              <p className="text-[11px] text-blue-100 mb-2.5 leading-snug">
                Jump straight to <strong>Store Surplus Donations & Charity Pickups</strong> with full CSR Credit Points tracking.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => quickLoginAndNavigate('official@freshmart.com', 'Official@123', '/supermarket/donations')}
                  className="flex-1 py-2 px-3 bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-900 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Open Surplus Donations</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('official@freshmart.com', 'Official@123')}
                  className="py-2 px-2.5 bg-blue-900/50 hover:bg-blue-900/80 text-blue-100 text-[10px] font-semibold rounded-lg border border-white/20 transition-colors"
                >
                  Fill Form
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <div className="w-full p-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70 transition-colors flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">1. Head Office Administrator</span>
                  <span className="text-[10px] text-emerald-700">admin@foodcovering.gov • Full system authority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLoginAndNavigate('admin@foodcovering.gov', 'Admin@Secure2026!')}
                    className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-0.5 rounded shadow-2xs cursor-pointer transition-colors"
                  >
                    1-Click
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('admin@foodcovering.gov', 'Admin@Secure2026!')}
                    className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                  >
                    Fill
                  </button>
                </div>
              </div>

              <div className="w-full p-2 rounded-lg bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/70 transition-colors flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-950 block">2. Supermarket Official (FreshMart)</span>
                  <span className="text-[10px] text-blue-700">official@freshmart.com • Inventory & store scope</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLoginAndNavigate('official@freshmart.com', 'Official@123', '/supermarket/dashboard')}
                    className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded shadow-2xs cursor-pointer transition-colors"
                  >
                    1-Click
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('official@freshmart.com', 'Official@123')}
                    className="text-[10px] font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 cursor-pointer"
                  >
                    Fill
                  </button>
                </div>
              </div>

              <div className="w-full p-2 rounded-lg bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/70 transition-colors flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-950 block">3. Normal User (Aditi Verma)</span>
                  <span className="text-[10px] text-amber-700">user@foodcovering.com • Donations & complaints</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLoginAndNavigate('user@foodcovering.com', 'User@123')}
                    className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-2 py-0.5 rounded shadow-2xs cursor-pointer transition-colors"
                  >
                    1-Click
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('user@foodcovering.com', 'User@123')}
                    className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-50 cursor-pointer"
                  >
                    Fill
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Citizen Registration Link */}
          <div className="mt-5 text-center text-xs text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
              Register as Citizen / Donor
            </Link>
          </div>
        </div>
      </div>

      {/* Footer & Language Controls */}
      <div className="mt-8 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-medium text-slate-500">
            Protected by FoodCovering Zero-Trust Role Based Enforcement
          </span>
        </div>

        <select
          className="text-xs bg-transparent border border-slate-300 rounded-lg px-2.5 py-1 text-slate-600 font-medium cursor-pointer mb-3"
          onChange={changeLanguage}
          value={i18n.language ? i18n.language.split('-')[0] : 'en'}
        >
          <option value="en">English (EN)</option>
          <option value="ta">தமிழ் (TA)</option>
          <option value="hi">हिन्दी (HI)</option>
        </select>

        <div className="flex space-x-6 text-xs text-slate-400">
          <a href="#" className="hover:text-slate-600">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600">Terms of Service</a>
          <a href="#" className="hover:text-slate-600">FSSAI Compliance</a>
          <a href="#" className="hover:text-slate-600">Support</a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your registered email address and we'll send you an administrative verification link.
            </p>

            {forgotSent ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verification instructions sent to your email. Check inbox.</span>
              </div>
            ) : (
              <input
                type="email"
                placeholder="user@example.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                defaultValue={email}
              />
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(false);
                  setForgotSent(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              {!forgotSent && (
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Send Reset Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
