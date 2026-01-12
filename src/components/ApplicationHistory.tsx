import { ArrowUpDown, Building2, Calendar, CheckCircle2, CheckSquare, Download, Eye, FileText, Filter, Search, Square, X, XCircle } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { ApplicationRecord } from '../types.ts';
import { ApplicationStatus } from '../types.ts';

interface HistoryProps {
    applications: ApplicationRecord[];
}

type SortField = 'timestamp' | 'matchScore' | 'company' | 'jobTitle' | 'status';
type SortOrder = 'asc' | 'desc';

const ApplicationHistory: React.FC<HistoryProps> = ({ applications }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'applied' | 'pending' | 'failed'>('all');
    const [sortField, setSortField] = useState<SortField>('timestamp');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedApplication, setSelectedApplication] = useState<ApplicationRecord | null>(null);
    const [showCoverLetter, setShowCoverLetter] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [matchScoreRange, setMatchScoreRange] = useState({ min: 0, max: 100 });
    const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Filtered and sorted applications
    const filteredAndSortedApplications = useMemo(() => {
        let filtered = applications.filter(app => {
            const matchesSearch = searchTerm === '' ||
                app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (app.matchReason && app.matchReason.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'submitted' && app.status === ApplicationStatus.SUBMITTED) ||
                (statusFilter === 'applied' && app.status === ApplicationStatus.APPLIED) ||
                (statusFilter === 'pending' && (app.status === ApplicationStatus.PENDING || app.status === ApplicationStatus.READY_TO_SUBMIT || app.status === ApplicationStatus.ANALYZING)) ||
                (statusFilter === 'failed' && app.status === ApplicationStatus.FAILED);

            const matchesDateRange = (!dateRange.start || new Date(app.timestamp) >= new Date(dateRange.start)) &&
                (!dateRange.end || new Date(app.timestamp) <= new Date(dateRange.end));

            const matchesMatchScore = app.matchScore >= matchScoreRange.min && app.matchScore <= matchScoreRange.max;

            return matchesSearch && matchesStatus && matchesDateRange && matchesMatchScore;
        });

        // Sort applications
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortField) {
                case 'timestamp':
                    aValue = new Date(a.timestamp);
                    bValue = new Date(b.timestamp);
                    break;
                case 'matchScore':
                    aValue = a.matchScore;
                    bValue = b.matchScore;
                    break;
                case 'company':
                    aValue = a.company.toLowerCase();
                    bValue = b.company.toLowerCase();
                    break;
                case 'jobTitle':
                    aValue = a.jobTitle.toLowerCase();
                    bValue = b.jobTitle.toLowerCase();
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [applications, searchTerm, statusFilter, sortField, sortOrder, dateRange, matchScoreRange]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedApplications.length / itemsPerPage);
    const paginatedApplications = filteredAndSortedApplications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const viewCoverLetter = (app: ApplicationRecord) => {
        setSelectedApplication(app);
        setShowCoverLetter(true);
    };

    const exportData = (selectedOnly = false) => {
        const dataToExport = selectedOnly && selectedApplications.size > 0
            ? filteredAndSortedApplications.filter(app => selectedApplications.has(app.id))
            : filteredAndSortedApplications;

        const csvContent = [
            ['Company', 'Job Title', 'Status', 'Match Score', 'Date', 'Match Reason', 'Has Cover Letter'],
            ...dataToExport.map(app => [
                app.company,
                app.jobTitle,
                app.status,
                app.matchScore.toString(),
                new Date(app.timestamp).toLocaleDateString(),
                app.matchReason || '',
                app.coverLetter ? 'Yes' : 'No'
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications-${selectedOnly ? 'selected-' : ''}${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleSelectAll = () => {
        if (selectedApplications.size === paginatedApplications.length) {
            setSelectedApplications(new Set());
        } else {
            setSelectedApplications(new Set(paginatedApplications.map(app => app.id)));
        }
    };

    const handleSelectApplication = (appId: string) => {
        const newSelected = new Set(selectedApplications);
        if (newSelected.has(appId)) {
            newSelected.delete(appId);
        } else {
            newSelected.add(appId);
        }
        setSelectedApplications(newSelected);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDateRange({ start: '', end: '' });
        setMatchScoreRange({ min: 0, max: 100 });
        setCurrentPage(1);
    };

    const handleBulkMarkReviewed = () => {
        // In a real app, you'd update the applications and make an API call
        setSelectedApplications(new Set());
        alert(`${selectedApplications.size} applications marked as reviewed`);
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedApplications.size} selected applications? This action cannot be undone.`)) {
            // In a real app, you'd make an API call to delete
            setSelectedApplications(new Set());
            alert(`${selectedApplications.size} applications deleted`);
        }
    };

    const stats = {
        total: applications.length,
        submitted: applications.filter(a => a.status === ApplicationStatus.SUBMITTED).length,
        applied: applications.filter(a => a.status === ApplicationStatus.APPLIED).length,
        pending: applications.filter(a => a.status === ApplicationStatus.PENDING || a.status === ApplicationStatus.READY_TO_SUBMIT || a.status === ApplicationStatus.ANALYZING).length,
        failed: applications.filter(a => a.status === ApplicationStatus.FAILED).length,
        skipped: applications.filter(a => a.status === ApplicationStatus.REJECTED).length,
        avgMatch: applications.length > 0
            ? Math.round(applications.reduce((sum, app) => sum + app.matchScore, 0) / applications.length)
            : 0
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
                                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Application History</h1>
                            </div>
                            <p className="text-lg text-gray-600 font-medium">Comprehensive tracking and management of your job applications</p>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-semibold text-gray-700">AI Agent Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-700">Last updated: {new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`px-6 py-3 rounded-corporate font-semibold transition-all duration-200 flex items-center gap-2 ${showAdvancedFilters
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                Advanced Filters
                            </button>
                            <button
                                onClick={() => exportData(false)}
                                className="px-6 py-3 bg-white text-gray-700 rounded-corporate hover:bg-gray-50 transition-all duration-200 font-semibold border border-gray-300 flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Applications"
                        value={stats.total}
                        icon={<FileText className="text-blue-600 w-7 h-7" />}
                        bg="bg-gradient-to-br from-blue-50 to-indigo-50"
                        borderColor="border-blue-200"
                        trend="All time applications"
                        trendColor="text-blue-700"
                    />
                    <MetricCard
                        title="Successfully Applied"
                        value={stats.applied}
                        icon={<CheckCircle2 className="text-green-600 w-7 h-7" />}
                        bg="bg-gradient-to-br from-green-50 to-emerald-50"
                        borderColor="border-green-200"
                        trend="Submitted applications"
                        trendColor="text-green-700"
                    />
                    <MetricCard
                        title="Applications Skipped"
                        value={stats.skipped}
                        icon={<XCircle className="text-red-600 w-7 h-7" />}
                        bg="bg-gradient-to-br from-red-50 to-rose-50"
                        borderColor="border-red-200"
                        trend="Filtered out by AI"
                        trendColor="text-red-700"
                    />
                    <MetricCard
                        title="Average Match Score"
                        value={`${stats.avgMatch}%`}
                        icon={<ArrowUpDown className="text-purple-600 w-7 h-7" />}
                        bg="bg-gradient-to-br from-purple-50 to-violet-50"
                        borderColor="border-purple-200"
                        trend="Overall performance"
                        trendColor="text-purple-700"
                    />
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className="bg-white rounded-corporate-lg shadow-corporate border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Filter className="w-6 h-6 text-blue-600" />
                            <h3 className="text-xl font-bold text-gray-900">Advanced Filters</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">Date Range Start</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-corporate focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">Date Range End</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-corporate focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">Min Match Score: {matchScoreRange.min}%</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={matchScoreRange.min}
                                    onChange={(e) => setMatchScoreRange({ ...matchScoreRange, min: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-900">Max Match Score: {matchScoreRange.max}%</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={matchScoreRange.max}
                                    onChange={(e) => setMatchScoreRange({ ...matchScoreRange, max: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-corporate hover:bg-gray-200 transition-all duration-200 font-semibold"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Applications Table */}
                <div className="bg-white rounded-corporate-lg shadow-corporate border border-gray-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Application Records</h3>
                            <div className="text-sm text-gray-600 font-medium">
                                Showing {filteredAndSortedApplications.length} of {applications.length} applications
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search applications by company, job title, or keywords..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-corporate focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-6 py-3 rounded-corporate font-semibold transition-all duration-200 ${statusFilter === 'all'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                        }`}
                                >
                                    All ({stats.total})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('submitted')}
                                    className={`px-6 py-3 rounded-corporate font-semibold transition-all duration-200 ${statusFilter === 'submitted'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                        }`}
                                >
                                    Submitted ({stats.submitted})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('applied')}
                                    className={`px-6 py-3 rounded-corporate font-semibold transition-all duration-200 ${statusFilter === 'applied'
                                            ? 'bg-green-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                        }`}
                                >
                                    Applied ({stats.applied})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('pending')}
                                    className={`px-6 py-3 rounded-corporate font-semibold transition-all duration-200 ${statusFilter === 'pending'
                                            ? 'bg-yellow-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                        }`}
                                >
                                    Pending ({stats.pending})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('failed')}
                                    className={`px-6 py-3 rounded-corporate font-semibold transition-all duration-200 ${statusFilter === 'failed'
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                        }`}
                                >
                                    Failed ({stats.failed})
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-6 w-12">
                                        <button
                                            onClick={handleSelectAll}
                                            className="flex items-center justify-center w-5 h-5 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                        >
                                            {selectedApplications.size === paginatedApplications.length && paginatedApplications.length > 0 ? (
                                                <CheckSquare className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <Square className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-6">
                                        <button
                                            onClick={() => { setSortField('company'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide hover:text-gray-700 transition-colors"
                                        >
                                            Company
                                            <ArrowUpDown className="w-4 h-4" />
                                        </button>
                                    </th>
                                    <th className="p-6">
                                        <button
                                            onClick={() => { setSortField('jobTitle'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide hover:text-gray-700 transition-colors"
                                        >
                                            Job Title
                                            <ArrowUpDown className="w-4 h-4" />
                                        </button>
                                    </th>
                                    <th className="p-6">
                                        <button
                                            onClick={() => { setSortField('timestamp'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide hover:text-gray-700 transition-colors"
                                        >
                                            Date Applied
                                            <ArrowUpDown className="w-4 h-4" />
                                        </button>
                                    </th>
                                    <th className="p-6">
                                        <button
                                            onClick={() => { setSortField('matchScore'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide hover:text-gray-700 transition-colors"
                                        >
                                            Match Score
                                            <ArrowUpDown className="w-4 h-4" />
                                        </button>
                                    </th>
                                    <th className="p-6">
                                        <button
                                            onClick={() => { setSortField('status'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide hover:text-gray-700 transition-colors"
                                        >
                                            Status
                                            <ArrowUpDown className="w-4 h-4" />
                                        </button>
                                    </th>
                                    <th className="p-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedApplications.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-16 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 font-bold text-lg">
                                                {applications.length === 0 ? 'No applications recorded yet' : 'No applications match your filters'}
                                            </p>
                                            <p className="text-gray-400 text-sm mt-2 font-medium">
                                                {applications.length === 0 ? 'Start the AI agent to begin tracking applications' : 'Try adjusting your search or filter criteria'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                                {paginatedApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition-colors group border-b border-gray-50">
                                        <td className="p-6">
                                            <button
                                                onClick={() => handleSelectApplication(app.id)}
                                                className="flex items-center justify-center w-5 h-5 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                            >
                                                {selectedApplications.has(app.id) ? (
                                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-corporate flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{app.company}</div>
                                                    <div className="text-xs text-gray-500 font-medium">Company</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm">{app.jobTitle}</div>
                                                <div className="text-xs text-gray-500 font-medium">Position</div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {new Date(app.timestamp).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 font-medium">
                                                {new Date(app.timestamp).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${app.matchScore >= 80 ? 'bg-green-50 border-green-200' :
                                                        app.matchScore >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                                                    }`}>
                                                    <div className="text-sm font-bold text-gray-900 min-w-[3rem] text-right">
                                                        {app.matchScore}%
                                                    </div>
                                                </div>
                                                <div className={`text-xs font-semibold mt-1 ${app.matchScore >= 80 ? 'text-green-700' :
                                                        app.matchScore >= 60 ? 'text-yellow-700' : 'text-red-600'
                                                    }`}>
                                                    {app.matchScore >= 80 ? 'Excellent Match' :
                                                        app.matchScore >= 60 ? 'Good Match' : 'Low Match'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {app.status === ApplicationStatus.SUBMITTED ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Submitted
                                                </div>
                                            ) : app.status === ApplicationStatus.APPLIED ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-green-50 text-green-700 border border-green-200">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Applied
                                                </div>
                                            ) : app.status === ApplicationStatus.READY_TO_SUBMIT ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                    <CheckSquare className="w-4 h-4" />
                                                    Ready to Submit
                                                </div>
                                            ) : app.status === ApplicationStatus.ANALYZING ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                                    <Search className="w-4 h-4" />
                                                    Analyzing
                                                </div>
                                            ) : app.status === ApplicationStatus.PENDING ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gray-50 text-gray-700 border border-gray-200">
                                                    <Square className="w-4 h-4" />
                                                    Pending
                                                </div>
                                            ) : app.status === ApplicationStatus.FAILED ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                                                    <XCircle className="w-4 h-4" />
                                                    Failed
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gray-50 text-gray-700 border border-gray-200">
                                                    <Square className="w-4 h-4" />
                                                    {app.status}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            {app.coverLetter ? (
                                                <button
                                                    onClick={() => viewCoverLetter(app)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-corporate hover:bg-blue-100 transition-all duration-200 font-semibold text-sm border border-blue-200"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Cover Letter
                                                </button>
                                            ) : app.matchReason ? (
                                                <div className="max-w-[200px]">
                                                    <div className="text-sm text-gray-600 font-medium truncate" title={app.matchReason}>
                                                        {app.matchReason}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1 font-medium">Match Analysis</div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 font-medium italic">No details available</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white rounded-corporate-lg shadow-corporate border border-gray-200 p-6 mt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-600 font-medium">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedApplications.length)} of {filteredAndSortedApplications.length} applications
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="itemsPerPage" className="text-sm font-semibold text-gray-700">Show:</label>
                                    <select
                                        id="itemsPerPage"
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-1 border border-gray-300 rounded-corporate text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-corporate hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 font-semibold"
                                >
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                        if (pageNum > totalPages) return null;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-2 rounded-corporate font-semibold transition-all duration-200 ${pageNum === currentPage
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-corporate hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 font-semibold"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Actions */}
                {selectedApplications.size > 0 && (
                    <div className="bg-blue-50 rounded-corporate-lg border border-blue-200 p-4 mt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-bold text-blue-900">
                                    {selectedApplications.size} application{selectedApplications.size !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleBulkMarkReviewed}
                                    className="px-4 py-2 bg-green-600 text-white rounded-corporate hover:bg-green-700 transition-all duration-200 font-semibold text-sm"
                                >
                                    Mark as Reviewed
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-corporate hover:bg-red-700 transition-all duration-200 font-semibold text-sm"
                                >
                                    Delete Selected
                                </button>
                                <button
                                    onClick={() => exportData(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-corporate hover:bg-blue-700 transition-all duration-200 font-semibold text-sm"
                                >
                                    Export Selected
                                </button>
                                <button
                                    onClick={() => setSelectedApplications(new Set())}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-corporate hover:bg-gray-200 transition-all duration-200 font-semibold text-sm"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Cover Letter Modal */}
                {showCoverLetter && selectedApplication && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-corporate-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                                            <h3 className="text-2xl font-bold text-gray-900">Application Cover Letter</h3>
                                        </div>
                                        <div className="flex items-center gap-6 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-gray-400" />
                                                <span className="font-semibold">{selectedApplication.company}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">at</span>
                                                <span className="font-semibold">{selectedApplication.jobTitle}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                <span className="font-semibold text-green-700">Match Score: {selectedApplication.matchScore}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowCoverLetter(false)}
                                        className="p-2 hover:bg-gray-100 rounded-corporate transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-8 max-h-[60vh] overflow-y-auto">
                                {selectedApplication.coverLetter ? (
                                    <div className="prose prose-gray max-w-none">
                                        <div className="bg-gray-50 rounded-corporate p-6 border border-gray-200">
                                            <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                                                {selectedApplication.coverLetter}
                                            </pre>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 font-medium">No cover letter available for this application</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-8 border-t border-gray-200 bg-gray-50">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowCoverLetter(false)}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-corporate hover:bg-gray-200 transition-all duration-200 font-semibold"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Professional Metric Card Component
interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    bg: string;
    borderColor: string;
    trend: string;
    trendColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, bg, borderColor, trend, trendColor }) => {
    return (
        <div className={`bg-white p-6 rounded-corporate-lg shadow-corporate border ${borderColor} hover:shadow-corporate-lg transition-all duration-200 group`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">{value}</h3>
                </div>
                <div className={`p-4 rounded-corporate-lg ${bg} border border-gray-200 group-hover:scale-105 transition-transform duration-200`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-center">
                <p className={`text-sm font-semibold ${trendColor}`}>
                    {trend}
                </p>
            </div>
        </div>
    );
};

export default ApplicationHistory;
