import { useState } from 'react';
import { Mail, MessageSquare, Users } from 'lucide-react';

interface NotificationConfig {
  emailAlerts: boolean;
  smsNotifications: boolean;
  autoAssignVolunteers: boolean;
}

interface NotificationPreferencesCardProps {
  onNotify?: (message: string) => void;
}

export default function NotificationPreferencesCard({ onNotify }: NotificationPreferencesCardProps) {
  const [preferences, setPreferences] = useState<NotificationConfig>(() => {
    const saved = localStorage.getItem('fc_notification_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      emailAlerts: true,
      smsNotifications: false,
      autoAssignVolunteers: true
    };
  });

  const updatePreference = (key: keyof NotificationConfig, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('fc_notification_preferences', JSON.stringify(updated));
    if (onNotify) {
      const titles: Record<keyof NotificationConfig, string> = {
        emailAlerts: 'Email Alerts',
        smsNotifications: 'SMS Notifications',
        autoAssignVolunteers: 'Auto-Assign Volunteers'
      };
      onNotify(`${titles[key]} ${value ? 'enabled' : 'disabled'}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3">
      <h3 className="text-xs font-bold text-gray-900 mb-2 tracking-tight">Notification Preferences</h3>
      <div className="space-y-2 divide-y divide-gray-50">
        {/* Email Alerts */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 text-gray-600 flex items-center justify-center shrink-0">
              <Mail className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-900 leading-tight">Email Alerts</p>
              <p className="text-[10px] text-gray-500">Receive daily summaries and critical alerts.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={preferences.emailAlerts}
              onChange={(e) => updatePreference('emailAlerts', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* SMS Notifications */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 text-gray-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-900 leading-tight">SMS Notifications</p>
              <p className="text-[10px] text-gray-500">Instant alerts for new donation pickups.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={preferences.smsNotifications}
              onChange={(e) => updatePreference('smsNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Auto-Assign Volunteers */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 text-gray-600 flex items-center justify-center shrink-0">
              <Users className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-900 leading-tight">Auto-Assign Volunteers</p>
              <p className="text-[10px] text-gray-500">Automatically ping nearest volunteer for new donations.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={preferences.autoAssignVolunteers}
              onChange={(e) => updatePreference('autoAssignVolunteers', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
