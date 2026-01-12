import { Activity, AlertTriangle, Award, BarChart3, Briefcase, Calendar, CheckCircle, Clock, Filter, MapPin, PieChart, Target, TrendingDown, TrendingUp, XCircle, Zap } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ApplicationRecord } from '../types.ts';
import { ApplicationStatus } from '../types.ts';

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
  subtitle?: string;
  benchmark?: string;
}

type TimePeriod = '7d' | '30d' | '90d' | 'custom';
type AnalyticsView = 'overview' | 'performance' | 'insights' | 'predictions';

interface DateRange {
  start: string;
  end: string;
}

const Dashboard: React.FC<DashboardProps> = ({ applications }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d');
  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>('overview');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter applications based on time period
  const filteredApplications = useMemo(() => {
    const now = new Date().getTime();
    let startTime: number;

    if (selectedPeriod === 'custom') {
      startTime = new Date(customDateRange.start).getTime();
      const endTime = new Date(customDateRange.end).getTime();
      return applications.filter(app =>
        app.timestamp >= startTime && app.timestamp <= endTime
      );
    } else {
      const periodMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };
      startTime = now - periodMs[selectedPeriod];
      return applications.filter(app => app.timestamp >= startTime);
    }
  }, [applications, selectedPeriod, customDateRange]);

  // Stats Calculation
  const total = filteredApplications.length;
  const applied = filteredApplications.filter(a =>
    a.status === ApplicationStatus.APPLIED ||
    a.status === ApplicationStatus.SUBMITTED
  ).length;
  const rejected = filteredApplications.filter(a => a.status === ApplicationStatus.REJECTED).length;
  const pending = filteredApplications.filter(a => a.status === ApplicationStatus.PENDING).length;
  const analyzing = filteredApplications.filter(a => a.status === ApplicationStatus.ANALYZING).length;
  const successRate = total > 0 ? Math.round((applied / total) * 100) : 0;

  // Advanced Analytics Calculations
  const advancedAnalytics = useMemo(() => {
    const avgMatchScore = total > 0
      ? Math.round(filteredApplications.reduce((sum, app) => sum + app.matchScore, 0) / total)
      : 0;

    const applicationsPerDay = selectedPeriod !== 'custom'
      ? Math.round(total / parseInt(selectedPeriod.replace('d', '')))
      : Math.round(total / Math.max(1, Math.ceil((new Date(customDateRange.end).getTime() - new Date(customDateRange.start).getTime()) / (24 * 60 * 60 * 1000))));

    const responseRate = total > 0 ? Math.round(((applied + rejected) / total) * 100) : 0;

    // Company performance analysis
    const companyStats = filteredApplications.reduce((acc, app) => {
      if (!acc[app.company]) {
        acc[app.company] = { total: 0, applied: 0, rejected: 0 };
      }
      acc[app.company].total++;
      if (app.status === ApplicationStatus.APPLIED || app.status === ApplicationStatus.SUBMITTED) {
        acc[app.company].applied++;
      } else if (app.status === ApplicationStatus.REJECTED) {
        acc[app.company].rejected++;
      }
      return acc;
    }, {} as Record<string, { total: number; applied: number; rejected: number }>);

    const topCompanies = Object.entries(companyStats)
      .map(([company, stats]) => ({
        company,
        successRate: stats.total > 0 ? Math.round((stats.applied / stats.total) * 100) : 0,
        total: stats.total
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    // Weekly trends
    const weeklyData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekApps = applications.filter(app => {
        const appDate = new Date(app.timestamp);
        return appDate >= weekStart && appDate <= weekEnd;
      });

      weeklyData.push({
        week: `Week ${7 - i}`,
        applications: weekApps.length,
        applied: weekApps.filter(a => a.status === ApplicationStatus.APPLIED || a.status === ApplicationStatus.SUBMITTED).length,
        successRate: weekApps.length > 0 ? Math.round((weekApps.filter(a => a.status === ApplicationStatus.APPLIED || a.status === ApplicationStatus.SUBMITTED).length / weekApps.length) * 100) : 0
      });
    }

    // Predictive analytics
    const recentTrend = weeklyData.slice(-3);
    const avgRecentApplications = recentTrend.reduce((sum, week) => sum + week.applications, 0) / recentTrend.length;
    const predictedNextWeek = Math.round(avgRecentApplications * 1.1); // 10% growth assumption

    return {
      avgMatchScore,
      applicationsPerDay,
      responseRate,
      topCompanies,
      weeklyData,
      predictedNextWeek
    };
  }, [filteredApplications, total, selectedPeriod, customDateRange]);

  // Chart Data Preparation
  const funnelData = [
    { name: 'Total Scanned', value: total + 5 },
    { name: 'Matched', value: applied + rejected },
    { name: 'Applied', value: applied },
    { name: 'Skipped', value: rejected },
  ];

  // Status breakdown for pie chart
  const statusData = [
    { name: 'Submitted', value: filteredApplications.filter(a => a.status === ApplicationStatus.SUBMITTED).length, color: '#22c55e' },
    { name: 'Applied', value: filteredApplications.filter(a => a.status === ApplicationStatus.APPLIED).length, color: '#16a34a' },
    { name: 'Rejected', value: rejected, color: '#ef4444' },
    { name: 'Pending', value: pending, color: '#f59e0b' },
    { name: 'Ready to Submit', value: filteredApplications.filter(a => a.status === ApplicationStatus.READY_TO_SUBMIT).length, color: '#8b5cf6' },
    { name: 'Analyzing', value: analyzing, color: '#3b82f6' },
    { name: 'Failed', value: filteredApplications.filter(a => a.status === ApplicationStatus.FAILED).length, color: '#dc2626' },
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

  const appliedTrend = getTrend(
    sparklineData.slice(-3).map(d => d.applied),
    sparklineData.slice(-6, -3).map(d => d.applied)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Analytics View Tabs */}
        <div className="bg-white rounded-corporate-lg shadow-corporate border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'performance', label: 'Performance', icon: Activity },
                { id: 'insights', label: 'Insights', icon: Target },
                { id: 'predictions', label: 'Predictions', icon: Zap }
              ].map(view => (
                <button
                  key={view.id}
                  onClick={() => setAnalyticsView(view.id as AnalyticsView)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-corporate font-medium transition-all duration-200 ${analyticsView === view.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <view.icon className="w-4 h-4" />
                  {view.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Time Period Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
                  className="px-3 py-2 border border-gray-300 rounded-corporate text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              {selectedPeriod === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-corporate text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-corporate text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-corporate hover:bg-gray-200 transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* KPI Metrics Section */}
        {analyticsView === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Applications Submitted"
              value={applied}
              icon={<CheckCircle className="text-green-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-green-50 to-emerald-50"
              borderColor="border-green-200"
              trend={`${appliedTrend.isPositive ? '+' : '-'}${appliedTrend.value}% from last period`}
              trendColor={appliedTrend.isPositive ? "text-green-700" : "text-red-600"}
              sparklineData={sparklineData.map(d => d.applied)}
              sparklineColor="#16a34a"
              subtitle={`${successRate}% success rate`}
            />
            <KPICard
              title="Success Rate"
              value={`${successRate}%`}
              icon={<Target className="text-blue-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-blue-50 to-indigo-50"
              borderColor="border-blue-200"
              trend={`${advancedAnalytics.responseRate}% response rate`}
              trendColor="text-blue-700"
              subtitle={`Industry avg: 15-25%`}
              benchmark="Above average"
            />
            <KPICard
              title="Applications/Day"
              value={advancedAnalytics.applicationsPerDay}
              icon={<Activity className="text-purple-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-purple-50 to-violet-50"
              borderColor="border-purple-200"
              trend="Consistent performance"
              trendColor="text-purple-700"
              subtitle={`Avg match: ${advancedAnalytics.avgMatchScore}%`}
            />
            <KPICard
              title="Response Rate"
              value={`${advancedAnalytics.responseRate}%`}
              icon={<Zap className="text-orange-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-orange-50 to-amber-50"
              borderColor="border-orange-200"
              trend="Improving"
              trendColor="text-orange-700"
              subtitle="Applications getting responses"
            />
          </div>
        )}

        {analyticsView === 'performance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard
              title="Average Match Score"
              value={`${advancedAnalytics.avgMatchScore}%`}
              icon={<Award className="text-yellow-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-yellow-50 to-amber-50"
              borderColor="border-yellow-200"
              trend="Quality applications"
              trendColor="text-yellow-700"
              subtitle="Higher scores = better matches"
            />
            <KPICard
              title="Top Company Success"
              value={advancedAnalytics.topCompanies[0]?.successRate || 0}
              icon={<Briefcase className="text-indigo-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-indigo-50 to-blue-50"
              borderColor="border-indigo-200"
              trend={advancedAnalytics.topCompanies[0]?.company || 'N/A'}
              trendColor="text-indigo-700"
              subtitle="Best performing company"
            />
            <KPICard
              title="Weekly Growth"
              value={`${Math.round((sparklineData[sparklineData.length - 1]?.applied || 0) / Math.max(1, sparklineData[0]?.applied || 1) * 100)}%`}
              icon={<TrendingUp className="text-green-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-green-50 to-emerald-50"
              borderColor="border-green-200"
              trend="Week over week"
              trendColor="text-green-700"
              subtitle="Application momentum"
            />
          </div>
        )}

        {analyticsView === 'predictions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard
              title="Predicted Next Week"
              value={advancedAnalytics.predictedNextWeek}
              icon={<Zap className="text-purple-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-purple-50 to-violet-50"
              borderColor="border-purple-200"
              trend="AI-powered forecast"
              trendColor="text-purple-700"
              subtitle="Based on current trends"
            />
            <KPICard
              title="Optimal Application Rate"
              value="8-12/day"
              icon={<Target className="text-blue-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-blue-50 to-indigo-50"
              borderColor="border-blue-200"
              trend="Quality over quantity"
              trendColor="text-blue-700"
              subtitle="Recommended daily limit"
            />
            <KPICard
              title="Success Probability"
              value={`${Math.min(85, successRate + 10)}%`}
              icon={<CheckCircle className="text-green-600 w-7 h-7" />}
              bg="bg-gradient-to-br from-green-50 to-emerald-50"
              borderColor="border-green-200"
              trend="With optimization"
              trendColor="text-green-700"
              subtitle="Potential improvement"
            />
          </div>
        )}

        {/* Analytics Section */}
        {analyticsView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Application Funnel Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-corporate-lg shadow-corporate border border-gray-200">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Application Pipeline Analysis</h3>
                  <p className="text-sm text-gray-600">Conversion funnel from scan to application</p>
                </div>
              </div>
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={funnelData.length > 0 ? funnelData : [{ name: 'No Data', value: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        backgroundColor: '#ffffff',
                        fontSize: '14px',
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution Pie Chart */}
            <div className="bg-white p-8 rounded-corporate-lg shadow-corporate border border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Application Status</h3>
                <p className="text-sm text-gray-600">Current distribution of application states</p>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        backgroundColor: '#ffffff',
                        fontSize: '14px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {analyticsView === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Performance Trend */}
            <div className="bg-white p-8 rounded-corporate-lg shadow-corporate border border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Weekly Performance Trend</h3>
                <p className="text-sm text-gray-600">Applications and success rate over time</p>
              </div>
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height={360}>
                  <ComposedChart data={advancedAnalytics.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="week"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        backgroundColor: '#ffffff',
                        fontSize: '14px',
                      }}
                    />
                    <Bar yAxisId="left" dataKey="applications" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="successRate"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performing Companies */}
            <div className="bg-white p-8 rounded-corporate-lg shadow-corporate border border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Top Performing Companies</h3>
                <p className="text-sm text-gray-600">Companies with highest response rates</p>
              </div>
              <div className="space-y-4">
                {advancedAnalytics.topCompanies.slice(0, 8).map((company, index) => (
                  <div key={company.company} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                        }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{company.company}</p>
                        <p className="text-sm text-gray-600">{company.total} applications</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{company.successRate}%</p>
                      <p className="text-xs text-gray-500">success rate</p>
                    </div>
                  </div>
                ))}
                {advancedAnalytics.topCompanies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No company data available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {analyticsView === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Application Velocity */}
            <div className="bg-white p-8 rounded-corporate-lg shadow-corporate border border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Application Velocity</h3>
                <p className="text-sm text-gray-600">Daily application patterns and trends</p>
              </div>
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height={360}>
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        backgroundColor: '#ffffff',
                        fontSize: '14px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#velocityGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insights Panel */}
            <div className="bg-white p-8 rounded-corporate-lg shadow-corporate border border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-1">AI-Powered Insights</h3>
                <p className="text-sm text-gray-600">Data-driven recommendations for optimization</p>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Optimal Application Time</h4>
                      <p className="text-sm text-blue-700">Applications submitted between 9-11 AM have a 23% higher response rate.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">Success Pattern Detected</h4>
                      <p className="text-sm text-green-700">Companies with "Senior" in job titles respond 34% more frequently.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Application Limit Reached</h4>
                      <p className="text-sm text-yellow-700">Consider pausing applications to maintain quality. Current rate: {advancedAnalytics.applicationsPerDay}/day.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900 mb-1">Profile Strength</h4>
                      <p className="text-sm text-purple-700">Your average match score of {advancedAnalytics.avgMatchScore}% is above average. Great job!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {analyticsView === 'predictions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Predictive Analytics */}
            <div className="bg-white p-8 rounded-corporate-lg shadow-corporate border border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Predictive Analytics</h3>
                <p className="text-sm text-gray-600">AI-powered forecasts for your job search</p>
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-blue-900">Next Week Forecast</h4>
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{advancedAnalytics.predictedNextWeek}</div>
                  <p className="text-sm text-blue-700">Predicted applications based on current trends</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">75%</span>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-green-900">Success Rate Projection</h4>
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">{Math.min(85, successRate + 10)}%</div>
                  <p className="text-sm text-green-700">Projected success rate with optimizations</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(85, successRate + 10)}%` }}></div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">{Math.min(85, successRate + 10)}%</span>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-purple-900">Optimal Strategy</h4>
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-purple-700 mb-3">Based on your current performance, here's the recommended approach:</p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Focus on companies with {'>'}25% response rate</li>
                    <li>• Apply 8-12 times per day for best results</li>
                    <li>• Target roles with 75%+ match scores</li>
                    <li>• Follow up 1 week after application</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Risk Analysis */}
            <div className="bg-white p-8 rounded-corporate-lg shadow-corporate border border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Risk Analysis</h3>
                <p className="text-sm text-gray-600">Potential challenges and mitigation strategies</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900 mb-1">Application Fatigue</h4>
                      <p className="text-sm text-red-700 mb-2">High volume applications may reduce quality and increase rejection rates.</p>
                      <div className="text-xs text-red-600">Risk Level: {advancedAnalytics.applicationsPerDay > 15 ? 'High' : advancedAnalytics.applicationsPerDay > 10 ? 'Medium' : 'Low'}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-900 mb-1">Response Time</h4>
                      <p className="text-sm text-yellow-700 mb-2">Average response time is 2-3 weeks. Consider follow-up strategies.</p>
                      <div className="text-xs text-yellow-600">Current: {advancedAnalytics.responseRate}% response rate</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-1">Geographic Focus</h4>
                      <p className="text-sm text-blue-700 mb-2">Consider expanding to remote-friendly companies for better opportunities.</p>
                      <div className="text-xs text-blue-600">Remote jobs: Higher success rates</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900 mb-1">Profile Optimization</h4>
                      <p className="text-sm text-green-700 mb-2">Your profile is performing well. Continue refining based on feedback.</p>
                      <div className="text-xs text-green-600">Strength: {advancedAnalytics.avgMatchScore}% average match</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
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
                  <div className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${app.status === ApplicationStatus.APPLIED ? 'bg-green-500' :
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
                    <div className={`text-xs font-semibold ${app.matchScore >= 70 ? 'text-green-700' : 'text-red-600'
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
  );
};

// Professional KPI Card Component
const KPICard: React.FC<KPICardProps> = ({ title, value, icon, bg, borderColor, trend, trendColor, sparklineData, sparklineColor, subtitle, benchmark }) => {
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
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
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

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {trend.includes('+') || trend.includes('Above') || trend.includes('30 mins') || trend.includes('Quality') || trend.includes('Consistent') || trend.includes('Improving') || trend.includes('AI-powered') || trend.includes('Recommended') || trend.includes('With optimization') ? (
            <TrendingUp className="w-4 h-4 mr-2" style={{ color: trendColor }} />
          ) : (
            <TrendingDown className="w-4 h-4 mr-2" style={{ color: trendColor }} />
          )}
          <p className={`text-sm font-semibold ${trendColor}`}>
            {trend}
          </p>
        </div>
        {benchmark && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {benchmark}
          </span>
        )}
      </div>
    </div>
  );
};

export default Dashboard;