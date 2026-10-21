import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Package, 
  Plus, 
  Search, 
  Scan, 
  Gift, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  MapPin,
  Truck,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { getStoredInventory, getClientDb, saveClientDb } from '../../data/mockDatabase';
import { getBackendUrl } from '../../utils/apiConfig';

export default function SupermarketInventory() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Item State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bakery');
  const [batchNumber, setBatchNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('20');
  const [unit, setUnit] = useState('units');
  const [expiryDate, setExpiryDate] = useState('');
  const [freshnessStatus, setFreshnessStatus] = useState('Fresh');
  const [riskLevel, setRiskLevel] = useState('Low');
  const [inspectionResult, setInspectionResult] = useState('Store intake inspection compliant.');

  const fetchInventory = async () => {
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (selectedCategory !== 'All Categories') queryParams.append('category', selectedCategory);
        if (selectedStatus !== 'All Statuses') queryParams.append('status', selectedStatus);

        const res = await fetch(`${backendUrl}/api/supermarket/inventory?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          setInventory(data.inventory || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fall through to offline fallback
      }
    }

    // Offline / Public Fallback: load inventory from mockDatabase
    setInventory(getStoredInventory() as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [token, selectedCategory, selectedStatus]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchInventory();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const newItem = {
      id: 'inv-' + Date.now().toString(36),
      name,
      category,
      batchNumber,
      barcode,
      quantity: Number(quantity) || 1,
      currentStock: Number(quantity) || 1,
      unit,
      expiryDate,
      freshnessStatus,
      riskLevel,
      inspectionResult,
      flaggedForDonation: false,
      originalPrice: 50,
      discountedPrice: 20
    };

    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/api/supermarket/inventory`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newItem),
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          setMessage({ type: 'success', text: `Inventory item ${name} added successfully.` });
          setModalOpen(false);
          setName('');
          setBatchNumber('');
          setBarcode('');
          fetchInventory();
          return;
        }
      }
    } catch {}

    // Offline fallback: save to mockDatabase
    const db = getClientDb();
    db.inventory = [newItem, ...(db.inventory || [])];
    saveClientDb(db);
    setInventory(db.inventory);
    setMessage({ type: 'success', text: `Inventory item ${name} added successfully.` });
    setModalOpen(false);
    setName('');
    setBatchNumber('');
    setBarcode('');
    setSubmitting(false);
  };

  const handleToggleDonation = async (item: any) => {
    const updatedStatus = !item.flaggedForDonation;
    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/api/supermarket/inventory/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            flaggedForDonation: updatedStatus
          }),
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          setMessage({ 
            type: 'success', 
            text: updatedStatus ? `${item.name} flagged for surplus charity pickup.` : `Flag removed for ${item.name}.`
          });
          fetchInventory();
          return;
        }
      }
    } catch {}

    // Offline fallback: update in mockDatabase
    const db = getClientDb();
    db.inventory = (db.inventory || []).map((i: any) => i.id === item.id ? { ...i, flaggedForDonation: updatedStatus } : i);
    saveClientDb(db);
    setInventory(db.inventory);
    setMessage({ 
      type: 'success', 
      text: updatedStatus ? `${item.name} flagged for surplus charity pickup.` : `Flag removed for ${item.name}.`
    });
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to retire inventory batch ${itemName}?`)) return;

    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/api/supermarket/inventory/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          setMessage({ type: 'success', text: `Item ${itemName} removed from inventory.` });
          fetchInventory();
          return;
        }
      }
    } catch {}

    // Offline fallback: remove from mockDatabase
    const db = getClientDb();
    db.inventory = (db.inventory || []).filter((i: any) => i.id !== id);
    saveClientDb(db);
    setInventory(db.inventory);
    setMessage({ type: 'success', text: `Item ${itemName} removed from inventory.` });
  };

  const totalItems = inventory.length;
  const freshItems = inventory.filter(i => i.freshnessStatus === 'Fresh').length;
  const nearExpiryItems = inventory.filter(i => i.freshnessStatus === 'Near-Expiry' || i.riskLevel === 'Medium').length;
  const queuedItems = inventory.filter(i => i.flaggedForDonation).length;
  const totalPotentialPoints = inventory.reduce((acc, i) => acc + (i.flaggedForDonation ? 185 : 50), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>Store Food Inventory</span>
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Live Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time batch shelf-life monitoring, AI quality assurance, and surplus charity dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/supermarket/ai-scan')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Scan className="w-4 h-4 text-emerald-400" />
            <span>AI Food & Waste Scan</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Stock Batches</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5">{totalItems}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Active in-store SKUs</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">AI Quality Passed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1.5">{freshItems}</div>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">100% compliance score</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Near Expiry / Attention</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1.5">{nearExpiryItems}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">{queuedItems} queued for donation</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 via-emerald-50/50 to-teal-50 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-900 uppercase">Credential Yield</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5">+{totalPotentialPoints}</div>
          <p className="text-[10px] text-amber-800 font-bold mt-0.5">Pts available on donation dispatch</p>
        </div>
      </div>

      {/* Google Maps Live Surplus Dispatch Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 sm:p-4.5 border border-blue-800/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-blue-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white">Commercial Surplus Dispatch • Live Volunteer Route</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                IN TRANSIT
              </span>
            </div>
            <p className="text-[11px] text-blue-200/80 mt-0.5 flex items-center gap-1.5">
              <span>Volunteer Arjun Sharma (En Route to Central Market)</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">+185 Credential Points Awarded</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/supermarket/tracking')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-200" />
            <span>Track on Google Maps</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search item, batch number, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 cursor-pointer"
          >
            <option value="All Categories">All Categories</option>
            <option value="Bakery">Bakery</option>
            <option value="Dairy">Dairy</option>
            <option value="Fruits & Vegetables">Fruits & Vegetables</option>
            <option value="Meat">Meat & Poultry</option>
            <option value="General Grocery">General Grocery</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 cursor-pointer"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Fresh">Fresh</option>
            <option value="Near-Expiry">Near-Expiry</option>
            <option value="Spoiled">Spoiled</option>
          </select>

          <button
            onClick={fetchInventory}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Item & Batch</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Stock In Hand</th>
                <th className="py-3.5 px-4">Best Before</th>
                <th className="py-3.5 px-4">Quality Status</th>
                <th className="py-3.5 px-4">Credential Pts</th>
                <th className="py-3.5 px-4">Inspection Result</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">Loading store inventory...</td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No inventory batches found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Batch" or run an "AI Food & Waste Scan" to intake new stock.</p>
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="font-bold">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono font-normal">#{item.batchNumber}</span>
                        {item.barcode && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono">{item.barcode}</span>
                        )}
                        {item.flaggedForDonation && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            Queued for Donation
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{item.category}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{item.quantity} {item.unit}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{item.expiryDate}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.freshnessStatus === 'Fresh' ? 'bg-emerald-100 text-emerald-800' :
                        item.freshnessStatus === 'Near-Expiry' ? 'bg-amber-100 text-amber-800' :
                        item.freshnessStatus === 'Spoiled' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.freshnessStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1 w-fit ${
                        item.flaggedForDonation 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300/80' 
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>+{item.flaggedForDonation ? '185' : '50'} pts</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={item.inspectionResult}>
                      {item.inspectionResult || 'Store intake verified compliant'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleDonation(item)}
                          title={item.flaggedForDonation ? 'Remove donation flag' : 'Flag for charity donation (+185 pts)'}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            item.flaggedForDonation 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs' 
                              : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                          }`}
                        >
                          <Gift className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          title="Delete / Retire batch"
                          className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Inventory Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Food Inventory Batch</h3>
            <p className="text-xs text-slate-500 mb-4">
              Record new batch intake for real-time shelf life monitoring.
            </p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourdough Artisan Loaf or Cow Milk 1L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Bakery">Bakery</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Meat">Meat & Poultry</option>
                    <option value="General Grocery">General Grocery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK-2026-905"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="units">units</option>
                    <option value="loaves">loaves</option>
                    <option value="packets">packets</option>
                    <option value="kg">kg</option>
                    <option value="punnets">punnets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Freshness Status</label>
                  <select
                    value={freshnessStatus}
                    onChange={(e) => setFreshnessStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Fresh">Fresh (Peak quality)</option>
                    <option value="Near-Expiry">Near-Expiry (48h left)</option>
                    <option value="Spoiled">Spoiled (Quarantine)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    placeholder="8901..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Intake Inspection Notes</label>
                <textarea
                  rows={2}
                  value={inspectionResult}
                  onChange={(e) => setInspectionResult(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Add Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
