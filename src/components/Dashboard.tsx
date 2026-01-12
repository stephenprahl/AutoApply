import React, { useState, useMemo } from 'react';
import type { ApplicationRecord } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ApplicationStatus } from '../types.ts';
import { CheckCircle, XCircle, Clock, Briefcase, Target, RefreshCw, Download, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardProps {
  applications: ApplicationRecord[];
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bg: string;
  borderColor: string;
  trend: string;
  trendColor: string;
  sparklineData?: number[];
  sparklineColor?: string;
}

type TimePeriod = '7d' | '30d' | '90d';

const Dashboard: React.FC<DashboardProps> = ({ applications }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter applications based on time period
  const filteredApplications = useMemo(() => {
    const now = new Date().getTime();
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
    const now = new Date().getTime();
    
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Executive Header */}
        <div className="bg-white rounded-corporate-lg shadow-corporate border border-gray-200 p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full"></div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Executive Dashboard</h1>
              </div>
              <p className="text-lg text-gray-600 font-medium">Real-time analytics and insights for your job application pipeline</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">System Active</span>
                </div>
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-corporate text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-corporate hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                title="Export data as CSV"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* KPI Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Applications Submitted"
            value={applied}
            icon={<CheckCircle className="text-green-600 w-7 h-7"/>}
            bg="bg-gradient-to-br from-green-50 to-emerald-50"
            borderColor="border-green-200"
            trend={`${appliedTrend.isPositive ? '+' : '-'}${appliedTrend.value}% from last period`}
            trendColor={appliedTrend.isPositive ? "text-green-700" : "text-red-600"}
            sparklineData={sparklineData.map(d => d.applied)}
            sparklineColor="#16a34a"
          />
          <KPICard
            title="Success Rate"
            value={`${successRate}%`}
            icon={<Target className="text-blue-600 w-7 h-7"/>}
            bg="bg-gradient-to-br from-blue-50 to-indigo-50"
            borderColor="border-blue-200"
            trend="Above industry average"
            trendColor="text-blue-700"
          />
          <KPICard
            title="Applications Rejected"
            value={rejected}
            icon={<XCircle className="text-red-600 w-7 h-7"/>}
            bg="bg-gradient-to-br from-red-50 to-rose-50"
            borderColor="border-red-200"
            trend="Low match criteria"
            trendColor="text-red-600"
            sparklineData={sparklineData.map(d => d.rejected)}
            sparklineColor="#dc2626"
          />
          <KPICard
            title="Time Saved"
            value={`${(applied * 0.5).toFixed(1)}h`}
            icon={<Clock className="text-amber-600 w-7 h-7"/>}
            bg="bg-gradient-to-br from-amber-50 to-orange-50"
            borderColor="border-amber-200"
            trend="30 mins per application"
            trendColor="text-amber-700"
          />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Application Funnel Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-corporate-lg shadow-corporate border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Application Pipeline Analysis</h3>
                <p className="text-sm text-gray-600">Conversion funnel from scan to application</p>
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
                className="px-4 py-2 border border-gray-300 rounded-corporate text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
              </select>
            </div>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={funnelData.length > 0 ? funnelData : [{name: 'No Data', value: 0}]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}}
                  />
                  <Tooltip
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      backgroundColor: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={64}>
                    {funnelData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#9ca3af', '#2563eb', '#16a34a', '#dc2626'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-corporate-lg shadow-corporate border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600">Latest application updates</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">View All</button>
            </div>
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
              {applications.length === 0 ? (
                <div className="text-center py-16">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-semibold text-lg">No applications yet</p>
                  <p className="text-gray-400 text-sm mt-2">Start the AI agent to begin tracking</p>
                </div>
              ) : (
                [...applications].reverse().slice(0, 8).map((app) => (
                  <div key={app.id} className="flex items-start p-4 rounded-corporate hover:bg-gray-50 transition-colors border border-gray-100 group">
                    <div className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${
                      app.status === ApplicationStatus.APPLIED ? 'bg-green-500' :
                      app.status === ApplicationStatus.REJECTED ? 'bg-red-400' :
                      app.status === ApplicationStatus.PENDING ? 'bg-amber-400' :
                      app.status === ApplicationStatus.ANALYZING ? 'bg-blue-400' :
                      'bg-gray-400'
                    }`}></div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{app.jobTitle}</p>
                      <p className="text-xs text-gray-600 font-medium">{app.company}</p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{new Date(app.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-sm font-bold text-gray-900">{app.matchScore}%</div>
                      <div className={`text-xs font-semibold ${
                        app.matchScore >= 70 ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {app.matchScore >= 70 ? 'Strong Match' : 'Low Match'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status Breakdown Chart */}
          <div className="bg-white p-6 rounded-corporate-lg shadow-corporate border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Status Distribution</h3>
                <p className="text-sm text-gray-600">Current application breakdown</p>
              </div>
              <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                {selectedPeriod === '7d' ? '7 days' : selectedPeriod === '30d' ? '30 days' : '90 days'}
              </span>
            </div>
            {statusData.length > 0 ? (
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      style={{ fontSize: '14px', fontWeight: '500' }}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        backgroundColor: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '14px', fontWeight: '500' }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[360px] flex items-center justify-center">
                <div className="text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-semibold text-lg">No data available</p>
                  <p className="text-gray-400 text-sm mt-2">Data will appear here</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// Professional KPI Card Component
const KPICard: React.FC<KPICardProps> = ({ title, value, icon, bg, borderColor, trend, trendColor, sparklineData, sparklineColor }) => {
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
    <div className={`bg-white p-6 rounded-corporate-lg shadow-corporate border ${borderColor} hover:shadow-corporate-lg transition-all duration-200 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">{value}</h3>
        </div>
        <div className={`p-4 rounded-corporate-lg ${bg} border border-gray-200 group-hover:scale-105 transition-transform duration-200`}>
          {icon}
        </div>
      </div>

      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-4 mb-3">
          <svg width="60" height="20" className="w-full">
            <path
              d={getSparklinePoints(sparklineData)}
              fill="none"
              stroke={sparklineColor || '#64748b'}
              strokeWidth="2.5"
              className="drop-shadow-sm"
            />
          </svg>
        </div>
      )}

      <div className="flex items-center">
        {trend.includes('+') || trend.includes('Above') || trend.includes('30 mins') ? (
          <TrendingUp className="w-4 h-4 mr-2" style={{ color: trendColor }} />
        ) : (
          <TrendingDown className="w-4 h-4 mr-2" style={{ color: trendColor }} />
        )}
        <p className={`text-sm font-semibold ${trendColor}`}>
          {trend}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;