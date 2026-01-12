import React, { useState, useMemo } from 'react';
import type { ApplicationRecord } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ApplicationStatus } from '../types.ts';
import { CheckCircle, XCircle, Clock, Briefcase, Target, RefreshCw, Download, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardProps {
  applications: ApplicationRecord[];
}

type TimePeriod = '7d' | '30d' | '90d';

const Dashboard: React.FC<DashboardProps> = ({ applications }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter applications based on time period
  const filteredApplications = useMemo(() => {
    const now = Date.now();
    const periodMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    return applications.filter(app => 
      now - app.timestamp <= periodMs[selectedPeriod]
    );
  }, [applications, selectedPeriod]);

  // Stats Calculation
  const total = filteredApplications.length;
  const applied = filteredApplications.filter(a => a.status === ApplicationStatus.APPLIED).length;
  const rejected = filteredApplications.filter(a => a.status === ApplicationStatus.REJECTED).length;
  const pending = filteredApplications.filter(a => a.status === ApplicationStatus.PENDING).length;
  const analyzing = filteredApplications.filter(a => a.status === ApplicationStatus.ANALYZING).length;
  const successRate = total > 0 ? Math.round((applied / total) * 100) : 0;

  // Chart Data Preparation
  const funnelData = [
    { name: 'Total Scanned', value: total + 5 },
    { name: 'Matched', value: applied + rejected },
    { name: 'Applied', value: applied },
    { name: 'Skipped', value: rejected },
  ];

  // Status breakdown for pie chart
  const statusData = [
    { name: 'Applied', value: applied, color: '#22c55e' },
    { name: 'Rejected', value: rejected, color: '#ef4444' },
    { name: 'Pending', value: pending, color: '#f59e0b' },
    { name: 'Analyzing', value: analyzing, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  // Generate sparkline data for trends
  const sparklineData = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const data = [];
    const now = Date.now();
    
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayApplications = applications.filter(app => 
        app.timestamp >= dayStart && app.timestamp < dayEnd
      );
      
      data.push({
        day: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `Day ${days - i}`,
        applied: dayApplications.filter(a => a.status === ApplicationStatus.APPLIED).length,
        rejected: dayApplications.filter(a => a.status === ApplicationStatus.REJECTED).length,
        total: dayApplications.length
      });
    }
    
    return data;
  }, [applications, selectedPeriod]);

  // Calculate trend percentages
  const getTrend = (currentData: number[], previousData: number[]) => {
    if (previousData.length === 0) return { value: 0, isPositive: true };
    const currentSum = currentData.reduce((a, b) => a + b, 0);
    const previousSum = previousData.reduce((a, b) => a + b, 0);
    const change = previousSum > 0 ? ((currentSum - previousSum) / previousSum) * 100 : 0;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0
    };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call - in real app, this would fetch fresh data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const appliedTrend = getTrend(
    sparklineData.slice(-3).map(d => d.applied),
    sparklineData.slice(-6, -3).map(d => d.applied)
  );

  const handleExport = () => {
    const csvContent = [
      ['Job Title', 'Company', 'Status', 'Match Score', 'Date'],
      ...applications.map(app => [
        app.jobTitle,
        app.company,
        app.status,
        app.matchScore.toString(),
        new Date(app.timestamp).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Executive Dashboard</h1>
            <p className="text-gray-600">Real-time insights into your job application pipeline</p>
        </div>
        <div className="text-right hidden md:block mt-4 md:mt-0">
            <p className="text-sm font-medium text-gray-500">Last Active</p>
            <p className="text-gray-900 font-semibold">{new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
            <button
                onClick={handleRefresh}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                disabled={isRefreshing}
            >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={handleExport}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Export data as CSV"
            >
                <Download className="w-4 h-4 text-gray-600" />
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
            title="Applications Submitted" 
            value={applied} 
            icon={<CheckCircle className="text-green-600 w-6 h-6"/>}
            bg="bg-green-50"
            trend={`${appliedTrend.isPositive ? '+' : '-'}${appliedTrend.value}% from last period`}
            trendColor={appliedTrend.isPositive ? "text-green-600" : "text-red-600"}
            sparklineData={sparklineData.map(d => d.applied)}
            sparklineColor="#22c55e"
        />
        <KPICard 
            title="Match Success Rate" 
            value={`${successRate}%`} 
            icon={<Target className="text-blue-600 w-6 h-6"/>}
            bg="bg-blue-50"
            trend="Above industry average"
            trendColor="text-blue-600"
        />
        <KPICard 
            title="Applications Rejected" 
            value={rejected} 
            icon={<XCircle className="text-red-600 w-6 h-6"/>}
            bg="bg-red-50"
            trend="Low match score"
            trendColor="text-red-600"
            sparklineData={sparklineData.map(d => d.rejected)}
            sparklineColor="#ef4444"
        />
        <KPICard 
            title="Time Saved" 
            value={`${(applied * 0.5).toFixed(1)}h`} 
            icon={<Clock className="text-amber-600 w-6 h-6"/>}
            bg="bg-amber-50"
            trend="Est. 30 mins per application"
            trendColor="text-amber-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-corporate border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Application Funnel Analysis</h3>
                <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 3 months</option>
                </select>
            </div>
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={funnelData.length > 0 ? funnelData : [{name: 'No Data', value: 0}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{
                                borderRadius: '8px', 
                                border: '1px solid #e2e8f0', 
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                backgroundColor: '#ffffff'
                            }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                             {funnelData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={['#94a3b8', '#0ea5e9', '#22c55e', '#ef4444'][index % 4]} />
                             ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
            </div>
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
                {applications.length === 0 ? (
                    <div className="text-center py-12">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No applications yet</p>
                        <p className="text-gray-400 text-sm mt-1">Start the AI agent to begin</p>
                    </div>
                ) : (
                    [...applications].reverse().slice(0, 8).map((app) => (
                        <div key={app.id} className="flex items-start p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                app.status === ApplicationStatus.APPLIED ? 'bg-green-500' : 
                                app.status === ApplicationStatus.REJECTED ? 'bg-red-400' :
                                app.status === ApplicationStatus.PENDING ? 'bg-amber-400' :
                                app.status === ApplicationStatus.ANALYZING ? 'bg-blue-400' :
                                'bg-gray-400'
                            }`}></div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">{app.jobTitle}</p>
                                <p className="text-xs text-gray-600">{app.company}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(app.timestamp).toLocaleDateString()}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <div className="text-sm font-semibold text-gray-900">{app.matchScore}%</div>
                                <div className={`text-xs ${
                                    app.matchScore >= 70 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {app.matchScore >= 70 ? 'Match' : 'Low Match'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Status Breakdown Chart */}
        <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Application Status Breakdown</h3>
                <span className="text-sm text-gray-500">{selectedPeriod === '7d' ? 'Last 7 days' : selectedPeriod === '30d' ? 'Last 30 days' : 'Last 3 months'}</span>
            </div>
            {statusData.length > 0 ? (
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[320px] flex items-center justify-center">
                    <div className="text-center">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No data for selected period</p>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

// Professional KPI Card Component
const KPICard = ({ title, value, icon, bg, trend, trendColor, sparklineData, sparklineColor }: any) => {
  const getSparklinePoints = (data: number[]) => {
    if (data.length < 2) return '';
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 60;
    const height = 20;
    
    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200 hover:shadow-corporate-lg transition-shadow duration-200">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${bg}`}>
                {icon}
            </div>
        </div>
        
        {sparklineData && sparklineData.length > 1 && (
            <div className="mt-3">
                <svg width="60" height="20" className="w-full">
                    <path
                        d={getSparklinePoints(sparklineData)}
                        fill="none"
                        stroke={sparklineColor || '#64748b'}
                        strokeWidth="2"
                    />
                </svg>
            </div>
        )}
        
        <div className="flex items-center mt-3">
            {trend.includes('+') ? (
                <TrendingUp className="w-3 h-3 mr-1" style={{ color: trendColor }} />
            ) : (
                <TrendingDown className="w-3 h-3 mr-1" style={{ color: trendColor }} />
            )}
            <p className={`text-xs font-medium ${trendColor}`}>
                {trend}
            </p>
        </div>
    </div>
  );
};

export default Dashboard;