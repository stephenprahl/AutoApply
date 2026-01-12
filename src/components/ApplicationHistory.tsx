import React, { useState, useMemo } from 'react';
import type { ApplicationRecord } from '../types.ts';
import { ApplicationStatus } from '../types.ts';
import { CheckCircle2, XCircle, Search, Download, ArrowUpDown, Eye, X } from 'lucide-react';

interface HistoryProps {
    applications: ApplicationRecord[];
}

type SortField = 'date' | 'matchScore' | 'company' | 'jobTitle';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'applied' | 'skipped';

const ApplicationHistory: React.FC<HistoryProps> = ({ applications }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedApplication, setSelectedApplication] = useState<ApplicationRecord | null>(null);
    const [showCoverLetter, setShowCoverLetter] = useState(false);

    // Filter and sort applications
    const filteredAndSortedApplications = useMemo(() => {
        let filtered = applications;

        // Apply status filter
        if (statusFilter === 'applied') {
            filtered = filtered.filter(app => app.status === ApplicationStatus.APPLIED);
        } else if (statusFilter === 'skipped') {
            filtered = filtered.filter(app => app.status === ApplicationStatus.REJECTED);
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(app => 
                app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (app.matchReason && app.matchReason.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply sorting
        filtered = [...filtered].sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortField) {
                case 'date':
                    aValue = a.timestamp;
                    bValue = b.timestamp;
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
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [applications, searchTerm, statusFilter, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const exportData = () => {
        const csvContent = [
            ['Company', 'Job Title', 'Status', 'Match Score', 'Date', 'Match Reason', 'Has Cover Letter'],
            ...filteredAndSortedApplications.map(app => [
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
        a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const viewCoverLetter = (app: ApplicationRecord) => {
        setSelectedApplication(app);
        setShowCoverLetter(true);
    };

    const stats = {
        total: applications.length,
        applied: applications.filter(a => a.status === ApplicationStatus.APPLIED).length,
        skipped: applications.filter(a => a.status === ApplicationStatus.REJECTED).length,
        avgMatch: applications.length > 0 
            ? Math.round(applications.reduce((sum, app) => sum + app.matchScore, 0) / applications.length)
            : 0
    };
    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Application History</h1>
                    <p className="text-gray-600 mt-1">Track and manage your job applications</p>
                </div>
                <button
                    onClick={exportData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-corporate"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
                    <p className="text-sm font-medium text-gray-600">Applied</p>
                    <p className="text-2xl font-bold text-green-600">{stats.applied}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
                    <p className="text-sm font-medium text-gray-600">Skipped</p>
                    <p className="text-2xl font-bold text-red-600">{stats.skipped}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
                    <p className="text-sm font-medium text-gray-600">Avg Match Score</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.avgMatch}%</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by company, job title, or match reason..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                statusFilter === 'all'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            onClick={() => setStatusFilter('applied')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                statusFilter === 'applied'
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Applied ({stats.applied})
                        </button>
                        <button
                            onClick={() => setStatusFilter('skipped')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                statusFilter === 'skipped'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Skipped ({stats.skipped})
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-corporate border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="p-4">
                                    <button
                                        onClick={() => handleSort('company')}
                                        className="flex items-center gap-1 hover:text-gray-700"
                                    >
                                        Company & Role
                                        <ArrowUpDown className="w-3 h-3" />
                                    </button>
                                </th>
                                <th className="p-4">
                                    <button
                                        onClick={() => handleSort('date')}
                                        className="flex items-center gap-1 hover:text-gray-700"
                                    >
                                        Date
                                        <ArrowUpDown className="w-3 h-3" />
                                    </button>
                                </th>
                                <th className="p-4">
                                    <button
                                        onClick={() => handleSort('matchScore')}
                                        className="flex items-center gap-1 hover:text-gray-700"
                                    >
                                        Match
                                        <ArrowUpDown className="w-3 h-3" />
                                    </button>
                                </th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAndSortedApplications.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        {applications.length === 0 ? 'No applications recorded yet.' : 'No applications match your filters.'}
                                    </td>
                                </tr>
                            )}
                            {filteredAndSortedApplications.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800">{app.jobTitle}</div>
                                        <div className="text-sm text-slate-500">{app.company}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {new Date(app.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden mr-2">
                                                <div 
                                                    className={`h-full rounded-full ${app.matchScore > 70 ? 'bg-green-500' : 'bg-orange-400'}`} 
                                                    style={{width: `${app.matchScore}%`}}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-slate-600">{app.matchScore}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {app.status === ApplicationStatus.APPLIED ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Applied
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <XCircle className="w-3 h-3 mr-1" /> Skipped
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {app.coverLetter ? (
                                            <button 
                                                onClick={() => viewCoverLetter(app)}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                                            >
                                                <Eye className="w-4 h-4 mr-1" /> View Letter
                                            </button>
                                        ) : app.matchReason ? (
                                            <span className="text-xs text-slate-400 italic truncate max-w-[150px] block" title={app.matchReason}>
                                                {app.matchReason}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-300">No details</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cover Letter Modal */}
            {showCoverLetter && selectedApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Cover Letter</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {selectedApplication.jobTitle} at {selectedApplication.company}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCoverLetter(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                                {selectedApplication.coverLetter}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 bg-slate-50">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-slate-500">
                                    Match Score: <span className="font-semibold text-slate-700">{selectedApplication.matchScore}%</span>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(selectedApplication.coverLetter || '');
                                        alert('Cover letter copied to clipboard!');
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                >
                                    Copy to Clipboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationHistory;