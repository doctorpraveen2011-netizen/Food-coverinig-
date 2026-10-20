import { 
  X, 
  Printer, 
  ShieldCheck, 
  QrCode, 
  User, 
  FileCheck 
} from 'lucide-react';
import { useComplaintsStore } from '../../store/useComplaintsStore';

export const PrintReportModal = () => {
  const { isPrintModalOpen, closePrintModal, selectedComplaintId, complaints } = useComplaintsStore();

  const complaint = complaints.find((c) => c.id === selectedComplaintId);

  if (!isPrintModalOpen || !complaint) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Controls Header */}
        <div className="px-6 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-gray-900">Official Case Dossier Preview</span>
            <span>• Case #{complaint.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={closePrintModal}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="flex-1 overflow-y-auto p-8 font-sans text-gray-900 bg-white space-y-6 print:p-0 print:m-0">
          {/* Government / Platform Official Header */}
          <div className="border-b-2 border-emerald-700 pb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-950 uppercase tracking-tight">
                  FoodCovering Safety Administration
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Official Food Safety Surveillance & Case Investigation Report
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  FSSAI Compliant Electronic Case Record • Standards Act, Section 38(1)
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="p-2 border border-gray-200 rounded-lg bg-gray-50 inline-block mb-1">
                <QrCode className="w-10 h-10 text-gray-800" />
              </div>
              <span className="font-mono text-xs font-bold text-emerald-800">{complaint.id}</span>
              <span className="text-[10px] text-gray-400">Security Hash: FC-9082-A</span>
            </div>
          </div>

          {/* Dossier Meta Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Case Status</span>
              <span className="font-bold text-emerald-700">{complaint.status}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Severity Level</span>
              <span className="font-bold text-red-600">{complaint.priority} Priority</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Date Reported</span>
              <span className="font-medium text-gray-800">{complaint.date} • {complaint.time}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Officer</span>
              <span className="font-bold text-gray-900">{complaint.assignedOfficer}</span>
            </div>
          </div>

          {/* Section 1: Product & Incident Information */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-gray-900 pb-1 border-b border-gray-200 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" /> Section I: Product Particulars & Retail Source
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-[11px] text-gray-500">Product Designation</p>
                <p className="font-semibold text-gray-900 text-sm">{complaint.productName}</p>
                <p className="text-gray-600 text-[11px] mt-0.5">Category: {complaint.foodType}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Retail Merchant / Establishment</p>
                <p className="font-semibold text-gray-900 text-sm">{complaint.seller}</p>
                <p className="text-gray-600 text-[11px] mt-0.5">{complaint.sellerAddress}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Complainant Information */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-gray-900 pb-1 border-b border-gray-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" /> Section II: Complainant Information & Verification
            </h3>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <p className="text-[11px] text-gray-500">Complainant Name</p>
                <p className="font-semibold text-gray-900">{complaint.reporter.name}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Email Address</p>
                <p className="font-mono text-gray-800">{complaint.reporter.email}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {complaint.reporter.emailVerified ? '✓ Identity Verified' : 'Pending Verification'}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Telephone Contact</p>
                <p className="font-mono text-gray-800">{complaint.reporter.phone}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {complaint.reporter.phoneVerified ? '✓ Identity Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Incident Details */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-gray-900 pb-1 border-b border-gray-200">
              Section III: Reported Defect & Quality Assessment
            </h3>
            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 leading-relaxed text-gray-800 font-mono text-[11px]">
              "{complaint.description}"
            </div>
          </div>

          {/* Section 4: Investigation Log */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-gray-900 pb-1 border-b border-gray-200">
              Section IV: Official Investigation Log Entries
            </h3>
            <div className="space-y-2 pt-1">
              {complaint.investigationNotes.map((note) => (
                <div key={note.id} className="p-2.5 border border-gray-200 rounded-lg text-[11px]">
                  <div className="flex justify-between font-semibold text-gray-700">
                    <span>Officer: {note.officer}</span>
                    <span className="font-mono text-gray-400">{note.timestamp}</span>
                  </div>
                  <p className="text-gray-800 mt-1">{note.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Official Sign-off & Stamp */}
          <div className="pt-6 border-t border-gray-300 flex items-end justify-between text-xs">
            <div>
              <p className="text-gray-400 text-[10px]">Verified By Official System</p>
              <div className="mt-2 w-32 border-b border-gray-400"></div>
              <p className="font-semibold text-gray-800 mt-1">{complaint.assignedOfficer}</p>
              <p className="text-[10px] text-gray-500">Designated Food Safety Officer</p>
            </div>

            <div className="text-center p-3 border-2 border-dashed border-emerald-600 rounded-xl bg-emerald-50/50">
              <span className="font-black text-emerald-800 uppercase tracking-wider text-[11px] block">
                FoodCovering Authenticated
              </span>
              <span className="text-[10px] text-emerald-700 font-mono block">
                Official Digital Stamp #{complaint.id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
