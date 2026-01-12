import React, { useState, useMemo } from 'react';
import type { Job, UserProfile, ApplicationRecord } from '../types.ts';
import { Star, MapPin, DollarSign, Clock, Briefcase, TrendingUp, ExternalLink, CheckCircle, X } from 'lucide-react';

interface JobRecommendationsProps {
  profile: UserProfile;
  applications: ApplicationRecord[];
  onSelectJob: (job: Job) => void;
}

const JobRecommendations: React.FC<JobRecommendationsProps> = ({ profile, applications, onSelectJob }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'recommended' | 'new' | 'trending'>('recommended');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Mock job data - in real app, this would come from an API
  const mockJobs: Job[] = [
    {
      id: 'rec-1',
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
      id: 'rec-2',
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'San Francisco, CA',
      salary: '$100k - $140k',
      description: 'Join our fast-paced startup to build innovative web applications. We are looking for someone who is passionate about technology and wants to make an impact.',
      postedAt: '1 day ago',
      tags: ['Node.js', 'React', 'MongoDB', 'Startup'],
      logo: '/api/placeholder/64/64'
    },
    {
      id: 'rec-3',
      title: 'React Developer',
      company: 'Digital Agency',
      location: 'New York, NY',
      salary: '$90k - $120k',
      description: 'We are looking for a talented React developer to join our creative team. You will work on various client projects and help shape the future of web development.',
      postedAt: '3 days ago',
      tags: ['React', 'JavaScript', 'CSS', 'Agency'],
      logo: '/api/placeholder/64/64'
    },
    {
      id: 'rec-4',
      title: 'Frontend Engineer',
      company: 'Enterprise Corp',
      location: 'Remote',
      salary: '$130k - $170k',
      description: 'Large enterprise seeking experienced Frontend Engineer to work on mission-critical applications. Great benefits and work-life balance.',
      postedAt: '5 hours ago',
      tags: ['React', 'TypeScript', 'Enterprise', 'Benefits'],
      logo: '/api/placeholder/64/64'
    },
    {
      id: 'rec-5',
      title: 'UI/UX Developer',
      company: 'Design Studio',
      location: 'Remote',
      salary: '$85k - $110k',
      description: 'Perfect role for someone who loves both design and code. You will work closely with our design team to bring beautiful interfaces to life.',
      postedAt: '1 week ago',
      tags: ['UI/UX', 'React', 'Design', 'Creative'],
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
    const jobsWithScore = mockJobs.map(job => ({
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
  }, [selectedCategory, applications, profile]);

  const categories = [
    { id: 'all', label: 'All Jobs', count: mockJobs.length },
    { id: 'recommended', label: 'Recommended', count: filteredJobs.filter(j => calculateMatchScore(j) >= 70).length },
    { id: 'new', label: 'New', count: mockJobs.filter(j => j.postedAt.includes('hour') || j.postedAt.includes('day')).length },
    { id: 'trending', label: 'Trending', count: mockJobs.filter(j => j.tags.includes('React')).length }
  ];

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    return 'text-amber-600 bg-amber-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Job Recommendations</h2>
          <p className="text-gray-600 mt-1">Personalized opportunities based on your profile</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>Updated 2 hours ago</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedCategory === category.id
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {category.label}
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No jobs found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="bg-white rounded-lg shadow-corporate border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(job.matchScore)}`}>
                          <Star className="w-3 h-3 inline mr-1" />
                          {job.matchScore}% Match
                        </span>
                        {job.isApplied && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            Applied
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {expandedJob === job.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{job.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {expandedJob === job.id ? (
                      <>
                        <X className="w-4 h-4 inline mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 inline mr-1" />
                        Details
                      </>
                    )}
                  </button>
                  
                  {!job.isApplied && (
                    <button
                      onClick={() => onSelectJob(job)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select Job
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobRecommendations;
