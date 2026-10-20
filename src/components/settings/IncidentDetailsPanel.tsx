import { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Globe, 
  Shield, 
  FileText, 
  ShieldCheck, 
  Edit3, 
  CheckCircle2, 
  Save
} from 'lucide-react';

export type SeverityType = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatusType = 'Open' | 'Investigating' | 'Resolved';
export type IncidentStage = 'Detection' | 'Alert' | 'Investigation' | 'Resolution';

export interface SocEvent {
  id: string;
  time: string;
  eventType: string;
  source: string;
  severity: SeverityType;
  status: IncidentStatusType;
  stage: IncidentStage;
  affectedComponent: string;
  description: string;
  recommendedActions: string[];
  investigationNotes: string;
  isSimulatedDemo: boolean;
}

interface IncidentDetailsPanelProps {
  incident: SocEvent | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: IncidentStatusType, stage: IncidentStage) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

export default function IncidentDetailsPanel({
  incident,
  onClose,
  onUpdateStatus,
  onUpdateNotes
}: IncidentDetailsPanelProps) {
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (incident) {
      setNotes(incident.investigationNotes);
      setIsEditingNotes(false);
    }
  }, [incident]);

  if (!incident) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <Shield className="w-8 h-8 text-gray-300 mb-1.5" />
        <h4 className="text-[11px] font-bold text-gray-800">No Incident Selected</h4>
        <p className="text-[10px] text-gray-400 max-w-[180px] mt-0.5">
          Click &ldquo;View&rdquo; on any security event to inspect details.
        </p>
      </div>
    );
  }

  const handleSaveNotes = () => {
    onUpdateNotes(incident.id, notes);
    setIsEditingNotes(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const getSeverityBadgeClass = (severity: SeverityType) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Medium':
        return 'bg-emerald-600 text-white';
      case 'Low':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const stageIndex = {
    Detection: 1,
    Alert: 2,
    Investigation: 3,
    Resolution: 4
  }[incident.stage] || 3;

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3 space-y-2 relative flex flex-col justify-between h-full">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Incident Details</h3>
          <button
            onClick={onClose}
            className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            aria-label="Close details panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Severity Badge & Title */}
        <div className="pt-1">
          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full ${getSeverityBadgeClass(incident.severity)}`}>
            {incident.severity}
          </span>
          <h4 className="text-xs font-bold text-gray-900 mt-0.5 leading-tight">
            {incident.eventType}
          </h4>
        </div>

        {/* Key Information Fields */}
        <div className="mt-2 space-y-1.5 text-[10px]">
          {/* Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
            <div className="flex-1 flex justify-between">
              <span className="text-gray-500 font-medium">Time</span>
              <span className="font-semibold text-gray-900">{incident.time}</span>
            </div>
          </div>

          {/* Source IP */}
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-gray-400 shrink-0" />
            <div className="flex-1 flex justify-between">
              <span className="text-gray-500 font-medium">Source IP</span>
              <span className="font-mono font-semibold text-gray-900">{incident.source}</span>
            </div>
          </div>

          {/* Affected Component */}
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-gray-400 shrink-0" />
            <div className="flex-1 flex justify-between">
              <span className="text-gray-500 font-medium">Affected Component</span>
              <span className="font-semibold text-gray-900">{incident.affectedComponent}</span>
            </div>
          </div>

          {/* Description */}
          <div className="pt-0.5">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium mb-0.5">
              <FileText className="w-3 h-3 text-gray-400" />
              <span>Description</span>
            </div>
            <p className="text-[10px] text-gray-700 leading-tight bg-gray-50/80 rounded-lg p-1.5 border border-gray-100">
              {incident.description}
            </p>
          </div>

          {/* Recommended Action */}
          <div className="pt-0.5">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium mb-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Recommended Action</span>
            </div>
            <ul className="text-[10px] text-gray-700 space-y-0.5 bg-emerald-50/40 rounded-lg p-1.5 border border-emerald-100/60 leading-tight">
              {incident.recommendedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Investigation Notes */}
          <div className="pt-0.5">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1 text-gray-500 font-medium">
                <Edit3 className="w-3 h-3 text-gray-400" />
                <span>Investigation Notes</span>
              </div>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-[9px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-1">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full p-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 leading-tight"
                  placeholder="Enter response notes..."
                />
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => {
                      setNotes(incident.investigationNotes);
                      setIsEditingNotes(false);
                    }}
                    className="px-1.5 py-0.5 text-[9px] text-gray-500 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700"
                  >
                    <Save className="w-2.5 h-2.5" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-gray-700 italic bg-gray-50/80 rounded-lg p-1.5 border border-gray-100 leading-tight">
                {incident.investigationNotes || 'No notes added.'}
                {saveSuccess && <span className="ml-1 text-emerald-600 font-semibold not-italic">✓ Saved</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stepper Pipeline & Action Buttons */}
      <div className="pt-1.5 border-t border-gray-100 space-y-1.5">
        {/* 4 Stages Stepper */}
        <div className="flex items-center justify-between text-[9px] text-gray-500 px-0.5">
          {/* Step 1: Detection */}
          <div className="flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 fill-emerald-50" />
            <span className={stageIndex >= 1 ? 'font-semibold text-emerald-800' : ''}>Detection</span>
          </div>

          <span className="text-gray-300">→</span>

          {/* Step 2: Alert */}
          <div className="flex items-center gap-0.5">
            <CheckCircle2 className={`w-3 h-3 ${stageIndex >= 2 ? 'text-emerald-600 fill-emerald-50' : 'text-gray-300'}`} />
            <span className={stageIndex >= 2 ? 'font-semibold text-emerald-800' : ''}>Alert</span>
          </div>

          <span className="text-gray-300">→</span>

          {/* Step 3: Investigation */}
          <div className="flex items-center gap-0.5">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${
              stageIndex === 3 
                ? 'border-blue-600 text-blue-600 font-bold' 
                : stageIndex > 3 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'border-gray-300 text-gray-300'
            }`}>
              {stageIndex > 3 ? '✓' : <Clock className="w-2 h-2" />}
            </div>
            <span className={stageIndex === 3 ? 'font-semibold text-blue-700' : stageIndex > 3 ? 'text-emerald-800 font-semibold' : ''}>
              Investigation
            </span>
          </div>

          <span className="text-gray-300">→</span>

          {/* Step 4: Resolution */}
          <div className="flex items-center gap-0.5">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${
              stageIndex === 4 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'border-gray-300 text-gray-300'
            }`}>
              {stageIndex === 4 ? '✓' : ''}
            </div>
            <span className={stageIndex === 4 ? 'font-semibold text-emerald-800' : ''}>Resolution</span>
          </div>
        </div>

        {/* Action Buttons to Transition Status */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {incident.status === 'Open' && (
            <>
              <button
                onClick={() => onUpdateStatus(incident.id, 'Investigating', 'Alert')}
                className="flex-1 py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold rounded-md transition-colors"
              >
                Acknowledge
              </button>
              <button
                onClick={() => onUpdateStatus(incident.id, 'Investigating', 'Investigation')}
                className="flex-1 py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold rounded-md transition-colors"
              >
                Investigate
              </button>
            </>
          )}

          {incident.status === 'Investigating' && (
            <button
              onClick={() => onUpdateStatus(incident.id, 'Resolved', 'Resolution')}
              className="w-full py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              Resolve Incident
            </button>
          )}

          {incident.status === 'Resolved' && (
            <button
              onClick={() => onUpdateStatus(incident.id, 'Investigating', 'Investigation')}
              className="w-full py-1 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-semibold rounded-md transition-colors"
            >
              Reopen Incident
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
