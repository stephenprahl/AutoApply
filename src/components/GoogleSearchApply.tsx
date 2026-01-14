import { useState } from 'react';
import { backendApi } from '../services/backendService';

interface LogEntry {
    timestamp: number;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

interface WorkflowResult {
    success: boolean;
    status: string;
    summary?: {
        totalLogged: number;
        successfulActions: number;
        errors: number;
        message: string;
    };
    logs?: LogEntry[];
    errors?: string[];
}

export function GoogleSearchApply() {
    const [isRunning, setIsRunning] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [maxApplications, setMaxApplications] = useState(5);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [result, setResult] = useState<WorkflowResult | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleStartWorkflow = async () => {
        setIsRunning(true);
        setResult(null);
        setLogs([]);

        try {
            // Add initial log
            setLogs([{
                timestamp: Date.now(),
                message: 'Starting Google Search Auto-Apply workflow...',
                type: 'info'
            }]);

            const response = await backendApi.runGoogleSearchApply({
                searchQuery: searchQuery || undefined,
                maxApplications,
                resume: resumeFile || undefined
            });

            setResult(response);
            if (response.logs) {
                setLogs(response.logs);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setResult({
                success: false,
                status: 'error',
                errors: [errorMessage]
            });
            setLogs(prev => [...prev, {
                timestamp: Date.now(),
                message: `Error: ${errorMessage}`,
                type: 'error'
            }]);
        } finally {
            setIsRunning(false);
        }
    };

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✗';
            case 'warning': return '⚠';
            default: return '→';
        }
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-green-600 dark:text-green-400';
            case 'error': return 'text-red-600 dark:text-red-400';
            case 'warning': return 'text-yellow-600 dark:text-yellow-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-3xl">🔍</span>
                        Google Search Auto-Apply
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Automatically search Google for job listings, match them against your resume keywords,
                        navigate to company websites, and fill out applications.
                    </p>
                </div>

                {/* Workflow Description */}
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">How it works:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-400">
                        <li>Navigates to Google and searches for hiring jobs</li>
                        <li>Analyzes search results for keywords matching your resume</li>
                        <li>Opens matching company websites</li>
                        <li>Finds careers/jobs pages and clicks "Apply"</li>
                        <li>Fills out ALL form fields on EVERY page of the application</li>
                        <li>Submits the application and reports success/failure</li>
                    </ol>
                </div>

                {/* Configuration */}
                <div className="space-y-4 mb-6">
                    {/* Resume Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Resume (Optional - uses existing profile if not provided)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                cursor-pointer"
                        />
                        {resumeFile && (
                            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                ✓ {resumeFile.name} selected
                            </p>
                        )}
                    </div>

                    {/* Search Query */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Custom Search Query (Optional)
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="e.g., 'software engineer remote hiring' - leave empty for auto-generated query"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>

                    {/* Max Applications */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Maximum Applications: {maxApplications}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={maxApplications}
                            onChange={(e) => setMaxApplications(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>1</span>
                            <span>10</span>
                            <span>20</span>
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStartWorkflow}
                    disabled={isRunning}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all
            ${isRunning
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                        }`}
                >
                    {isRunning ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Running Workflow...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            🚀 Start Google Search Auto-Apply
                        </span>
                    )}
                </button>

                {/* Results Summary */}
                {result && (
                    <div className={`mt-6 p-4 rounded-lg ${result.success
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                        <h3 className={`font-semibold ${result.success ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                            }`}>
                            {result.success ? '✓ Workflow Completed' : '✗ Workflow Failed'}
                        </h3>
                        {result.summary && (
                            <div className="mt-2 text-sm">
                                <p className="text-gray-700 dark:text-gray-300">{result.summary.message}</p>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{result.summary.totalLogged}</div>
                                        <div className="text-xs text-gray-500">Total Actions</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{result.summary.successfulActions}</div>
                                        <div className="text-xs text-gray-500">Successful</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                                        <div className="text-lg font-bold text-red-600 dark:text-red-400">{result.summary.errors}</div>
                                        <div className="text-xs text-gray-500">Errors</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Activity Log */}
                {logs.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <span>📋</span> Activity Log
                        </h3>
                        <div className="bg-gray-900 dark:bg-black rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
                            {logs.map((log, index) => (
                                <div key={index} className={`flex items-start gap-2 py-1 ${getLogColor(log.type)}`}>
                                    <span className="flex-shrink-0 w-5">{getLogIcon(log.type)}</span>
                                    <span className="text-gray-500 dark:text-gray-600 flex-shrink-0">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                    <span className="break-words">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Warning Notice */}
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300">Important Notice</h4>
                            <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
                                This automated workflow will open a browser and navigate to real websites.
                                Ensure you have reviewed your profile information before running.
                                The system runs in demo mode by default for safety.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
