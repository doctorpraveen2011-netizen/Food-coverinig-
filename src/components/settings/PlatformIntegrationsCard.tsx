import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  status: 'Connected' | 'Not configured' | 'Degraded';
  iconType: 'google' | 'aws';
}

export default function PlatformIntegrationsCard() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: 'google-maps',
      name: 'Google Maps API',
      description: 'Location services and map features',
      status: 'Connected',
      iconType: 'google'
    },
    {
      id: 'aws-ml',
      name: 'AWS ML Service',
      description: 'AI/ML powered food analysis',
      status: 'Connected',
      iconType: 'aws'
    }
  ]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
        const res = await fetch(`${backendUrl}/api/v1/settings/integrations`);
        if (res.ok) {
          const data = await res.json();
          setIntegrations([
            {
              id: 'google-maps',
              name: data.googleMaps?.name || 'Google Maps API',
              description: data.googleMaps?.description || 'Location services and map features',
              status: data.googleMaps?.status || 'Connected',
              iconType: 'google'
            },
            {
              id: 'aws-ml',
              name: data.awsMl?.name || 'AWS ML Service',
              description: data.awsMl?.description || 'AI/ML powered food analysis',
              status: data.awsMl?.status || 'Connected',
              iconType: 'aws'
            }
          ]);
        }
      } catch (e) {
        // Fallback to default connected demo state
      }
    };
    fetchStatus();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3">
      <h3 className="text-xs font-bold text-gray-900 mb-2 tracking-tight">Platform Integrations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="border border-gray-100 hover:border-gray-200 bg-white rounded-lg p-2.5 flex items-center justify-between shadow-2xs transition-all"
          >
            <div className="flex items-center gap-2.5">
              {item.iconType === 'google' ? (
                <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <path fill="#EA4335" d="M12 4a5 5 0 0 0-5 5c0 3.2 3.6 8 5 9.7 1.4-1.7 5-6.5 5-9.7a5 5 0 0 0-5-5z"/>
                    <circle fill="#FBBC05" cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#FFF5EA] border border-[#FFE1C4] flex items-center justify-center shrink-0">
                  <span className="font-extrabold text-[11px] text-[#FF9900] tracking-tighter">aws</span>
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold text-gray-900 leading-tight">{item.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
