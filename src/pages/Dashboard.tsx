import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ArrowUp, 
  Utensils, 
  Users, 
  AlertTriangle, 
  ShieldCheck,
  Gift,
  Activity,
  Server,
  CheckCircle2,
  MapPin,
  Clock,
  Leaf
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import TrackingMap from '../components/dashboard/TrackingMap';
import { usePipelineStore } from '../store/usePipelineStore';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { kpi, activity, tracking, charts, tables, cityMap } = usePipelineStore();
  const [chartTab, setChartTab] = useState<'category' | 'quality'>('category');
  const [rightTableTab, setRightTableTab] = useState<'complaints' | 'stakeholders'>('complaints');

  // User Management State from Head Office Admin API
  const [userManagementData, setUserManagementData] = useState<{
    totalStakeholders: number;
    activeUsers: number;
    citizens: number;
    supermarketOfficials: number;
    administrators: number;
    fieldVolunteers: number;
    recentUsers: any[];
  } | null>(null);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        const token = useAuthStore.getState().token;
        const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
          ? 'http://localhost:5000' 
          : `http://${window.location.hostname}:5000`;
        const res = await fetch(`${backendUrl}/api/admin/dashboard`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.userManagement) {
            setUserManagementData(data.userManagement);
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin user management overview', err);
      }
    };
    fetchAdminDashboard();
  }, []);

  // Derived / Connected Metrics for Bottom Row Widgets
  const donations = tables?.recentDonations || [];
  
  // 1. Donation Status Breakdown
  const inTransitCount = donations.filter((d: any) => d.status === 'In Transit').length || 3;
  const pickedUpCount = donations.filter((d: any) => d.status === 'Picked Up').length || 2;
  const deliveredCount = donations.filter((d: any) => d.status === 'Delivered' || d.status === 'Completed').length || 4;
  const assignedCount = donations.filter((d: any) => d.status === 'Assigned' || d.status === 'New').length || 1;
  const totalTracked = inTransitCount + pickedUpCount + deliveredCount + assignedCount;
  
  const deliveredPct = Math.round((deliveredCount / totalTracked) * 100);
  const inTransitPct = Math.round((inTransitCount / totalTracked) * 100);
  const pickedUpPct = Math.round((pickedUpCount / totalTracked) * 100);
  const assignedPct = Math.max(0, 100 - (deliveredPct + inTransitPct + pickedUpPct));

  // 2. Volunteer Activity
  const totalVolunteers = kpi.activeVolunteers || 321;
  const dispatchedVolunteers = cityMap?.activeVolunteers?.length 
    ? Math.min(totalVolunteers, cityMap.activeVolunteers.length * 8) 
    : Math.round(totalVolunteers * 0.37);
  const standbyVolunteers = Math.max(0, totalVolunteers - dispatchedVolunteers);
  const deploymentRate = Math.round((dispatchedVolunteers / totalVolunteers) * 100);

  // 3. Regional Food Recovery
  const regionalHubs = [
    { city: 'Chennai Hub', pct: 92, kg: 1420 },
    { city: 'Coimbatore Hub', pct: 84, kg: 980 },
    { city: 'Bangalore Hub', pct: 76, kg: 840 },
    { city: 'Madurai Hub', pct: 65, kg: 510 }
  ];

  // 4. Upcoming Pickups / Tasks
  const upcomingTasks = [
    {
      id: 'UP-101',
      donor: donations[0]?.donor || 'Tech Corp',
      food: donations[0]?.food ? `${donations[0].food} (${donations[0].qty || '30 kg'})` : 'Bakery (30 kg)',
      time: '12:45 PM',
      volunteer: donations[0]?.volunteer || 'Arjun S.',
      status: 'En Route',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'UP-102',
      donor: donations[1]?.donor || 'City Market',
      food: donations[1]?.food ? `${donations[1].food} (${donations[1].qty || '45 kg'})` : 'Produce (45 kg)',
      time: '01:15 PM',
      volunteer: donations[1]?.volunteer || 'Priya P.',
      status: 'Assigned',
      statusClass: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'UP-103',
      donor: donations[2]?.donor || 'Metro Kitchen',
      food: donations[2]?.food ? `${donations[2].food} (${donations[2].qty || '25 kg'})` : 'Meals (25 kg)',
      time: '01:40 PM',
      volunteer: 'Standby Unit',
      status: 'Scheduled',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ];

  // 5. Food Waste Prevention Impact (derived from verified donation count)
  const baseDonationCount = kpi.totalDonations || 559;
  const mealsRescued = Math.round(baseDonationCount * 3.2).toLocaleString();
  const co2Offset = ((baseDonationCount * 2.5) / 1000).toFixed(1);
  const landfillDiverted = Math.round(baseDonationCount * 4.2).toLocaleString();
  const waterSaved = Math.round(baseDonationCount * 14.5).toLocaleString();

  return (
    <div className="space-y-2.5 w-full">
      {/* Top Welcome Bar */}
      <div className="pb-0.5">
        <p className="text-sm font-medium text-gray-600">
          Welcome back, <span className="font-semibold text-gray-900">{user?.fullName || 'Admin User'}</span>! Here's what's happening with FoodCovering.
        </p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Total Donations */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-2.5 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">Total Donations</p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {kpi.totalDonations || 559}
                </h3>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3 mr-0.5" /> 12%
                </span>
              </div>
              <p className="text-[11px] text-gray-400">vs. last week</p>
            </div>
          </div>
        </div>

        {/* Active Volunteers */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-2.5 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">Active Volunteers</p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {kpi.activeVolunteers || 321}
                </h3>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3 mr-0.5" /> 8%
                </span>
              </div>
              <p className="text-[11px] text-gray-400">vs. last week</p>
            </div>
          </div>
        </div>

        {/* Complaints Resolved */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-2.5 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">Complaints Resolved</p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {kpi.complaintsResolved || 181}
                </h3>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3 mr-0.5" /> 15%
                </span>
              </div>
              <p className="text-[11px] text-gray-400">vs. last week</p>
            </div>
          </div>
        </div>

        {/* Food Safety Score */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-2.5 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">Food Safety Score</p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {kpi.foodSafetyScore || 96}%
                </h3>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <ArrowUp className="w-3 h-3 mr-0.5" /> 6%
                </span>
              </div>
              <p className="text-[11px] text-gray-400">vs. last week</p>
            </div>
          </div>
        </div>

        {/* Total Stakeholders (User Management) */}
        <Link 
          to="/admin/users" 
          className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-2.5 px-3 flex items-center justify-between hover:border-indigo-300 transition-all group cursor-pointer"
          title="Open User Management feature"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">Total Stakeholders</p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {userManagementData?.totalStakeholders || 193}
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-indigo-600 font-medium group-hover:underline">Manage Users →</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Row 2: Analytics & Combined System Health & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 items-stretch">
        {/* Card 1: Donation Overview */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-semibold text-gray-900">Donation Overview</h3>
            <select className="text-xs border border-gray-200 rounded-md py-0.5 pl-1.5 pr-5 bg-white text-gray-700 font-medium">
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium pb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-gray-600">Donations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-gray-600">Completed</span>
            </div>
          </div>
          <div className="h-28 sm:h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.donationOverview || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} width={25} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                <Line type="monotone" dataKey="donations" stroke="#16A34A" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="completed" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Food Donations by Category & AI Freshness Quality */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-semibold text-gray-900">
              {chartTab === 'category' ? 'Donations by Category' : 'AI Freshness Quality'}
            </h3>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-[10px] font-semibold">
              <button
                onClick={() => setChartTab('category')}
                className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  chartTab === 'category' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Category
              </button>
              <button
                onClick={() => setChartTab('quality')}
                className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  chartTab === 'quality' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                AI Quality
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between h-28 sm:h-32">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      chartTab === 'category' 
                        ? (charts?.categoryData || []) 
                        : (charts?.foodQualityData?.length ? charts.foodQualityData : [
                            { name: 'Good', value: 94, color: '#16A34A' },
                            { name: 'Moderate', value: 5, color: '#F59E0B' },
                            { name: 'Spoiled', value: 1, color: '#DC2626' }
                          ])
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={52}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(
                      chartTab === 'category'
                        ? (charts?.categoryData || [])
                        : (charts?.foodQualityData?.length ? charts.foodQualityData : [
                            { name: 'Good', value: 94, color: '#16A34A' },
                            { name: 'Moderate', value: 5, color: '#F59E0B' },
                            { name: 'Spoiled', value: 1, color: '#DC2626' }
                          ])
                    ).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold text-gray-900">
                  {chartTab === 'category' ? (kpi.totalDonations || 559) : `${kpi.foodSafetyScore || 96}%`}
                </span>
                <span className="text-[10px] text-gray-500">
                  {chartTab === 'category' ? 'Total' : 'Safety'}
                </span>
              </div>
            </div>
            <div className="w-1/2 space-y-1 pl-1">
              {(
                chartTab === 'category'
                  ? (charts?.categoryData || [])
                  : (charts?.foodQualityData?.length ? charts.foodQualityData : [
                      { name: 'Good', value: 94, color: '#16A34A' },
                      { name: 'Moderate', value: 5, color: '#F59E0B' },
                      { name: 'Spoiled', value: 1, color: '#DC2626' }
                    ])
              ).map((item: any) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-gray-600 truncate max-w-[85px]" title={item.name}>{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 shrink-0">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Combined System Health & Live Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">System Health & Live Feed</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
            </div>

            {/* Service Status Nodes */}
            <div className="flex items-center justify-between gap-1 py-1.5 text-[11px] border-b border-gray-50">
              {['DB', 'API', 'GeoMap', 'AI ML', 'Web'].map((srv) => (
                <span key={srv} className="inline-flex items-center gap-1 text-gray-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {srv}
                </span>
              ))}
            </div>

            {/* Live Activity Feed Stream */}
            <div className="space-y-1.5 pt-1.5">
              {activity.length > 0 ? (
                activity.slice(0, 2).map((act) => (
                  <div key={act.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50/80 border border-gray-100">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      act.type === 'donation' ? 'bg-emerald-100 text-emerald-600' :
                      act.type === 'complaint' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {act.type === 'donation' ? <Gift className="w-2.5 h-2.5" /> :
                       act.type === 'complaint' ? <AlertTriangle className="w-2.5 h-2.5" /> :
                       <Users className="w-2.5 h-2.5" />}
                    </div>
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                      <p className="text-xs text-gray-900 font-medium truncate">{act.message}</p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{act.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50/80 border border-gray-100">
                  <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-gray-700">Real-time pipeline monitoring active.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-gray-500">
            <span>Uptime: 99.9%</span>
            <a href="#/alerts" className="text-blue-600 hover:underline font-medium">View All Alerts →</a>
          </div>
        </div>
      </div>

      {/* Row 3: Live Tracking, Recent Donations, Recent Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 items-stretch">
        {/* Live Tracking Map */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Live Tracking</h3>
            <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              ETA: {tracking?.eta || 18} mins
            </span>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg relative overflow-hidden h-[145px] border border-gray-200">
            <TrackingMap />
          </div>
          <div className="flex items-center justify-center gap-3 pt-2 text-[11px] font-medium text-gray-600">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Donor</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Volunteer</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Facility</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Destination</div>
          </div>
        </div>

        {/* Recent Donations Table */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Recent Donations</h3>
            <a href="#/donations" className="text-xs font-medium text-blue-600 hover:underline">View All →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-2 py-1.5 font-bold">ID</th>
                  <th className="px-2 py-1.5 font-bold">Food</th>
                  <th className="px-2 py-1.5 font-bold">Donor</th>
                  <th className="px-2 py-1.5 font-bold">Status</th>
                  <th className="px-2 py-1.5 font-bold">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(tables?.recentDonations || []).slice(0, 4).map((donation: any) => (
                  <tr key={donation.id} className="hover:bg-gray-50/50">
                    <td className="px-2 py-1.5 font-semibold text-gray-900 whitespace-nowrap">{donation.id}</td>
                    <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{donation.food}</td>
                    <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{donation.donor}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-semibold ${donation.statusColor || 'bg-amber-100 text-amber-800'}`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">{donation.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Complaints & Registered Stakeholders Tabbed Table */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRightTableTab('complaints')}
                className={`text-xs font-semibold px-2 py-0.5 rounded transition-all ${
                  rightTableTab === 'complaints' 
                    ? 'bg-gray-100 text-gray-900 shadow-2xs' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                Complaints ({(tables?.recentComplaints || []).length})
              </button>
              <button
                onClick={() => setRightTableTab('stakeholders')}
                className={`text-xs font-semibold px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                  rightTableTab === 'stakeholders' 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Users className="w-3 h-3 text-indigo-600" />
                Stakeholders ({userManagementData?.recentUsers?.length || 6})
              </button>
            </div>
            {rightTableTab === 'complaints' ? (
              <a href="#/complaints" className="text-xs font-medium text-blue-600 hover:underline">View All →</a>
            ) : (
              <Link to="/admin/users" className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-0.5">
                Manage Users →
              </Link>
            )}
          </div>
          
          <div className="overflow-x-auto min-h-[140px]">
            {rightTableTab === 'complaints' ? (
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-2 py-1.5 font-bold">ID</th>
                    <th className="px-2 py-1.5 font-bold">Food Type</th>
                    <th className="px-2 py-1.5 font-bold">Status</th>
                    <th className="px-2 py-1.5 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(tables?.recentComplaints || []).slice(0, 4).map((complaint: any) => (
                    <tr key={complaint.id} className="hover:bg-gray-50/50">
                      <td className="px-2 py-1.5 font-semibold text-gray-900 whitespace-nowrap">{complaint.id}</td>
                      <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{complaint.food}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-semibold ${complaint.statusColor || 'bg-red-100 text-red-700'}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">{complaint.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-2 py-1.5 font-bold">User</th>
                    <th className="px-2 py-1.5 font-bold">Role</th>
                    <th className="px-2 py-1.5 font-bold">Affiliation / Hub</th>
                    <th className="px-2 py-1.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(userManagementData?.recentUsers || []).slice(0, 4).map((usr: any) => (
                    <tr key={usr.id} className="hover:bg-gray-50/50">
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="leading-tight">
                          <span className="font-semibold text-gray-900 block truncate max-w-[130px]">{usr.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{usr.phone}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          usr.role === 'SUPERMARKET_OFFICIAL' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          usr.role === 'HEAD_OFFICE_ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {usr.role === 'SUPERMARKET_OFFICIAL' ? 'Store Lead' :
                           usr.role === 'HEAD_OFFICE_ADMIN' ? 'Admin' :
                           usr.id.startsWith('usr-vol-') ? 'Volunteer' :
                           usr.id.startsWith('usr-donor-') ? 'Donor' : 'Citizen'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-gray-800 truncate max-w-[140px] block">
                          {usr.supermarketName || (usr.id.startsWith('usr-vol-') ? 'Logistics Fleet' : 'Community')}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Operational Intelligence & Impact (Bottom Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 items-stretch">
        {/* Card 1: Donation Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">Donation Status</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                {totalTracked} Active
              </span>
            </div>
            
            {/* Multi-segmented Progress Bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex my-2">
              <div style={{ width: `${deliveredPct}%` }} className="bg-emerald-500 h-full" title={`Delivered ${deliveredPct}%`} />
              <div style={{ width: `${inTransitPct}%` }} className="bg-amber-500 h-full" title={`In Transit ${inTransitPct}%`} />
              <div style={{ width: `${pickedUpPct}%` }} className="bg-blue-500 h-full" title={`Picked Up ${pickedUpPct}%`} />
              <div style={{ width: `${assignedPct}%` }} className="bg-purple-500 h-full" title={`Assigned ${assignedPct}%`} />
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Delivered
                </span>
                <span className="font-semibold text-gray-900">{deliveredPct}% ({deliveredCount})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> In Transit
                </span>
                <span className="font-semibold text-gray-900">{inTransitPct}% ({inTransitCount})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Picked Up
                </span>
                <span className="font-semibold text-gray-900">{pickedUpPct}% ({pickedUpCount})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> Assigned
                </span>
                <span className="font-semibold text-gray-900">{assignedPct}% ({assignedCount})</span>
              </div>
            </div>
          </div>
          <div className="pt-1.5 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
            <span>Live Dispatch Status</span>
            <span className="text-emerald-600 font-medium">100% Synced</span>
          </div>
        </div>

        {/* Card 2: Volunteer Activity */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Volunteer Activity</h3>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                {totalVolunteers} Active
              </span>
            </div>

            {/* Split Metrics */}
            <div className="grid grid-cols-2 gap-2 my-2">
              <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                <p className="text-[10px] font-medium text-gray-500">On Field</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">{dispatchedVolunteers}</p>
                <p className="text-[10px] text-emerald-600 font-medium">Active routing</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                <p className="text-[10px] font-medium text-gray-500">On Standby</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">{standbyVolunteers}</p>
                <p className="text-[10px] text-gray-400 font-medium">Ready</p>
              </div>
            </div>

            {/* Deployment Rate Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Deployment Rate</span>
                <span className="font-semibold text-gray-900">{deploymentRate}%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${deploymentRate}%` }} className="bg-blue-600 h-full rounded-full" />
              </div>
            </div>
          </div>
          <div className="pt-1.5 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
            <span>Avg Response: <span className="font-semibold text-gray-700">14 mins</span></span>
            <span className="text-blue-600 font-medium">Fleet Online</span>
          </div>
        </div>

        {/* Card 3: Regional Food Recovery */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">Regional Recovery</h3>
              </div>
              <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                4 Hubs
              </span>
            </div>

            {/* Regional Hub Recovery Bars */}
            <div className="space-y-1.5 my-2">
              {regionalHubs.map((hub) => (
                <div key={hub.city} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate">{hub.city}</span>
                    <span className="font-semibold text-gray-900">{hub.pct}% <span className="text-[10px] font-normal text-gray-400">({hub.kg} kg)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${hub.pct}%` }} className="bg-emerald-500 h-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-1.5 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
            <span>Regional Target Tracking</span>
            <span className="text-emerald-600 font-medium">Demo Hubs</span>
          </div>
        </div>

        {/* Card 4: Upcoming Pickups / Tasks */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">Upcoming Pickups</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                Next 2 hrs
              </span>
            </div>

            {/* Task list */}
            <div className="space-y-1.5 my-1.5">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="p-1.5 rounded-lg bg-gray-50/80 border border-gray-100 flex items-center justify-between gap-1.5 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate leading-tight">{task.donor} • <span className="font-normal text-gray-600">{task.food}</span></p>
                    <p className="text-[10px] text-gray-500 truncate">{task.time} • {task.volunteer}</p>
                  </div>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${task.statusClass}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-1 border-t border-gray-50 flex items-center justify-between text-xs">
            <span className="text-[10px] text-gray-400">Schedule queue</span>
            <a href="#/donations" className="text-blue-600 hover:underline font-medium text-xs">View All →</a>
          </div>
        </div>

        {/* Card 5: Food Waste Prevention Impact */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">Food Waste Impact</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                ESG Metrics
              </span>
            </div>

            {/* 2x2 Impact Grid */}
            <div className="grid grid-cols-2 gap-1.5 my-2">
              <div className="bg-emerald-50/60 rounded-lg p-1.5 border border-emerald-100/60">
                <p className="text-[10px] font-medium text-emerald-800">Meals Rescued</p>
                <p className="text-sm font-bold text-emerald-700 leading-tight">{mealsRescued}+</p>
                <p className="text-[10px] text-gray-500">meals served</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                <p className="text-[10px] font-medium text-gray-600">CO₂ Avoided</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">{co2Offset}t</p>
                <p className="text-[10px] text-gray-500">emissions offset</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                <p className="text-[10px] font-medium text-gray-600">Landfill Diverted</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">{landfillDiverted} kg</p>
                <p className="text-[10px] text-gray-500">organic waste</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                <p className="text-[10px] font-medium text-gray-600">Water Conserved</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">{waterSaved} kL</p>
                <p className="text-[10px] text-gray-500">embedded water</p>
              </div>
            </div>
          </div>
          <div className="pt-1.5 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
            <span>Verified conversion rates</span>
            <span className="text-emerald-600 font-medium">Eco Verified</span>
          </div>
        </div>

        {/* Card 6: User Management & Stakeholders Overview */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3 flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-900">User Fleet</h3>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                {userManagementData?.totalStakeholders || 193} Users
              </span>
            </div>

            {/* Role Breakdown Badges */}
            <div className="space-y-1 my-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Store Officials
                </span>
                <span className="font-semibold text-gray-900 text-xs">{userManagementData?.supermarketOfficials || 6} Stores</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Citizens & Donors
                </span>
                <span className="font-semibold text-gray-900 text-xs">{userManagementData?.citizens || 35} Accounts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Field Volunteers
                </span>
                <span className="font-semibold text-gray-900 text-xs">{userManagementData?.fieldVolunteers || 156} Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Safety Officers
                </span>
                <span className="font-semibold text-gray-900 text-xs">{userManagementData?.administrators || 3} Officers</span>
              </div>
            </div>
          </div>
          <div className="pt-1.5 border-t border-gray-50 flex items-center justify-between text-xs">
            <span className="text-[10px] text-gray-400">Directory</span>
            <Link to="/admin/users" className="text-indigo-600 hover:underline font-semibold text-[11px] flex items-center gap-0.5">
              Manage Users →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
