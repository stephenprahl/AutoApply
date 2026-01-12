import React from 'react';
import type { ApplicationRecord } from '../types.ts';
import { ApplicationStatus } from '../types.ts';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryProps {
    applications: ApplicationRecord[];
}

const ApplicationHistory: React.FC<HistoryProps> = ({ applications }) => {
    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Application History</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="p-4">Company & Role</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Match</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {applications.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        No applications recorded yet.
                                    </td>
                                </tr>
                            )}
                            {[...applications].reverse().map((app) => (
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
                                        {app.coverLetter && (
                                            <button 
                                                onClick={() => alert(`Cover Letter for ${app.jobTitle}:\n\n${app.coverLetter}`)}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                                            >
                                                <FileText className="w-4 h-4 mr-1" /> View Letter
                                            </button>
                                        )}
                                        {app.matchReason && !app.coverLetter && (
                                            <span className="text-xs text-slate-400 italic truncate max-w-[150px] block" title={app.matchReason}>
                                                {app.matchReason}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ApplicationHistory;