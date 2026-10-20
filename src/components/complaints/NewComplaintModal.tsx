import { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  Sparkles, 
  Building, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';
import { useComplaintsStore } from '../../store/useComplaintsStore';
import { useAuthStore } from '../../store/useAuthStore';

export const NewComplaintModal = () => {
  const { isNewComplaintModalOpen, closeNewComplaintModal, createComplaint, openOtpModal } = useComplaintsStore();
  const user = useAuthStore((state) => state.user);

  const [foodType, setFoodType] = useState('Dairy Product');
  const [productName, setProductName] = useState('');
  const [seller, setSeller] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [priority, setPriority] = useState('High');
  const [reporterName, setReporterName] = useState(user?.fullName || '');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');
  const [reporterPhone, setReporterPhone] = useState(user?.phone || '');
  const [description, setDescription] = useState('');
  const [assignedOfficer, setAssignedOfficer] = useState('Sarah Connor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoTriggerOtp, setAutoTriggerOtp] = useState<'phone' | 'email' | 'none'>('phone');

  useEffect(() => {
    if (user && isNewComplaintModalOpen) {
      if (!reporterName) setReporterName(user.fullName || '');
      if (!reporterEmail) setReporterEmail(user.email || '');
      if (!reporterPhone) setReporterPhone(user.phone || '');
    }
  }, [user, isNewComplaintModalOpen]);

  if (!isNewComplaintModalOpen) return null;

  const handleFillDemo = () => {
    setFoodType('Dairy Product');
    setProductName('Pasteurized Whole Cow Milk 1L');
    setSeller('Heritage Dairy Mart');
    setSellerAddress('Booth #18, Sarojini Nagar Market, New Delhi');
    setIncidentLocation('Sarojini Nagar, South Delhi');
    setPriority('Critical');
    setReporterName('Rohan Mehra');
    setReporterEmail('rohan.m@gmail.com');
    setReporterPhone('+91 98991 23456');
    setDescription('Purchased batch pack that expired yesterday but had new label slapped on top. Milk smelled acidic and turned blueish curd.');
    setAssignedOfficer('Sarah Connor');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !seller) return;
    setIsSubmitting(true);
    const res = await createComplaint({
      foodType,
      productName,
      seller,
      sellerAddress: sellerAddress || `${seller}, Sector 1`,
      incidentLocation: incidentLocation || 'City Central District',
      priority,
      reporterName: reporterName || 'Demo Complainant',
      reporterEmail: reporterEmail || 'reporter@example.com',
      reporterPhone: reporterPhone || '+91 98765 43210',
      description: description || 'Reported unhygienic condition / expired food.',
      assignedOfficer
    });
    setIsSubmitting(false);
    closeNewComplaintModal();

    if (res?.complaint && autoTriggerOtp !== 'none') {
      openOtpModal({
        complaintId: res.complaint.id,
        type: autoTriggerOtp,
        targetValue: autoTriggerOtp === 'phone' ? res.complaint.reporter.phone : res.complaint.reporter.email,
        recipientName: res.complaint.reporter.name
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">File New Food Safety Complaint</h3>
              <p className="text-xs text-gray-500">Live intake for field testing and real-time dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Auto-Fill Pitch Scenario</span>
            </button>
            <button
              onClick={closeNewComplaintModal}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Row 1: Product & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Food Category *</label>
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Dairy Product">Dairy Product</option>
                <option value="Meat">Meat & Poultry</option>
                <option value="Bakery">Bakery & Confectionery</option>
                <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                <option value="Seafood">Seafood & Marine</option>
                <option value="Packaged Food">Packaged / Canned Food</option>
                <option value="Prepared Food">Prepared Food / Restaurant</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Organic Whole Milk 1L"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Row 2: Seller & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-gray-400" /> Seller / Retailer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Store Supermarket"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> Incident Location / Area
              </label>
              <input
                type="text"
                placeholder="e.g. Central Market, Sector 4"
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: Reporter Contact Details */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block">
                Complainant Contact Information
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                Live Verification Ready
              </span>
            </div>

            {/* Pitch demo helper banner */}
            <div className="p-2.5 bg-white border border-emerald-300 rounded-lg text-emerald-950 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span>Pitch Mode: Test with your friend's real phone/email to deliver OTP in real time</span>
              </div>
              <div className="flex items-center gap-3 font-semibold text-gray-700 shrink-0">
                <label className="flex items-center gap-1 cursor-pointer hover:text-emerald-700">
                  <input
                    type="radio"
                    name="autoOtp"
                    checked={autoTriggerOtp === 'phone'}
                    onChange={() => setAutoTriggerOtp('phone')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Verify Phone</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer hover:text-emerald-700">
                  <input
                    type="radio"
                    name="autoOtp"
                    checked={autoTriggerOtp === 'email'}
                    onChange={() => setAutoTriggerOtp('email')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Verify Email</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                  <input
                    type="radio"
                    name="autoOtp"
                    checked={autoTriggerOtp === 'none'}
                    onChange={() => setAutoTriggerOtp('none')}
                    className="text-gray-400 focus:ring-gray-400"
                  />
                  <span>Later</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-600 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" /> Full Name
                </label>
                <input
                  type="text"
                  placeholder="Complainant Name"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-600 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" /> Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Priority & Officer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Priority Severity
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="Critical">Critical (Immediate Hazard / Health Risk)</option>
                <option value="High">High (Spoilage / Foreign Object)</option>
                <option value="Medium">Medium (Quality / Mislabeling)</option>
                <option value="Low">Low (General Inquiry / Packaging)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Assign Investigation Officer</label>
              <select
                value={assignedOfficer}
                onChange={(e) => setAssignedOfficer(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Sarah Connor">Sarah Connor (Dairy / Quality Lead)</option>
                <option value="John Smith">John Smith (Meat & Pathogen Specialist)</option>
                <option value="Mike Davis">Mike Davis (Bakery & Facility Inspector)</option>
                <option value="Emily Carter">Emily Carter (Produce & Cold Chain)</option>
                <option value="Robert Lee">Robert Lee (Marine & Import Safety)</option>
                <option value="Priya Sharma">Priya Sharma (Packaged Food & Recall Lead)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Description */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" /> Specific Issue & Findings *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe what occurred, smell, date of purchase, illness symptoms, or visible contamination..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeNewComplaintModal}
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !productName || !seller}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Dispatch Live Complaint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
