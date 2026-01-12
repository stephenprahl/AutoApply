import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Search, Terminal, Loader, Settings, Zap, Target, CheckCircle, AlertTriangle, MapPin, DollarSign, Clock, Briefcase, Star } from 'lucide-react';
import clsx from 'clsx';
import type { Job, UserProfile, ApplicationRecord, AgentLog } from '../types.ts';
import { ApplicationStatus } from '../types.ts';
import { backendApi } from '../services/backendService.ts';

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

const AgentView: React.FC<AgentViewProps> = ({ profile, applications, addApplication }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [task, setTask] = useState<string>("Ready");
  const [stats, setStats] = useState({
    processed: 0,
    applied: 0,
    skipped: 0,
    successRate: 0
  });
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

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const processed = applications.length;
    const applied = applications.filter(a => a.status === ApplicationStatus.APPLIED).length;
    const skipped = applications.filter(a => a.status === ApplicationStatus.REJECTED).length;
    const successRate = processed > 0 ? Math.round((applied / processed) * 100) : 0;
    
    setStats({ processed, applied, skipped, successRate });
  }, [applications]);

  const addLog = (message: string, type: AgentLog['type'] = 'info') => {
    setLogs(prev => [...prev, { timestamp: Date.now(), message, type }]);
  };

  const processJob = async (job: Job) => {
    setCurrentJob(job);
    setTask("Analyzing job requirements...");
    setProgress(10);
    addLog(`Processing: ${job.title} at ${job.company}`, 'info');

    try {
      setTask("Evaluating match score...");
      setProgress(30);
      const fit = await backendApi.analyzeJobFit(profile, job);
      
      if (fit.score < config.matchThreshold) {
        addLog(`Rejected: Low match score (${fit.score}%). ${fit.reason}`, 'warning');
        addApplication({
          id: Math.random().toString(36),
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          status: ApplicationStatus.REJECTED,
          matchScore: fit.score,
          matchReason: fit.reason,
          timestamp: Date.now()
        });
        setProgress(100);
        return;
      }

      addLog(`High match detected (${fit.score}%)! Preparing application...`, 'success');
      
      if (config.autoApply) {
        setTask("Generating personalized cover letter...");
        setProgress(60);
        const coverLetter = await backendApi.generateCoverLetter(profile, job);
        addLog("Cover letter generated successfully.", 'info');
        
        setTask("Submitting application...");
        setProgress(90);
        await new Promise(r => setTimeout(r, 2000)); // Simulate API call
        
        addLog(`Application submitted to ${job.company}`, 'success');
        addApplication({
          id: Math.random().toString(36),
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          status: ApplicationStatus.APPLIED,
          matchScore: fit.score,
          matchReason: fit.reason,
          coverLetter: coverLetter.coverLetter,
          timestamp: Date.now()
        });
      } else {
        addLog(`High match found (${fit.score}%). Manual review required.`, 'warning');
      }

      setProgress(100);
    } catch (error) {
      addLog(`Error processing job: ${error}`, 'error');
    }
  };

  const startAgent = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog("AI Agent initialized. Starting job search...", 'info');
    
    try {
      // Simulate finding jobs (in real app, this would call job board APIs)
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
          logo: '/api/placeholder/64/64'
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
          logo: '/api/placeholder/64/64'
        }
      ];

      const jobsToProcess = mockJobs.filter(job => 
        !applications.find(app => app.jobId === job.id)
      );

      if (jobsToProcess.length === 0) {
        addLog("No new matching positions found.", 'warning');
        setIsRunning(false);
        setTask("Idle");
        return;
      }

      addLog(`Found ${jobsToProcess.length} new positions to analyze.`, 'info');

      for (const job of jobsToProcess) {
        if (!isRunning) break;
        await processJob(job);
        await new Promise(r => setTimeout(r, 1000)); // Rate limiting
      }

    } catch (error) {
      addLog(`Agent error: ${error}`, 'error');
    }

    setIsRunning(false);
    setTask("Completed");
    setCurrentJob(null);
    addLog("Batch processing complete.", 'success');
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
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">AI Agent Control Center</h1>
          <p className="text-gray-600 mt-1">Automated job application and matching system</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowJobSearch(!showJobSearch)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search Jobs
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configuration
          </button>
        </div>
      </div>

      {/* Job Search Panel */}
      {showJobSearch && (
        <div className="bg-white rounded-lg shadow-corporate border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Jobs</h3>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJobSearch()}
                placeholder="Search for jobs by title, company, or keywords..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleJobSearch}
              disabled={!searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Search Results ({searchResults.length})</h4>
              {searchResults.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">{job.title}</h5>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {job.salary}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.postedAt}
                        </span>
                        <div className="flex gap-2">
                          {job.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJobSelect(job)}
                      className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showConfig && (
        <div className="bg-white rounded-lg shadow-corporate border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Match Threshold (%)</label>
              <input
                type="number"
                value={config.matchThreshold}
                onChange={(e) => setConfig({...config, matchThreshold: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Applications per Hour</label>
              <input
                type="number"
                value={config.applicationsPerHour}
                onChange={(e) => setConfig({...config, applicationsPerHour: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="50"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoApply"
                checked={config.autoApply}
                onChange={(e) => setConfig({...config, autoApply: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoApply" className="ml-2 text-sm font-medium text-gray-700">
                Auto-apply to matches
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs Processed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.processed}</p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applications Sent</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.applied}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applications Skipped</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.skipped}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-corporate border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.successRate}%</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Agent Status & Control */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-corporate border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Agent Status</h2>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="relative flex h-3 w-3">
                    {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={clsx("relative inline-flex rounded-full h-3 w-3", isRunning ? "bg-green-500" : "bg-gray-400")}></span>
                  </span>
                  <span className="text-gray-600 font-medium">
                    {isRunning ? "Active & Processing" : "Offline"}
                  </span>
                </div>
              </div>
              
              <button
                onClick={toggleAgent}
                className={clsx(
                  "px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all",
                  isRunning 
                    ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Stop Agent
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Start Agent
                  </>
                )}
              </button>
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Task</span>
                <span className="text-gray-900 font-medium">{progress}%</span>
              </div>
              <div className="flex items-center gap-3">
                {isRunning && <Loader className="w-4 h-4 animate-spin text-blue-600" />}
                <span className="text-gray-900 font-medium">{task}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Current Job Processing */}
          <div className="bg-white rounded-lg shadow-corporate border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              Current Processing
            </h3>
            
            {currentJob ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{currentJob.title}</h4>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">Match Score</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {currentJob?.company || ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {currentJob?.location || ''}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {currentJob?.tags?.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                          {tag}
                        </span>
                      )) || []}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No job currently processing</p>
                <p className="text-gray-400 text-sm mt-1">Search for jobs or start the agent to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Terminal Logs */}
        <div className="bg-gray-900 rounded-lg shadow-corporate border border-gray-200 p-4 flex flex-col h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
            <div className="flex items-center text-gray-400">
              <Terminal className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Agent Logs</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 text-sm font-mono">
            {logs.length === 0 && (
              <div className="text-gray-600 italic">System ready...</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-gray-600 shrink-0 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' })}
                </span>
                <span className={clsx(
                  "break-words flex-1",
                  log.type === 'success' && "text-green-400",
                  log.type === 'error' && "text-red-400",
                  log.type === 'warning' && "text-yellow-400",
                  log.type === 'info' && "text-blue-300",
                )}>
                  {log.type === 'success' && "✓ "}
                  {log.type === 'error' && "✗ "}
                  {log.type === 'warning' && "⚠ "}
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentView;