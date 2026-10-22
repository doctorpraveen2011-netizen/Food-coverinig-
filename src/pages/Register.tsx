import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Leaf, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Globe, 
  ChevronDown, 
  Check 
} from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  getCurrentLanguage, 
  setGlobalLanguage, 
  type SupportedLanguage 
} from '../utils/languageCoordinator';

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const currentLang = (i18n.language ? i18n.language.split('-')[0] : getCurrentLanguage()) as SupportedLanguage;
  const activeLangOption = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !phone) {
      setErrorMessage(t('register.fullNamePlaceholder', 'Full name, email, phone number, and password are required.'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('register.passwordPlaceholder', 'Password must be at least 6 characters long.'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('register.confirmPasswordPlaceholder', 'Passwords do not match.'));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await register({
      fullName,
      email,
      phone,
      address,
      password,
      confirmPassword,
    });

    setIsLoading(false);

    if (result.success) {
      navigate('/user/dashboard', { replace: true });
    } else {
      setErrorMessage(result.error || 'Registration failed.');
    }
  };

  const selectLanguage = (code: SupportedLanguage) => {
    setGlobalLanguage(code);
    setIsLangOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Floating Language Switcher Bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-end mb-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full text-xs font-semibold text-slate-700 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
            title="Change platform language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-sm leading-none">{activeLangOption.flag}</span>
            <span className="text-xs font-bold text-slate-800">{activeLangOption.nativeName}</span>
            <span className="text-[10px] uppercase font-mono text-slate-400">({activeLangOption.code})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  {t('navbar.selectLanguage', 'Select Language')}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                  8 Languages
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = currentLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => selectLanguage(lang.code)}
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
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mb-3 shadow-xs">
          <Leaf className="w-6 h-6 fill-current" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {t('register.title', 'Create Citizen / Donor Account')}
        </h2>
        <p className="mt-1 text-xs text-emerald-700 font-semibold">
          {t('slogan', 'Safe Food • Healthy Tomorrow')}
        </p>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          {t('register.subtitle', 'Join the FoodCovering network to donate surplus food and protect your community.')}
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('register.fullName', 'Full Name')} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('register.fullNamePlaceholder', 'Enter your full name')}
                className="appearance-none block w-full px-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('register.email', 'Email Address')} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('register.emailPlaceholder', 'you@example.com')}
                className="appearance-none block w-full px-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('register.phone', 'Phone Number')} *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('register.phonePlaceholder', '+91 98765 43210')}
                className="appearance-none block w-full px-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('register.address', 'Address / City / Area')}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('register.addressPlaceholder', 'e.g. Sector 4, Anna Nagar')}
                className="appearance-none block w-full px-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('register.password', 'Password')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('register.passwordPlaceholder', 'At least 6 characters')}
                    className="appearance-none block w-full px-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 pr-8"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('register.confirmPassword', 'Confirm Password')} *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('register.confirmPasswordPlaceholder', 'Re-enter your password')}
                  className="appearance-none block w-full px-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 cursor-pointer transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('register.submitting', 'Creating Account...')}</span>
                  </>
                ) : (
                  <span>{t('register.submitBtn', 'REGISTER ACCOUNT')}</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center text-xs text-slate-600">
            {t('register.hasAccount', 'Already have an account?')}{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
              {t('register.loginLink', 'Sign in here')}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>{t('login.zeroTrust', 'Protected by FoodCovering Zero-Trust Role Based Enforcement')}</span>
      </div>
    </div>
  );
}
