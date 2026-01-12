import { Briefcase, CheckCircle, Clock, DollarSign, ExternalLink, MapPin, RefreshCw, Search, Star, TrendingUp, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { backendApi } from '../services/backendService.ts';
import type { ApplicationRecord, Job, UserProfile } from '../types.ts';

interface JobRecommendationsProps {
  profile: UserProfile;
  applications: ApplicationRecord[];
  onSelectJob: (job: Job) => void;
}

const JobRecommendations: React.FC<JobRecommendationsProps> = ({ profile, applications, onSelectJob }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'recommended' | 'new' | 'trending'>('recommended');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    keywords: profile.skills.slice(0, 3),
    location: 'Remote',
    remote: profile.preferences.remote
  });

  // Fetch jobs based on category and search params
  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      switch (selectedCategory) {
        case 'trending':
          response = await backendApi.getTrendingJobs();
          break;
        case 'recommended':
        case 'all':
        default:
          response = await backendApi.searchJobs(searchParams);
          break;
      }

      setJobs(response.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to load jobs. Please try again.');
      // Fallback to mock data if API fails
      setJobs(getMockJobs());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory, searchParams]);

  // Mock jobs as fallback
  const getMockJobs = (): Job[] => [
    {
      id: 'fallback-1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp',
      location: 'Remote',
      salary: '$120k - $160k',
      description: 'We are looking for an experienced Frontend Developer to join our growing team. You will work on cutting-edge web applications using React, TypeScript, and modern CSS frameworks.',
      postedAt: '2 hours ago',
      tags: ['React', 'TypeScript', 'Remote', 'Senior'],
      logo: '/api/placeholder/64/64'
    },
    {
      id: 'fallback-2',
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'San Francisco, CA',
      salary: '$100k - $140k',
      description: 'Join our fast-paced startup to build innovative web applications. We are looking for someone who is passionate about technology and wants to make an impact.',
      postedAt: '1 day ago',
      tags: ['Node.js', 'React', 'MongoDB', 'Startup'],
      logo: '/api/placeholder/64/64'
    }
  ];

  // Calculate match score based on profile
  const calculateMatchScore = (job: Job): number => {
    let score = 50; // Base score

    // Skill matching
    const jobSkills = job.tags.map(tag => tag.toLowerCase());
    const userSkills = profile.skills.map(skill => skill.toLowerCase());
    const matchingSkills = jobSkills.filter(skill =>
      userSkills.some(userSkill => skill.includes(userSkill) || userSkill.includes(skill))
    );
    score += matchingSkills.length * 10;

    // Experience level matching
    if (job.title.toLowerCase().includes('senior') && parseInt(profile.experience) >= 3) {
      score += 15;
    } else if (job.title.toLowerCase().includes('junior') && parseInt(profile.experience) < 3) {
      score += 15;
    }

    // Remote preference
    if (profile.preferences.remote && job.location.toLowerCase().includes('remote')) {
      score += 10;
    }

    // Salary preference
    const salaryNum = parseInt(job.salary.replace(/[^0-9]/g, ''));
    if (salaryNum >= profile.preferences.minSalary) {
      score += 10;
    }

    return Math.min(score, 100);
  };

  // Filter jobs based on category
  const filteredJobs = useMemo(() => {
    const jobsWithScore = jobs.map(job => ({
      ...job,
      matchScore: calculateMatchScore(job),
      isApplied: applications.some(app => app.jobId === job.id)
    }));

    switch (selectedCategory) {
      case 'recommended':
        return jobsWithScore.filter(job => job.matchScore >= 70).sort((a, b) => b.matchScore - a.matchScore);
      case 'new':
        return jobsWithScore.filter(job => job.postedAt.includes('hour') || job.postedAt.includes('day'));
      case 'trending':
        return jobsWithScore.filter(job => job.tags.includes('React') || job.tags.includes('TypeScript'));
      default:
        return jobsWithScore;
    }
  }, [selectedCategory, jobs, applications, profile]);

  const categories = [
    { id: 'all', label: 'All Jobs', count: jobs.length },
    { id: 'recommended', label: 'Recommended', count: jobs.filter(j => calculateMatchScore(j) >= 70).length },
    { id: 'new', label: 'New', count: jobs.filter(j => j.postedAt.includes('hour') || j.postedAt.includes('day')).length },
    { id: 'trending', label: 'Trending', count: jobs.filter(j => j.tags.includes('React') || j.tags.includes('TypeScript')).length }
  ];

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Job Recommendations</h1>
                <p className="text-sm text-gray-600 mt-1">Personalized opportunities based on your profile and preferences</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchJobs}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Updated {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="e.g., React, TypeScript, Node.js"
                    value={searchParams.keywords.join(', ')}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, State or Remote"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remote"
                  checked={searchParams.remote}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, remote: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remote" className="text-sm font-medium text-gray-700">Remote only</label>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="px-6 py-4 border-b border-gray-200">
            <nav className="flex gap-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as any)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  {category.label}
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {category.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Job Cards */}
          <div className="p-6">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No jobs found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <div key={job.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMatchColor(job.matchScore)}`}>
                                <Star className="w-3 h-3 mr-1" />
                                {job.matchScore}% Match
                              </span>
                              {job.isApplied && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Applied
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
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
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {job.postedAt}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {expandedJob === job.id && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                                <p className="text-gray-700 text-sm leading-relaxed">{job.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                        <button
                          onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {expandedJob === job.id ? (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Details
                            </>
                          )}
                        </button>

                        {!job.isApplied && (
                          <button
                            onClick={() => onSelectJob(job)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Select Job
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobRecommendations;
