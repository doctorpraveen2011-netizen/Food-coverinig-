import { useState } from 'react';
import { Settings as SettingsIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import PlatformIntegrationsCard from '../components/settings/PlatformIntegrationsCard';
import NotificationPreferencesCard from '../components/settings/NotificationPreferencesCard';
import LiveTrackingContactsCard from '../components/settings/LiveTrackingContactsCard';
import LiveInfrastructureCard from '../components/settings/LiveInfrastructureCard';
import SocDashboardCard from '../components/settings/SocDashboardCard';
import IncidentDetailsPanel from '../components/settings/IncidentDetailsPanel';
import type { SocEvent, IncidentStatusType, IncidentStage } from '../components/settings/IncidentDetailsPanel';

const INITIAL_EVENTS: SocEvent[] = [
  {
    id: 'SOC-2026-001',
    time: '28 Sep 2026, 14:32',
    eventType: 'Repeated Login Failures',
    source: '192.168.1.45',
    severity: 'Critical',
    status: 'Open',
    stage: 'Investigation',
    affectedComponent: 'Authentication API',
    description: 'Multiple failed login attempts detected from the same IP address within a short time window. Possible brute force attack.',
    recommendedActions: [
      'Temporarily block the IP address',
      'Enable additional verification',
      'Monitor for further attempts'
    ],
    investigationNotes: 'No action taken yet. Under review.',
    isSimulatedDemo: true
  },
  {
    id: 'SOC-2026-002',
    time: '28 Sep 2026, 13:18',
    eventType: 'Excessive OTP Requests',
    source: '103.22.45.67',
    severity: 'High',
    status: 'Investigating',
    stage: 'Investigation',
    affectedComponent: 'SMS Verification Service',
    description: 'Spike in donation mobile verification requests exceeding threshold (45 OTPs / min).',
    recommendedActions: [
      'Apply SMS rate-limiting policy',
      'Verify phone number reputational score',
      'Throttle requests by subnet'
    ],
    investigationNotes: 'Automated throttle applied. Monitoring recipient carrier logs.',
    isSimulatedDemo: true
  },
  {
    id: 'SOC-2026-003',
    time: '28 Sep 2026, 12:46',
    eventType: 'Unauthorized API Access',
    source: '185.199.110.23',
    severity: 'Critical',
    status: 'Open',
    stage: 'Alert',
    affectedComponent: 'Admin Endpoints Gateway',
    description: 'Direct unauthenticated invocation attempt on administrative tracking configuration.',
    recommendedActions: [
      'Enforce JWT bearer authentication',
      'Blacklist IP on edge firewall',
      'Audit administrative API logs'
    ],
    investigationNotes: 'Pending SOC engineer review.',
    isSimulatedDemo: true
  },
  {
    id: 'SOC-2026-004',
    time: '28 Sep 2026, 11:27',
    eventType: 'Gateway Config Change',
    source: '10.0.0.12',
    severity: 'High',
    status: 'Investigating',
    stage: 'Investigation',
    affectedComponent: 'Edge Gateway',
    description: 'Firewall ingress routing modified outside designated maintenance window.',
    recommendedActions: [
      'Revert unverified route modifications',
      'Audit administrative IAM credentials',
      'Require multi-factor confirmation for gateway changes'
    ],
    investigationNotes: 'Cross-checking change management ticket #CHG-4912.',
    isSimulatedDemo: true
  },
  {
    id: 'SOC-2026-005',
    time: '28 Sep 2026, 10:03',
    eventType: 'Rate Limit Exceeded',
    source: '172.16.4.87',
    severity: 'Medium',
    status: 'Resolved',
    stage: 'Resolution',
    affectedComponent: 'Food Analysis API',
    description: 'Client exceeded maximum 60 requests per minute quota for food waste classification.',
    recommendedActions: [
      'Temporary 15-minute cool-down enforced',
      'Advise client regarding batch evaluation API'
    ],
    investigationNotes: 'Client throttle expired. Traffic normalized without error.',
    isSimulatedDemo: true
  }
];

const INITIAL_METRICS = {
  securityEvents: 12,
  threatsDetected: 5,
  requestsBlocked: 3,
  underInvestigation: 2
};

export default function Settings() {
  const [events, setEvents] = useState<SocEvent[]>(INITIAL_EVENTS);
  const [selectedIncident, setSelectedIncident] = useState<SocEvent | null>(INITIAL_EVENTS[0]);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const handleSimulateScenario = (scenario: string) => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeFormatted = `${day} ${months[now.getMonth()]} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const randNum = Math.floor(Math.random() * 900) + 100;

    let newEvent: SocEvent;

    switch (scenario) {
      case 'Excessive OTP Requests':
        newEvent = {
          id: `SOC-SIM-${randNum}`,
          time: timeFormatted,
          eventType: 'Excessive OTP Requests',
          source: `103.22.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 200)}`,
          severity: 'High',
          status: 'Open',
          stage: 'Alert',
          affectedComponent: 'SMS Verification Service',
          description: 'Surge in simulated SMS verification OTP calls detected from single carrier gateway.',
          recommendedActions: [
            'Apply temporary carrier rate-limit throttle',
            'Enforce client CAPTCHA requirement',
            'Monitor SMS dispatch queue'
          ],
          investigationNotes: 'Simulated OTP attack triggered in Demo Mode.',
          isSimulatedDemo: true
        };
        break;

      case 'Unauthorized API Access':
        newEvent = {
          id: `SOC-SIM-${randNum}`,
          time: timeFormatted,
          eventType: 'Unauthorized API Access',
          source: `185.199.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 200)}`,
          severity: 'Critical',
          status: 'Open',
          stage: 'Alert',
          affectedComponent: 'Admin Endpoints Gateway',
          description: 'Simulated unauthenticated access probe to internal settings API.',
          recommendedActions: [
            'Block offending remote subnet',
            'Verify JWT bearer token configuration',
            'Review authentication gateway access logs'
          ],
          investigationNotes: 'Simulated API intrusion attempt.',
          isSimulatedDemo: true
        };
        break;

      case 'Gateway Config Change':
        newEvent = {
          id: `SOC-SIM-${randNum}`,
          time: timeFormatted,
          eventType: 'Gateway Config Change',
          source: `10.0.0.${Math.floor(Math.random() * 50) + 1}`,
          severity: 'High',
          status: 'Investigating',
          stage: 'Investigation',
          affectedComponent: 'Edge Gateway',
          description: 'Simulated unauthorized firewall routing alteration.',
          recommendedActions: [
            'Audit administrative IAM credentials',
            'Roll back configuration snapshot',
            'Enable multi-signature approval'
          ],
          investigationNotes: 'Simulated configuration tampering scenario.',
          isSimulatedDemo: true
        };
        break;

      case 'Rate Limit Exceeded':
        newEvent = {
          id: `SOC-SIM-${randNum}`,
          time: timeFormatted,
          eventType: 'Rate Limit Exceeded',
          source: `172.16.${Math.floor(Math.random() * 30)}.${Math.floor(Math.random() * 200)}`,
          severity: 'Medium',
          status: 'Open',
          stage: 'Alert',
          affectedComponent: 'Food Analysis API',
          description: 'Simulated volume spike exceeding 60 requests per minute quota.',
          recommendedActions: [
            'Throttle client requests for 15 minutes',
            'Verify API usage tier',
            'Inspect query patterns'
          ],
          investigationNotes: 'Simulated rate-limit enforcement.',
          isSimulatedDemo: true
        };
        break;

      case 'Repeated Login Failures':
      default:
        newEvent = {
          id: `SOC-SIM-${randNum}`,
          time: timeFormatted,
          eventType: 'Repeated Login Failures',
          source: `192.168.1.${Math.floor(Math.random() * 200) + 10}`,
          severity: 'Critical',
          status: 'Open',
          stage: 'Investigation',
          affectedComponent: 'Authentication API',
          description: 'Multiple simulated failed login attempts detected in rapid succession. Potential brute-force.',
          recommendedActions: [
            'Temporarily block IP address',
            'Enable additional MFA verification',
            'Monitor for distributed credential stuffing'
          ],
          investigationNotes: 'Simulated brute-force attack event logged.',
          isSimulatedDemo: true
        };
        break;
    }

    setEvents((prev) => [newEvent, ...prev]);
    setSelectedIncident(newEvent);

    setMetrics((prev) => ({
      securityEvents: prev.securityEvents + 1,
      threatsDetected: newEvent.severity === 'Critical' || newEvent.severity === 'High' ? prev.threatsDetected + 1 : prev.threatsDetected,
      requestsBlocked: newEvent.eventType === 'Rate Limit Exceeded' || newEvent.eventType === 'Unauthorized API Access' ? prev.requestsBlocked + 1 : prev.requestsBlocked,
      underInvestigation: newEvent.status === 'Investigating' ? prev.underInvestigation + 1 : prev.underInvestigation
    }));

    showToast(`Simulated Event Triggered: "${newEvent.eventType}" (${newEvent.severity})`);
  };

  const handleResetDemo = () => {
    setEvents(INITIAL_EVENTS);
    setSelectedIncident(INITIAL_EVENTS[0]);
    setMetrics(INITIAL_METRICS);
    showToast('SOC Demo state reset to initial baseline.');
  };

  const handleUpdateStatus = (id: string, status: IncidentStatusType, stage: IncidentStage) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, status, stage } : ev))
    );

    if (selectedIncident?.id === id) {
      setSelectedIncident((prev) => (prev ? { ...prev, status, stage } : null));
    }

    if (status === 'Resolved') {
      setMetrics((prev) => ({
        ...prev,
        underInvestigation: Math.max(0, prev.underInvestigation - 1)
      }));
      showToast(`Incident marked as Resolved.`);
    } else if (status === 'Investigating') {
      setMetrics((prev) => ({
        ...prev,
        underInvestigation: prev.underInvestigation + 1
      }));
      showToast(`Incident marked as Investigating.`);
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, investigationNotes: notes } : ev))
    );
    if (selectedIncident?.id === id) {
      setSelectedIncident((prev) => (prev ? { ...prev, investigationNotes: notes } : null));
    }
    showToast('Investigation notes saved.');
  };

  return (
    <div className="space-y-2.5 max-w-7xl mx-auto">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg shadow-lg border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-red-900 text-white border-red-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Page Title & Subtitle */}
      <div className="flex items-center gap-2.5 pb-1 border-b border-gray-100">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <SettingsIcon className="w-4 h-4 text-gray-700" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">System Settings</h1>
          <p className="text-[11px] text-gray-500 leading-tight">Manage platform preferences and monitor live infrastructure.</p>
        </div>
      </div>

      {/* Row 1: Platform Integrations & Notification Preferences (Left) + Live Infrastructure (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* Left Column: Integrations & Notifications */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-2.5">
          <PlatformIntegrationsCard />
          <NotificationPreferencesCard onNotify={(msg) => showToast(msg)} />
        </div>

        {/* Right Column: Live Infrastructure */}
        <div className="lg:col-span-4 flex">
          <div className="w-full flex">
            <LiveInfrastructureCard />
          </div>
        </div>
      </div>

      {/* Row 2: Live Tracking Contacts (Admin) Card */}
      <div>
        <LiveTrackingContactsCard onNotify={(msg, type) => showToast(msg, type)} />
      </div>

      {/* Row 3: Security Operations Center (SOC) (Left) + Incident Details Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* Left Side: SOC Main Dashboard Card */}
        <div className={selectedIncident ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <SocDashboardCard
            events={events}
            selectedIncident={selectedIncident}
            onSelectIncident={(ev) => setSelectedIncident(ev)}
            onSimulateScenario={handleSimulateScenario}
            onResetDemo={handleResetDemo}
            metrics={metrics}
          />
        </div>

        {/* Right Side: Incident Details Panel */}
        {selectedIncident && (
          <div className="lg:col-span-4 flex">
            <div className="w-full flex">
              <IncidentDetailsPanel
                incident={selectedIncident}
                onClose={() => setSelectedIncident(null)}
                onUpdateStatus={handleUpdateStatus}
                onUpdateNotes={handleUpdateNotes}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
