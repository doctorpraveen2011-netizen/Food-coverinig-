import React from 'react';
import { 
  Mail, 
  MessageSquare, 
  Users, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  Sliders, 
  FileText
} from 'lucide-react';
import { useAlertsStore } from '../../store/useAlertsStore';

interface OverviewTabProps {
  onNavigateTab: (tab: 'email' | 'sms' | 'auto-assign') => void;
  onOpenDetails: (type: 'email' | 'sms' | 'auto-assign') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateTab, onOpenDetails }) => {
  const { 
    emailAlertsEnabled, 
    smsAlertsEnabled, 
    autoAssignEnabled, 
    emailProvider, 
    smsProvider, 
    autoAssignEngine,
    emailRules,
    emailTemplates,
    smsRules,
    smsTemplates,
    assignmentRules
  } = useAlertsStore();

  const activeEmailRulesCount = emailRules.filter(r => r.enabled).length;
  const activeSmsRulesCount = smsRules.filter(r => r.enabled).length;
  const activeAssignRulesCount = assignmentRules.filter(r => r.enabled).length;

  return (
    <div className="space-y-4">
      {/* 3 Main Action Cards matching the screenshot */}
      
      {/* Card 1: Email Alerts */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 lg:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Icon + Title + Description + Badges */}
          <div className="flex items-start gap-4 lg:w-[38%]">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <Mail className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">Email Alerts</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Configure email notifications, manage templates, and track delivery status.
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  emailAlertsEnabled 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${emailAlertsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {emailAlertsEnabled ? 'Email alerts are enabled' : 'Email alerts disabled'}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200/80">
                  Provider: {emailProvider.name}
                </span>
              </div>
            </div>
          </div>

          {/* Center Column: 3 Metadata items */}
          <div className="lg:w-[32%] py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-gray-100 lg:px-6 space-y-3">
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-800 block leading-tight">Rules Configuration</span>
                <span className="text-[11px] text-gray-500">{activeEmailRulesCount} active rules</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-800 block leading-tight">Email Templates</span>
                <span className="text-[11px] text-gray-500">{emailTemplates.length} templates</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-800 block leading-tight">Delivery History</span>
                <span className="text-[11px] text-gray-500">Last 24 hours: 124 sent</span>
              </div>
            </div>
          </div>

          {/* Right Column: 2 Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:w-[22%] shrink-0">
            <button 
              onClick={() => onOpenDetails('email')}
              className="w-full px-4 py-2 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs rounded-xl transition-all shadow-2xs active:scale-[0.98] text-center"
            >
              View Details
            </button>
            <button 
              onClick={() => onNavigateTab('email')}
              className="w-full px-4 py-2 bg-[#065F46] hover:bg-[#044E3A] text-white font-medium text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <span>Manage Email Alerts</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: SMS Alerts */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 lg:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column */}
          <div className="flex items-start gap-4 lg:w-[38%]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
              <MessageSquare className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">SMS Alerts</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Set up SMS notifications, manage templates, and track delivery status.
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  smsAlertsEnabled 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${smsAlertsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {smsAlertsEnabled ? 'SMS alerts are enabled' : 'SMS alerts disabled'}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200/80">
                  Provider: {smsProvider.name}
                </span>
              </div>
            </div>
          </div>

          {/* Center Column */}
          <div className="lg:w-[32%] py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-gray-100 lg:px-6 space-y-3">
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-800 block leading-tight">Rules Configuration</span>
                <span className="text-[11px] text-gray-500">{activeSmsRulesCount} active rules</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-800 block leading-tight">Message Templates</span>
                <span className="text-[11px] text-gray-500">{smsTemplates.length} templates</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-800 block leading-tight">Delivery History</span>
                <span className="text-[11px] text-gray-500">Last 24 hours: 98 sent</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:w-[22%] shrink-0">
            <button 
              onClick={() => onOpenDetails('sms')}
              className="w-full px-4 py-2 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs rounded-xl transition-all shadow-2xs active:scale-[0.98] text-center"
            >
              View Details
            </button>
            <button 
              onClick={() => onNavigateTab('sms')}
              className="w-full px-4 py-2 bg-[#065F46] hover:bg-[#044E3A] text-white font-medium text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <span>Manage SMS Alerts</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Card 3: Auto-Assign Volunteers */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 lg:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column */}
          <div className="flex items-start gap-4 lg:w-[38%]">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 shadow-2xs">
              <Users className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">Auto-Assign Volunteers</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Automatically assign volunteers to pickup requests based on location, availability and skills.
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  autoAssignEnabled 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${autoAssignEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {autoAssignEnabled ? 'Auto-assignment is enabled' : 'Auto-assignment disabled'}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200/80">
                  Engine: {autoAssignEngine.status}
                </span>
              </div>
            </div>
          </div>

          {/* Center Column */}
          <div className="lg:w-[32%] py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-gray-100 lg:px-6 space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-800 block leading-tight">Assignment Rules</span>
                <span className="text-[11px] text-gray-500">{activeAssignRulesCount} configured rules</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-800 block leading-tight">Assignment History</span>
                <span className="text-[11px] text-gray-500">Last 24 hours: 12 assignments</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-800 block leading-tight">Volunteer Pool</span>
                <span className="text-[11px] text-gray-500">342 active volunteers</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:w-[22%] shrink-0">
            <button 
              onClick={() => onOpenDetails('auto-assign')}
              className="w-full px-4 py-2 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs rounded-xl transition-all shadow-2xs active:scale-[0.98] text-center"
            >
              View Details
            </button>
            <button 
              onClick={() => onNavigateTab('auto-assign')}
              className="w-full px-4 py-2 bg-[#065F46] hover:bg-[#044E3A] text-white font-medium text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <span>Manage Assignments</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
