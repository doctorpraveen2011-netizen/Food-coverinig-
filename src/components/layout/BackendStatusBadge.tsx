import { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, Cloud, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, X } from 'lucide-react';
import { getBackendUrl, setCustomBackendUrl, hasLiveBackend } from '../../utils/apiConfig';

export default function BackendStatusBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = getBackendUrl();
    setCurrentUrl(url);
    setInputUrl(localStorage.getItem('fc_backend_url') || url || '');
    setIsConnected(Boolean(url));
  }, []);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const clean = inputUrl.trim().replace(/\/$/, '');
    if (!clean) {
      setCustomBackendUrl('');
      setCurrentUrl('');
      setIsConnected(false);
      setTestResult({ success: true, message: 'Switched to Client Core (Offline Mode). Reloading...' });
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    try {
      const res = await fetch(`${clean}/api/v1/ml/status`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        setCustomBackendUrl(clean);
        setCurrentUrl(clean);
        setIsConnected(true);
        setTestResult({ success: true, message: 'Connected to live cloud backend! Reloading in 1s...' });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setCustomBackendUrl(clean);
        setCurrentUrl(clean);
        setIsConnected(true);
        setTestResult({ success: true, message: 'URL saved! Server returned HTTP ' + res.status });
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Could not connect to URL. Check HTTPS certificate and CORS settings on the server.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleReset = () => {
    setCustomBackendUrl('');
    setCurrentUrl('');
    setInputUrl('');
    setIsConnected(false);
    setTestResult({ success: true, message: 'Reset to default. Reloading...' });
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <>
      {/* Badge Button in Top Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
          isConnected
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
        }`}
        title="View Cloud Backend & API Sync Settings"
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
        </span>
        <Cloud className="w-3.5 h-3.5 opacity-70" />
        <span>{isConnected ? 'Cloud API Active' : 'Edge Core (Offline)'}</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Backend & Data Fetching Status</h3>
                <p className="text-xs text-slate-500">
                  {isConnected ? 'Connected to live REST & WebSocket server' : 'Running on high-performance in-browser Edge AI'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 font-medium">Current Active Endpoint:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {isConnected ? 'LIVE BACKEND' : 'OFFLINE CLIENT CORE'}
                  </span>
                </div>
                <div className="font-mono text-slate-800 break-all text-[11px] bg-white p-2 rounded border border-slate-200">
                  {currentUrl || '(Standalone In-Browser DB & Neural Engine Active)'}
                </div>
              </div>

              <form onSubmit={handleTestAndSave} className="space-y-2">
                <label className="block text-slate-700 font-semibold">
                  Custom Cloud Backend URL (Render / Railway / Heroku):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://your-foodcovering-api.onrender.com"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Connect'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Leave blank to use full offline in-browser fallback.
                </p>
              </form>

              {testResult && (
                <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-slate-500 hover:text-slate-800 text-[11px] underline"
                >
                  Reset to Default
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
