import { useState } from 'react';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Users, 
  Clock, 
  Send, 
  Sparkles 
} from 'lucide-react';
import { useAlertsStore } from '../store/useAlertsStore';
import type { AlertRule, EmailTemplate, SmsTemplate } from '../store/useAlertsStore';
import { OverviewTab } from '../components/alerts/OverviewTab';
import { EmailAlertsTab } from '../components/alerts/EmailAlertsTab';
import { SmsAlertsTab } from '../components/alerts/SmsAlertsTab';
import { AutoAssignTab } from '../components/alerts/AutoAssignTab';
import { ViewDetailsModal } from '../components/alerts/ViewDetailsModal';
import { TestAlertModal } from '../components/alerts/TestAlertModal';
import { RuleEditorModal } from '../components/alerts/RuleEditorModal';
import { TemplateEditorModal } from '../components/alerts/TemplateEditorModal';

type ActiveTab = 'overview' | 'email' | 'sms' | 'auto-assign';

export default function AlertsNotifications() {
  const { stats, triggerAutoAssignmentBatch } = useAlertsStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [detailsType, setDetailsType] = useState<'email' | 'sms' | 'auto-assign' | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testModalChannel, setTestModalChannel] = useState<'email' | 'sms' | 'auto'>('email');

  // Rule & Template Editing
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [editingRuleChannel, setEditingRuleChannel] = useState<'email' | 'sms' | 'assign'>('email');
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<EmailTemplate | null>(null);
  const [editingSmsTemplate, setEditingSmsTemplate] = useState<SmsTemplate | null>(null);

  const openTestModal = (channel: 'email' | 'sms' | 'auto' = 'email') => {
    setTestModalChannel(channel);
    setIsTestModalOpen(true);
  };

  const handleEditRule = (channel: 'email' | 'sms' | 'assign', rule: AlertRule) => {
    setEditingRuleChannel(channel);
    setEditingRule(rule);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex items-center justify-center text-gray-700 shrink-0 mt-0.5">
            <Bell className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Alerts & Notifications
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Monitor notification delivery, manage alert rules, and automate volunteer assignments.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openTestModal('email')}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>Send Test Alert</span>
          </button>

          <button
            onClick={() => {
              triggerAutoAssignmentBatch();
            }}
            className="px-3.5 py-2 bg-[#065F46] hover:bg-[#044E3A] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Dispatch</span>
          </button>
        </div>
      </div>

      {/* 4 Metric / KPI Cards (Matching Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Alerts */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-xs transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100/60">
            <Bell className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {stats.totalAlerts.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-gray-700 mt-0.5">Total Alerts</div>
            <div className="text-[11px] text-gray-400 mt-0.5">All generated alerts</div>
          </div>
        </div>

        {/* Card 2: Emails Sent */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-xs transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 border border-emerald-100/60">
            <Mail className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {stats.emailsSent.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-gray-700 mt-0.5">Emails Sent</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Successfully delivered</div>
          </div>
        </div>

        {/* Card 3: SMS Sent */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-xs transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100/60">
            <MessageSquare className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {stats.smsSent.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-gray-700 mt-0.5">SMS Sent</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Successfully submitted</div>
          </div>
        </div>

        {/* Card 4: Pending Alerts */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-xs transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0 border border-amber-100/60">
            <Clock className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {stats.pendingAlerts.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-gray-700 mt-0.5">Pending Alerts</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Waiting to be processed</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Overview, Email Alerts, SMS Alerts, Auto-Assign Volunteers) */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 sm:space-x-8 -mb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`py-3 px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'email'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Mail className="w-4 h-4 stroke-[2]" />
            <span>Email Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`py-3 px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'sms'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 stroke-[2]" />
            <span>SMS Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('auto-assign')}
            className={`py-3 px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'auto-assign'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4 stroke-[2]" />
            <span>Auto-Assign Volunteers</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenDetails={(type) => setDetailsType(type)}
          />
        )}

        {activeTab === 'email' && (
          <EmailAlertsTab
            onOpenTestModal={openTestModal}
            onEditTemplate={(tpl) => setEditingEmailTemplate(tpl)}
            onEditRule={(rule) => handleEditRule('email', rule)}
          />
        )}

        {activeTab === 'sms' && (
          <SmsAlertsTab
            onOpenTestModal={openTestModal}
            onEditTemplate={(tpl) => setEditingSmsTemplate(tpl)}
            onEditRule={(rule) => handleEditRule('sms', rule)}
          />
        )}

        {activeTab === 'auto-assign' && (
          <AutoAssignTab
            onOpenTestModal={openTestModal}
          />
        )}
      </div>

      {/* Modals & Dialogs */}
      <ViewDetailsModal
        type={detailsType}
        onClose={() => setDetailsType(null)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setDetailsType(null);
        }}
      />

      <TestAlertModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        defaultChannel={testModalChannel}
      />

      <RuleEditorModal
        rule={editingRule}
        channel={editingRuleChannel}
        onClose={() => setEditingRule(null)}
      />

      <TemplateEditorModal
        emailTemplate={editingEmailTemplate}
        smsTemplate={editingSmsTemplate}
        onClose={() => {
          setEditingEmailTemplate(null);
          setEditingSmsTemplate(null);
        }}
      />
    </div>
  );
}
