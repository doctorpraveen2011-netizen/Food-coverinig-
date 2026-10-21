import { useState, useEffect, useCallback } from 'react';
import { Cpu, HardDrive, Wifi, Server, RotateCw } from 'lucide-react';
import { usePipelineStore } from '../../store/usePipelineStore';
import { getBackendUrl } from '../../utils/apiConfig';

interface InfrastructureMetrics {
  status: 'Online' | 'Degraded' | 'Offline';
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
  lastUpdatedText: string;
  summary: string;
}

export default function LiveInfrastructureCard() {
  const { systemMetrics } = usePipelineStore();

  const [metrics, setMetrics] = useState<InfrastructureMetrics>({
    status: 'Online',
    cpuUsage: 11,
    memoryUsage: 12,
    latency: 26,
    lastUpdatedText: '28 Sep 2026, 14:32',
    summary: 'All services are running normally.'
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatTimestamp = (d: Date = new Date()) => {
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${mins}`;
  };

  const fetchMetrics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        try {
          const res = await fetch(`${backendUrl}/api/v1/system/infrastructure`, { signal: AbortSignal.timeout(2000) });
          if (res.ok) {
            const data = await res.json();
            setMetrics({
              status: data.status || 'Online',
              cpuUsage: typeof data.cpuUsage === 'number' ? data.cpuUsage : 11,
              memoryUsage: typeof data.memoryUsage === 'number' ? data.memoryUsage : 12,
              latency: typeof data.latency === 'number' ? data.latency : 26,
              lastUpdatedText: formatTimestamp(new Date()),
              summary: data.summary || 'All services are running normally.'
            });
            return;
          }
        } catch (e) {}
      }
      if (systemMetrics && systemMetrics.cpuUsage > 0) {
        setMetrics(prev => ({
          ...prev,
          cpuUsage: systemMetrics.cpuUsage,
          memoryUsage: systemMetrics.memoryUsage,
          latency: systemMetrics.latency || 26,
          lastUpdatedText: formatTimestamp(new Date())
        }));
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [systemMetrics]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 8000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3 flex flex-col justify-between w-full h-full">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-0.5">
          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Live Infrastructure</h3>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-semibold text-emerald-600">Online</span>
          </div>
        </div>

        {/* Timestamp & Refresh Button */}
        <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 mb-2">
          <span>Last updated: {metrics.lastUpdatedText}</span>
          <button
            onClick={fetchMetrics}
            disabled={isRefreshing}
            className="p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all cursor-pointer"
            title="Refresh infrastructure metrics"
            aria-label="Refresh metrics"
          >
            <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Metrics Rows */}
        <div className="space-y-2">
          {/* CPU Usage */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <div className="flex items-center gap-1.5 text-gray-700">
                <div className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Cpu className="w-3 h-3" />
                </div>
                <span className="font-semibold text-gray-800 text-[10px]">CPU Usage</span>
              </div>
              <span className="font-bold text-gray-900 text-[10px] font-mono">{metrics.cpuUsage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, metrics.cpuUsage))}%` }}
              ></div>
            </div>
          </div>

          {/* Memory Usage */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <div className="flex items-center gap-1.5 text-gray-700">
                <div className="w-5 h-5 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                  <HardDrive className="w-3 h-3" />
                </div>
                <span className="font-semibold text-gray-800 text-[10px]">Memory Usage</span>
              </div>
              <span className="font-bold text-gray-900 text-[10px] font-mono">{metrics.memoryUsage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, metrics.memoryUsage))}%` }}
              ></div>
            </div>
          </div>

          {/* Network Latency */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <div className="flex items-center gap-1.5 text-gray-700">
                <div className="w-5 h-5 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Wifi className="w-3 h-3" />
                </div>
                <span className="font-semibold text-gray-800 text-[10px]">Network Latency</span>
              </div>
              <span className="font-bold text-gray-900 text-[10px] font-mono">{metrics.latency}ms</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, (metrics.latency / 100) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Summary Box */}
      <div className="mt-2.5 bg-emerald-50/70 border border-emerald-100/90 rounded-lg p-2 flex items-start gap-2">
        <div className="w-6 h-6 rounded bg-white border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
          <Server className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-gray-900 leading-tight">System Status</h4>
          <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">{metrics.summary}</p>
        </div>
      </div>
    </div>
  );
}
