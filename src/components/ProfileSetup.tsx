import { AlertCircle, CheckCircle, Edit, ExternalLink, Eye, FileText, Loader2, Plus, Save, Sparkles, Trash2, TrendingUp, Upload, User, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { backendApi } from '../services/backendService.ts';
import type { Education, PortfolioLinks, UserProfile, WorkExperience } from '../types.ts';
import ResumeOptimizer from './ResumeOptimizer.tsx';
import SkillGapAnalysis from './SkillGapAnalysis.tsx';

interface ProfileSetupProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ profile, setProfile }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [showSkillAnalysis, setShowSkillAnalysis] = useState(false);
  const [showAdvancedOptimizer, setShowAdvancedOptimizer] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'basic' | 'experience' | 'education' | 'portfolio'>('basic');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Calculate profile completion percentage
  const completionPercentage = useMemo(() => {
    const fields = [
      profile.name,
      profile.email,
      profile.phone,
      profile.title,
      profile.experience,
      profile.skills.length > 0,
      profile.resumeText,
      profile.workExperience && profile.workExperience.length > 0,
      profile.education && profile.education.length > 0,
      profile.portfolio && (Object.values(profile.portfolio).some(link => link))
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [profile]);

  const validateProfile = () => {
    const errors: string[] = [];

    if (!profile.name.trim()) errors.push('Name is required');
    if (!profile.title.trim()) errors.push('Job title is required');
    if (!profile.experience.trim()) errors.push('Experience is required');
    if (profile.skills.length === 0) errors.push('At least one skill is required');
    if (!profile.resumeText.trim()) errors.push('Resume text is required');

    return errors;
  };

  const handleSave = async () => {
    const errors = validateProfile();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setSaveStatus('saving');
    try {
      await backendApi.saveProfile(profile);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) });
  };

  const handleOptimize = async () => {
    if (!profile.resumeText) return;
    setIsOptimizing(true);
    try {
      const result = await backendApi.optimizeProfile(profile.resumeText);
      setProfile({
        ...profile,
        skills: [...new Set([...profile.skills, ...result.skills])]
      });
    } catch (error) {
      console.error('Error optimizing profile:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAdvancedOptimize = (optimizedResume: string) => {
    setProfile({
      ...profile,
      resumeText: optimizedResume
    });
    setShowAdvancedOptimizer(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const { text, skills } = await backendApi.parseResume(file);

      setProfile({
        ...profile,
        resumeText: text,
        skills: [...new Set([...profile.skills, ...skills])],
        resumeFile: {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: Date.now()
        }
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const addWorkExperience = () => {
    const newExperience: WorkExperience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      current: false,
      description: '',
      location: ''
    };
    setProfile({
      ...profile,
      workExperience: [...(profile.workExperience || []), newExperience]
    });
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setProfile({
      ...profile,
      workExperience: profile.workExperience?.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ) || []
    });
  };

  const removeWorkExperience = (id: string) => {
    setProfile({
      ...profile,
      workExperience: profile.workExperience?.filter(exp => exp.id !== id) || []
    });
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      current: false
    };
    setProfile({
      ...profile,
      education: [...(profile.education || []), newEducation]
    });
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setProfile({
      ...profile,
      education: profile.education?.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ) || []
    });
  };

  const removeEducation = (id: string) => {
    setProfile({
      ...profile,
      education: profile.education?.filter(edu => edu.id !== id) || []
    });
  };

  const updatePortfolio = (field: keyof PortfolioLinks, value: string) => {
    setProfile({
      ...profile,
      portfolio: {
        ...profile.portfolio,
        [field]: value
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Professional Profile</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your career information and preferences for AI-powered job matching.</p>

                {/* Completion indicator */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Profile Completion</span>
                      <span className="font-semibold text-gray-900">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${completionPercentage >= 80 ? 'bg-green-500' :
                          completionPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  {completionPercentage >= 80 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Ready to apply!</span>
                    </div>
                  )}
                  {completionPercentage < 60 && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Complete your profile</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isPreviewMode ? <><Edit className="w-4 h-4 mr-2" /> Edit Mode</> : <><Eye className="w-4 h-4 mr-2" /> Preview</>}
                </button>
                <button
                  onClick={() => setShowSkillAnalysis(!showSkillAnalysis)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {showSkillAnalysis ? 'Hide Analysis' : 'Skill Analysis'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving' || isPreviewMode}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Saved
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Error
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {showSkillAnalysis && (
            <div className="px-6 py-4 border-b border-gray-200">
              <SkillGapAnalysis profile={profile} />
            </div>
          )}

          {/* Preview Mode */}
          {isPreviewMode && (
            <div className="p-6">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                      {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2">{profile.name || 'Your Name'}</h1>
                      <p className="text-xl opacity-90 mb-1">{profile.title || 'Your Job Title'}</p>
                      <p className="opacity-80">{profile.experience || '0'} years of experience</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {/* Skills Section */}
                  {profile.skills.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Experience Section */}
                  {profile.workExperience && profile.workExperience.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h2>
                      <div className="space-y-6">
                        {profile.workExperience.map((exp) => (
                          <div key={exp.id} className="border-l-2 border-blue-200 pl-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                                <p className="text-gray-600">{exp.company}</p>
                                {exp.location && <p className="text-sm text-gray-500">{exp.location}</p>}
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>{new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {exp.current ? 'Present' : new Date(exp.endDate || '').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</p>
                              </div>
                            </div>
                            {exp.description && (
                              <p className="text-gray-600 leading-relaxed">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education Section */}
                  {profile.education && profile.education.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
                      <div className="space-y-6">
                        {profile.education.map((edu) => (
                          <div key={edu.id} className="border-l-2 border-purple-200 pl-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                                <p className="text-gray-600">{edu.institution}</p>
                                {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>{new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {edu.current ? 'Present' : new Date(edu.endDate || '').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio Links Section */}
                  {profile.portfolio && Object.values(profile.portfolio).some(link => link) && (
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio & Links</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.portfolio.github && (
                          <a href={profile.portfolio.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">GitHub</span>
                          </a>
                        )}
                        {profile.portfolio.linkedin && (
                          <a href={profile.portfolio.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">LinkedIn</span>
                          </a>
                        )}
                        {profile.portfolio.portfolio && (
                          <a href={profile.portfolio.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">Portfolio</span>
                          </a>
                        )}
                        {profile.portfolio.website && (
                          <a href={profile.portfolio.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">Website</span>
                          </a>
                        )}
                        {profile.portfolio.twitter && (
                          <a href={profile.portfolio.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">Twitter/X</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preferences */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Job Preferences</h3>
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-600">
                        Remote: <span className="font-medium text-gray-900">{profile.preferences.remote ? 'Yes' : 'No'}</span>
                      </span>
                      <span className="text-gray-600">
                        Min Salary: <span className="font-medium text-gray-900">${profile.preferences.minSalary.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {!isPreviewMode && (
            <>
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="px-6 py-4">
                  <div className="flex gap-1">
                    {[
                      { id: 'basic', label: 'Basic Info', icon: User },
                      { id: 'experience', label: 'Work Experience', icon: TrendingUp },
                      { id: 'education', label: 'Education', icon: FileText },
                      { id: 'portfolio', label: 'Portfolio', icon: ExternalLink }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === tab.id
                              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </div>

              {activeTab === 'basic' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Basics */}
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                              type="text"
                              name="name"
                              value={profile.name}
                              onChange={handleChange}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              placeholder="e.g. Alex Johnson"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                              type="email"
                              name="email"
                              value={profile.email || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              placeholder="e.g. alex.johnson@email.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              name="phone"
                              value={profile.phone || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              placeholder="e.g. (555) 123-4567"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Job Title</label>
                            <input
                              type="text"
                              name="title"
                              value={profile.title}
                              onChange={handleChange}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              placeholder="e.g. Senior Product Manager"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                            <input
                              type="text"
                              name="experience"
                              value={profile.experience}
                              onChange={handleChange}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              placeholder="e.g. 5 Years"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm font-medium text-gray-700">Remote Only</span>
                          <input
                            type="checkbox"
                            checked={profile.preferences.remote}
                            onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, remote: e.target.checked } })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary (USD)</label>
                          <input
                            type="number"
                            value={profile.preferences.minSalary}
                            onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, minSalary: parseInt(e.target.value) } })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Resume & Skills */}
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-lg border border-gray-200 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Resume & Skills</h3>
                          <div className="flex gap-2">
                            <label className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                              <Upload className="w-3 h-3 mr-1" />
                              Upload Resume
                              <input
                                type="file"
                                accept=".txt,.pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={isUploading}
                              />
                            </label>
                            <button
                              onClick={handleOptimize}
                              disabled={isOptimizing || !profile.resumeText}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isOptimizing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                              AI Extract
                            </button>
                            <button
                              onClick={() => setShowAdvancedOptimizer(!showAdvancedOptimizer)}
                              disabled={!profile.resumeText}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Advanced Optimize
                            </button>
                          </div>
                        </div>

                        {profile.resumeFile && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-800">{profile.resumeFile.name}</span>
                              <span className="text-xs text-green-600">({(profile.resumeFile.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              onClick={() => setProfile({ ...profile, resumeFile: undefined })}
                              className="text-green-600 hover:text-green-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {uploadError && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{uploadError}</p>
                          </div>
                        )}

                        {isUploading && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
                            <span className="text-sm text-blue-800">Processing resume...</span>
                          </div>
                        )}

                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Skills (Comma separated)</label>
                            <input
                              type="text"
                              value={profile.skills.join(', ')}
                              onChange={handleSkillsChange}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              placeholder="React, TypeScript, Node.js..."
                            />
                          </div>

                          <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Paste Resume Text</label>
                            <textarea
                              name="resumeText"
                              value={profile.resumeText}
                              onChange={handleChange}
                              className="flex-1 w-full min-h-[300px] p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed"
                              placeholder="Paste the full text content of your resume here..."
                            />
                            <p className="text-xs text-gray-400 mt-2 text-right">{profile.resumeText.length} characters</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Resume Optimizer */}
                    {showAdvancedOptimizer && (
                      <div className="mt-6">
                        <ResumeOptimizer
                          resumeText={profile.resumeText}
                          onOptimized={handleAdvancedOptimize}
                          targetJob={profile.title}
                          industry={profile.experience}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Work Experience Tab */}
              {activeTab === 'experience' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                    <button
                      onClick={addWorkExperience}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </button>
                  </div>

                  {(!profile.workExperience || profile.workExperience.length === 0) ? (
                    <div className="bg-gray-50 p-12 rounded-lg border border-gray-200 text-center">
                      <p className="text-gray-400">No work experience added yet.</p>
                      <button
                        onClick={addWorkExperience}
                        className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Add your first experience
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.workExperience.map((exp, index) => (
                        <div key={exp.id} className="bg-white p-6 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-semibold text-gray-900">Experience {index + 1}</h4>
                            <button
                              onClick={() => removeWorkExperience(exp.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="e.g. Google"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                              <input
                                type="text"
                                value={exp.position}
                                onChange={(e) => updateWorkExperience(exp.id, 'position', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="e.g. Senior Software Engineer"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                              <input
                                type="text"
                                value={exp.location || ''}
                                onChange={(e) => updateWorkExperience(exp.id, 'location', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="e.g. San Francisco, CA"
                              />
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                  type="month"
                                  value={exp.startDate}
                                  onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                />
                              </div>

                              <div className="flex items-center gap-2 mt-6">
                                <input
                                  type="checkbox"
                                  checked={exp.current}
                                  onChange={(e) => {
                                    updateWorkExperience(exp.id, 'current', e.target.checked);
                                    if (e.target.checked) {
                                      updateWorkExperience(exp.id, 'endDate', '');
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="text-sm text-gray-700">Current</label>
                              </div>

                              {!exp.current && (
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                  <input
                                    type="month"
                                    value={exp.endDate || ''}
                                    onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                              value={exp.description}
                              onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              rows={3}
                              placeholder="Describe your responsibilities and achievements..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Education Tab */}
              {activeTab === 'education' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                    <button
                      onClick={addEducation}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </button>
                  </div>

                  {(!profile.education || profile.education.length === 0) ? (
                    <div className="bg-gray-50 p-12 rounded-lg border border-gray-200 text-center">
                      <p className="text-gray-400">No education added yet.</p>
                      <button
                        onClick={addEducation}
                        className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Add your first education
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.education.map((edu, index) => (
                        <div key={edu.id} className="bg-white p-6 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-semibold text-gray-900">Education {index + 1}</h4>
                            <button
                              onClick={() => removeEducation(edu.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="e.g. Stanford University"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="e.g. Bachelor of Science"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                              <input
                                type="text"
                                value={edu.field}
                                onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="e.g. Computer Science"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">GPA (Optional)</label>
                              <input
                                type="text"
                                value={edu.gpa || ''}
                                onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="e.g. 3.8"
                              />
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                  type="month"
                                  value={edu.startDate}
                                  onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                />
                              </div>

                              <div className="flex items-center gap-2 mt-6">
                                <input
                                  type="checkbox"
                                  checked={edu.current}
                                  onChange={(e) => {
                                    updateEducation(edu.id, 'current', e.target.checked);
                                    if (e.target.checked) {
                                      updateEducation(edu.id, 'endDate', '');
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="text-sm text-gray-700">Current</label>
                              </div>

                              {!edu.current && (
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                  <input
                                    type="month"
                                    value={edu.endDate || ''}
                                    onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div className="p-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Links</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                        <div className="relative">
                          <input
                            type="url"
                            value={profile.portfolio?.github || ''}
                            onChange={(e) => updatePortfolio('github', e.target.value)}
                            className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            placeholder="https://github.com/username"
                          />
                          <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                        <div className="relative">
                          <input
                            type="url"
                            value={profile.portfolio?.linkedin || ''}
                            onChange={(e) => updatePortfolio('linkedin', e.target.value)}
                            className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            placeholder="https://linkedin.com/in/username"
                          />
                          <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Website</label>
                        <div className="relative">
                          <input
                            type="url"
                            value={profile.portfolio?.portfolio || ''}
                            onChange={(e) => updatePortfolio('portfolio', e.target.value)}
                            className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            placeholder="https://yourportfolio.com"
                          />
                          <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Personal Website</label>
                        <div className="relative">
                          <input
                            type="url"
                            value={profile.portfolio?.website || ''}
                            onChange={(e) => updatePortfolio('website', e.target.value)}
                            className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            placeholder="https://yourwebsite.com"
                          />
                          <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X</label>
                        <div className="relative">
                          <input
                            type="url"
                            value={profile.portfolio?.twitter || ''}
                            onChange={(e) => updatePortfolio('twitter', e.target.value)}
                            className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            placeholder="https://twitter.com/username"
                          />
                          <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Tip:</strong> Adding your portfolio links helps recruiters discover your work and increases your chances of getting matched with relevant opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;