import clsx from 'clsx';
import { AlertTriangle, Briefcase, CheckCircle, Clock, DollarSign, Loader, MapPin, Pause, Play, Search, Settings, Star, Target, Terminal, Zap } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { backendApi } from '../services/backendService.ts';
import type { AgentLog, ApplicationRecord, Job, UserProfile } from '../types.ts';
import { ApplicationStatus } from '../types.ts';

interface AgentViewProps {
  profile: UserProfile;
  applications: ApplicationRecord[];
  addApplication: (app: ApplicationRecord) => void;
}

interface AgentConfig {
  matchThreshold: number;
  applicationsPerHour: number;
  autoApply: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  keywords: string[];
  excludeKeywords: string[];
  location: string;
  salaryMin: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'any';
  remoteOnly: boolean;
}

const AgentView: React.FC<AgentViewProps> = ({ profile: _profile, applications, addApplication }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [task, setTask] = useState<string>("Ready");
  const [config, setConfig] = useState<AgentConfig>({
    matchThreshold: 70,
    applicationsPerHour: 10,
    autoApply: true,
    workingHours: { start: '09:00', end: '17:00' },
    keywords: ['React', 'TypeScript', 'Node.js'],
    excludeKeywords: ['Junior', 'Intern'],
    location: 'Remote',
    salaryMin: '100000',
    jobType: 'full-time',
    remoteOnly: true
  });
  const [showConfig, setShowConfig] = useState(false);
  const [showJobSearch, setShowJobSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const logsEndRef = useRef<HTMLDivElement>(null);

  const lastActivity = useMemo(() => {
    if (logs.length === 0) return 'No activity yet';
    const lastLog = logs[logs.length - 1];
    return lastLog ? new Date(lastLog.timestamp).toLocaleString() : 'No activity yet';
  }, [logs]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const stats = useMemo(() => {
    const processed = applications.length;
    const applied = applications.filter(a => a.status === ApplicationStatus.APPLIED).length;
    const skipped = applications.filter(a => a.status === ApplicationStatus.REJECTED).length;
    const successRate = processed > 0 ? Math.round((applied / processed) * 100) : 0;
    return { processed, applied, skipped, successRate };
  }, [applications]);

  const addLog = (message: string, type: AgentLog['type'] = 'info') => {
    setLogs(prev => [...prev, { timestamp: Date.now(), message, type }]);
  };

  const startAgent = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog("AI Agent initialized. Starting auto-apply workflow...", 'info');
    setTask("Running auto-apply workflow...");

    try {
      // Use the new backend auto-apply workflow
      const mockJobs: Job[] = [
        {
          id: '1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp',
          location: 'Remote',
          salary: '$120k - $160k',
          description: 'Looking for an experienced frontend developer with React and TypeScript expertise...',
          postedAt: '2 hours ago',
          tags: ['React', 'TypeScript', 'Remote'],
          logo: '/api/placeholder/64/64',
          applicationUrl: 'https://careers.techcorp.com/jobs/senior-frontend-developer'
        },
        {
          id: '2',
          title: 'Full Stack Engineer',
          company: 'StartupXYZ',
          location: 'San Francisco',
          salary: '$100k - $140k',
          description: 'Join our team to build innovative web applications using modern technologies...',
          postedAt: '1 day ago',
          tags: ['Node.js', 'React', 'MongoDB'],
          logo: '/api/placeholder/64/64',
          applicationUrl: 'https://startupxyz.com/careers/full-stack-engineer'
        }
      ];

      addLog(`Processing ${mockJobs.length} jobs through auto-apply workflow...`, 'info');
      setProgress(25);

      const result = await backendApi.runAutoApply(mockJobs, config.applicationsPerHour);

      setProgress(75);
      addLog("Auto-apply workflow completed successfully!", 'success');

      // Add the new applications to the state
      if (result.applications) {
        result.applications.forEach((app: ApplicationRecord) => addApplication(app));
        addLog(`Added ${result.applications.length} new applications.`, 'info');
      }

      // Add workflow logs
      if (result.logs) {
        result.logs.forEach((log: AgentLog) => {
          addLog(log.message, log.type as 'info' | 'success' | 'warning' | 'error');
        });
      }

      setProgress(100);

    } catch (error) {
      addLog(`Auto-apply workflow failed: ${error}`, 'error');
    }

    setIsRunning(false);
    setTask("Completed");
    setCurrentJob(null);
  };

  const stopAgent = () => {
    setIsRunning(false);
    setTask("Stopping...");
    addLog("Agent stopped by user.", 'warning');
  };

  const toggleAgent = () => {
    if (isRunning) stopAgent();
    else startAgent();
  };

  const handleJobSearch = async () => {
    if (!searchQuery.trim()) return;

    setTask("Searching jobs...");
    try {
      // Simulate job search API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockResults: Job[] = [
        {
          id: 'search-1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp',
          location: 'Remote',
          salary: '$120k - $160k',
          description: 'Looking for an experienced frontend developer with React and TypeScript expertise...',
          postedAt: '2 hours ago',
          tags: ['React', 'TypeScript', 'Remote'],
          logo: '/api/placeholder/64/64'
        },
        {
          id: 'search-2',
          title: 'Full Stack Engineer',
          company: 'StartupXYZ',
          location: 'San Francisco',
          salary: '$100k - $140k',
          description: 'Join our team to build innovative web applications using modern technologies...',
          postedAt: '1 day ago',
          tags: ['Node.js', 'React', 'MongoDB'],
          logo: '/api/placeholder/64/64'
        },
        {
          id: 'search-3',
          title: 'React Developer',
          company: 'Digital Agency',
          location: 'New York',
          salary: '$90k - $120k',
          description: 'We are looking for a talented React developer to join our growing team...',
          postedAt: '3 days ago',
          tags: ['React', 'JavaScript', 'CSS'],
          logo: '/api/placeholder/64/64'
        }
      ];

      setSearchResults(mockResults);
      addLog(`Found ${mockResults.length} jobs matching "${searchQuery}"`, 'info');
    } catch (error) {
      addLog(`Search error: ${error}`, 'error');
    }
    setTask("Ready");
  };

  const handleJobSelect = (job: Job) => {
    setShowJobSearch(false);
    setCurrentJob(job);
    addLog(`Selected job: ${job.title} at ${job.company}`, 'info');
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
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">AI Agent Control Center</h1>
              </div>
              <p className="text-lg text-gray-600 font-medium">Intelligent automated job application and matching system</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600 font-medium">
                    {isRunning ? 'Agent Active' : 'Agent Offline'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Last activity: {lastActivity}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowJobSearch(!showJobSearch)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-corporate text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                <Search className="w-4 h-4" />
                Search Jobs
              </button>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-corporate text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                <Settings className="w-4 h-4" />
                Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Job Search Panel */}
        {showJobSearch && (
          <div className="bg-white rounded-corporate-lg shadow-corporate border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-900">Job Search</h3>
            </div>
            <div className="flex gap-4 mb-8">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJobSearch()}
                  placeholder="Search for jobs by title, company, or keywords..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-corporate focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 font-medium"
                />
              </div>
              <button
                onClick={handleJobSearch}
                disabled={!searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-corporate hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Search Results</h4>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {searchResults.length} jobs found
                  </span>
                </div>
                {searchResults.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-corporate p-6 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="text-lg font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{job.title}</h5>
                        <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-2 font-medium">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-2 font-medium">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-2 font-medium">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            {job.salary}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-2 font-medium">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {job.postedAt}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {job.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full font-semibold border border-blue-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleJobSelect(job)}
                        className="ml-6 px-6 py-3 bg-green-600 text-white rounded-corporate hover:bg-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                      >
                        Select Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Configuration Panel */}
        {showConfig && (
          <div className="bg-white rounded-corporate-lg shadow-corporate border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-900">Agent Configuration</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">Match Threshold (%)</label>
                <input
                  type="number"
                  value={config.matchThreshold}
                  onChange={(e) => setConfig({ ...config, matchThreshold: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-corporate focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">Applications per Hour</label>
                <input
                  type="number"
                  value={config.applicationsPerHour}
                  onChange={(e) => setConfig({ ...config, applicationsPerHour: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-corporate focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  min="1"
                  max="50"
                />
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoApply"
                  checked={config.autoApply}
                  onChange={(e) => setConfig({ ...config, autoApply: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoApply" className="text-sm font-bold text-gray-900">
                  Auto-apply to matches
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Jobs Processed"
            value={stats.processed}
            icon={<Target className="text-blue-600 w-7 h-7" />}
            bg="bg-gradient-to-br from-blue-50 to-indigo-50"
            borderColor="border-blue-200"
            trend="Total analyzed"
            trendColor="text-blue-700"
          />
          <MetricCard
            title="Applications Sent"
            value={stats.applied}
            icon={<CheckCircle className="text-green-600 w-7 h-7" />}
            bg="bg-gradient-to-br from-green-50 to-emerald-50"
            borderColor="border-green-200"
            trend="Successfully submitted"
            trendColor="text-green-700"
          />
          <MetricCard
            title="Applications Skipped"
            value={stats.skipped}
            icon={<AlertTriangle className="text-amber-600 w-7 h-7" />}
            bg="bg-gradient-to-br from-amber-50 to-orange-50"
            borderColor="border-amber-200"
            trend="Low match criteria"
            trendColor="text-amber-700"
          />
          <MetricCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={<Zap className="text-purple-600 w-7 h-7" />}
            bg="bg-gradient-to-br from-purple-50 to-violet-50"
            borderColor="border-purple-200"
            trend="Conversion rate"
            trendColor="text-purple-700"
          />
        </div>

        {/* Main Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Agent Status & Current Processing */}
          <div className="lg:col-span-2 space-y-8">

            {/* Agent Status Card */}
            <div className="bg-white rounded-corporate-lg shadow-corporate border border-gray-200 p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Status</h2>
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-4 w-4">
                      {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                      <span className={clsx("relative inline-flex rounded-full h-4 w-4", isRunning ? "bg-green-500" : "bg-gray-400")}></span>
                    </span>
                    <span className="text-lg text-gray-600 font-semibold">
                      {isRunning ? "Active & Processing" : "Offline"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={toggleAgent}
                  className={clsx(
                    "px-8 py-4 rounded-corporate font-bold flex items-center gap-3 transition-all duration-200 shadow-sm hover:shadow-md",
                    isRunning
                      ? "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-300"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5" /> Stop Agent
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" /> Start Agent
                    </>
                  )}
                </button>
              </div>

              {/* Progress Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Current Task</span>
                  <span className="text-gray-900 font-bold text-lg">{progress}%</span>
                </div>
                <div className="flex items-center gap-3">
                  {isRunning && <Loader className="w-5 h-5 animate-spin text-blue-600" />}
                  <span className="text-gray-900 font-semibold text-lg">{task}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Current Job Processing */}
            <div className="bg-white rounded-corporate-lg shadow-corporate border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Search className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Current Processing</h3>
              </div>

              {currentJob ? (
                <div className="border-2 border-gray-200 rounded-corporate p-6 bg-gray-50">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-white rounded-corporate flex items-center justify-center border-2 border-gray-200">
                      <Target className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-xl font-bold text-gray-900">{currentJob.title}</h4>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full">
                          <Star className="w-4 h-4 text-yellow-600 fill-current" />
                          <span className="text-sm font-bold text-yellow-700">Analyzing Match</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mb-4 text-gray-600">
                        <span className="flex items-center gap-2 font-semibold">
                          <Briefcase className="w-5 h-5 text-gray-400" />
                          {currentJob.company}
                        </span>
                        <span className="flex items-center gap-2 font-semibold">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          {currentJob.location}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        {currentJob.tags?.map(tag => (
                          <span key={tag} className="px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-full font-bold border border-blue-200">
                            {tag}
                          </span>
                        )) || []}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-bold text-lg">No job currently processing</p>
                  <p className="text-gray-400 text-sm mt-2 font-medium">Search for jobs or start the agent to begin automation</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Terminal Logs */}
          <div className="bg-gray-900 rounded-corporate-lg shadow-corporate border border-gray-200 p-6 flex flex-col h-[600px]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-700 mb-4">
              <div className="flex items-center text-gray-300">
                <Terminal className="w-5 h-5 mr-3" />
                <span className="text-lg font-bold">Agent Logs</span>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50"></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-sm font-mono">
              {logs.length === 0 && (
                <div className="text-gray-500 italic text-center py-8">
                  <Terminal className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                  <p className="font-medium">System ready for commands...</p>
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 group">
                  <span className="text-gray-500 shrink-0 text-xs font-bold bg-gray-800 px-2 py-1 rounded">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={clsx(
                    "break-words flex-1 leading-relaxed",
                    log.type === 'success' && "text-green-400",
                    log.type === 'error' && "text-red-400",
                    log.type === 'warning' && "text-yellow-400",
                    log.type === 'info' && "text-blue-300",
                  )}>
                    <span className="font-bold mr-2">
                      {log.type === 'success' && "✓"}
                      {log.type === 'error' && "✗"}
                      {log.type === 'warning' && "⚠"}
                      {log.type === 'info' && "ℹ"}
                    </span>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentView;

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