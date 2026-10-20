import { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronRight as ViewChevron,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  X,
  PlusCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { useComplaintsStore } from '../store/useComplaintsStore';
import { ComplaintSummaryCards } from '../components/complaints/ComplaintSummaryCards';
import { ComplaintVerificationPanel } from '../components/complaints/ComplaintVerificationPanel';
import { ComplaintDetailsModal } from '../components/complaints/ComplaintDetailsModal';
import { VerificationOtpModal } from '../components/complaints/VerificationOtpModal';
import { NewComplaintModal } from '../components/complaints/NewComplaintModal';
import { CallUserModal } from '../components/complaints/CallUserModal';
import { SendEmailModal } from '../components/complaints/SendEmailModal';
import { PrintReportModal } from '../components/complaints/PrintReportModal';
import { StatusBadge } from '../components/complaints/StatusBadge';

const CATEGORIES = [
  'All Categories',
  'Dairy Product',
  'Meat',
  'Bakery',
  'Fruits & Vegetables',
  'Seafood',
  'Packaged Food',
  'Prepared Food'
];

const OFFICERS = [
  'All Officers',
  'Sarah Connor',
  'John Smith',
  'Mike Davis',
  'Emily Carter',
  'Robert Lee',
  'Priya Sharma'
];

export default function Complaints() {
  const {
    complaints,
    stats,
    selectedComplaintId,
    searchQuery,
    statusFilter,
    categoryFilter,
    dateFilter,
    officerFilter,
    currentPage,
    pageSize,
    isLoading,
    notificationMessage,
    fetchComplaints,
    selectComplaint,
    setSearchQuery,
    setStatusFilter,
    setCategoryFilter,
    setDateFilter,
    setOfficerFilter,
    setPage,
    resetFilters,
    openDetailModal,
    openNewComplaintModal
  } = useComplaintsStore();

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Client-side filtering
  const filteredComplaints = complaints.filter((c) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.foodType.toLowerCase().includes(q) ||
        c.seller.toLowerCase().includes(q) ||
        c.assignedOfficer.toLowerCase().includes(q) ||
        c.productName.toLowerCase().includes(q) ||
        c.incidentLocation.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter
    if (statusFilter !== 'All Statuses' && c.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    // Category filter
    if (categoryFilter !== 'All Categories' && c.foodType.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }

    // Officer filter
    if (officerFilter !== 'All Officers' && c.assignedOfficer.toLowerCase() !== officerFilter.toLowerCase()) {
      return false;
    }

    return true;
  });

  // Pagination calculation
  const totalItems = filteredComplaints.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedComplaints = filteredComplaints.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All Statuses' ||
    categoryFilter !== 'All Categories' ||
    dateFilter !== 'All Time' ||
    officerFilter !== 'All Officers';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      {/* Toast Notification Alert */}
      {notificationMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm flex items-center gap-2.5 transition-all animate-in slide-in-from-bottom-3 ${
          notificationMessage.type === 'success'
            ? 'bg-emerald-900 text-white border-emerald-800'
            : notificationMessage.type === 'error'
            ? 'bg-red-900 text-white border-red-800'
            : 'bg-slate-900 text-white border-slate-800'
        }`}>
          {notificationMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : notificationMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span className="font-medium">{notificationMessage.text}</span>
        </div>
      )}

      {/* Page Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Food Safety Complaints</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              Live Field Dispatch
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track, verify, and resolve food safety complaints in real-time
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openNewComplaintModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ File New Complaint</span>
          </button>
        </div>
      </div>

      {/* Startup Demo Quick Scenario Bar */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-blue-50/80 to-emerald-50/90 border border-emerald-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-emerald-900 font-bold">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Pitch Demonstration Scenarios:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => selectComplaint('FC-2026-00124')}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg font-medium transition-colors text-[11px]"
          >
            🍼 Case #124: Spoiled Dairy (Unverified)
          </button>
          <button
            onClick={() => selectComplaint('FC-2026-00123')}
            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-lg font-medium transition-colors text-[11px]"
          >
            🥩 Case #123: Meat Pathogen (Critical)
          </button>
          <button
            onClick={() => selectComplaint('FC-2026-00122')}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg font-medium transition-colors text-[11px]"
          >
            🍞 Case #122: Moldy Bread (Resolved)
          </button>
          <button
            onClick={openNewComplaintModal}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors text-[11px] flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            <span>Simulate Live Incoming</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <ComplaintSummaryCards />

      {/* Two Column Layout: Table on Left/Center, Verification Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complaints Table & Filters */}
        <div className="lg:col-span-8 xl:col-span-8.5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Table Header Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search complaints..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Status Select */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-gray-50/80 hover:bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Date Range Select */}
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none pl-7 pr-8 py-2 bg-gray-50/80 hover:bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="All Time">Date Range</option>
                  <option value="Today">Today</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="This Month">This Month</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Extra Filters Button */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium transition-colors ${
                    isFilterDropdownOpen || categoryFilter !== 'All Categories' || officerFilter !== 'All Officers'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-gray-50/80 hover:bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  <span>Filters</span>
                  {(categoryFilter !== 'All Categories' || officerFilter !== 'All Officers') && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  )}
                </button>

                {/* Filter Popover Dropdown */}
                {isFilterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-xl z-30 space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Food Category
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Assigned Officer
                      </label>
                      <select
                        value={officerFilter}
                        onChange={(e) => setOfficerFilter(e.target.value)}
                        className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {OFFICERS.map((off) => (
                          <option key={off} value={off}>{off}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-gray-100 text-xs">
                      <button
                        onClick={resetFilters}
                        className="text-gray-500 hover:text-gray-800 underline"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setIsFilterDropdownOpen(false)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset filter indicator if filters applied */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  title="Reset all filters"
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="px-5 py-3.5">Complaint ID</th>
                  <th className="px-5 py-3.5">Food Type</th>
                  <th className="px-5 py-3.5">Seller</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Officer</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Loading complaints records...
                    </td>
                  </tr>
                ) : paginatedComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      <p className="font-semibold text-sm text-gray-700">No complaints found</p>
                      <p className="text-xs text-gray-400 mt-1">Try clearing filters or searching another keyword.</p>
                      <button
                        onClick={resetFilters}
                        className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedComplaints.map((item) => {
                    const isSelected = item.id === selectedComplaintId;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => selectComplaint(item.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/40 hover:bg-emerald-50/60 font-medium'
                            : 'hover:bg-gray-50/80 text-gray-700'
                        }`}
                      >
                        {/* Complaint ID */}
                        <td className="px-5 py-3.5 font-semibold text-gray-900 flex items-center gap-2">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                          {item.id}
                        </td>

                        {/* Food Type */}
                        <td className="px-5 py-3.5 text-gray-700">{item.foodType}</td>

                        {/* Seller */}
                        <td className="px-5 py-3.5 text-gray-900 font-medium">{item.seller}</td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Assigned Officer */}
                        <td className="px-5 py-3.5 text-gray-700">{item.assignedOfficer}</td>

                        {/* Date */}
                        <td className="px-5 py-3.5 text-gray-500 font-mono text-[11px]">
                          <div>{item.date}</div>
                          <div className="text-[10px] text-gray-400">{item.time}</div>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectComplaint(item.id);
                              openDetailModal(item.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <span>View</span>
                            <ViewChevron className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Showing <span className="font-semibold text-gray-900">{paginatedComplaints.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{stats.total}</span> complaints
            </div>

            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <button
                onClick={() => setPage(Math.max(1, validCurrentPage - 1))}
                disabled={validCurrentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              {[1, 2, 3, 4, 5].map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    validCurrentPage === pageNum
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={() => setPage(Math.min(5, validCurrentPage + 1))}
                disabled={validCurrentPage >= 5}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Panel */}
        <div className="lg:col-span-4 xl:col-span-3.5">
          <ComplaintVerificationPanel />
        </div>
      </div>

      {/* Investigation Details Modal Dialog */}
      <ComplaintDetailsModal />

      {/* Verification OTP Modal Dialog */}
      <VerificationOtpModal />

      {/* File New Complaint Modal Dialog */}
      <NewComplaintModal />

      {/* In-App VoIP Caller Modal Dialog */}
      <CallUserModal />

      {/* Official Notice Email Dispatcher Modal */}
      <SendEmailModal />

      {/* Print Official Dossier Modal */}
      <PrintReportModal />
    </div>
  );
}
