import React, { useState } from 'react';
import type { UserProfile } from '../types.ts';
import { Save, Loader2, Sparkles, Upload, FileText, X, TrendingUp } from 'lucide-react';
import { optimizeProfileSummary } from '../services/geminiService.ts';
import { parseResumeFile } from '../services/resumeParser.ts';
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
    const result = await optimizeProfileSummary(profile.resumeText);
    setProfile({
        ...profile,
        // Append the summary to resume text or replace a section in a real app
        // Here we just update skills for demo visualization
        skills: [...new Set([...profile.skills, ...result.skills])]
    });
    setIsOptimizing(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const { text, skills } = await parseResumeFile(file);
      
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

  const removeResumeFile = () => {
    setProfile({
      ...profile,
      resumeFile: undefined
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Your Agent Profile</h2>
           <p className="text-slate-500 mt-1">This data is used by the AI to match and apply for jobs.</p>
        </div>
        <div className="flex gap-3">
           <button 
               onClick={() => setShowSkillAnalysis(!showSkillAnalysis)}
               className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium text-sm"
           >
               <TrendingUp className="w-4 h-4 mr-2" />
               {showSkillAnalysis ? 'Hide Analysis' : 'Skill Analysis'}
           </button>
           <button 
               className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
           >
               <Save className="w-4 h-4 mr-2" />
               Save Changes
           </button>
        </div>
      </div>

      {showSkillAnalysis && (
        <div className="mb-8">
          <SkillGapAnalysis profile={profile} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Basics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="e.g. Alex Johnson"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={profile.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="e.g. Senior Product Manager"
                />
              </div>

               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={profile.experience}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="e.g. 5 Years"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-semibold text-slate-800 mb-4">Preferences</h3>
             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-medium text-slate-700">Remote Only</span>
                <input 
                    type="checkbox" 
                    checked={profile.preferences.remote}
                    onChange={(e) => setProfile({...profile, preferences: {...profile.preferences, remote: e.target.checked}})}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
             </div>
             <div className="mt-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Salary (USD)</label>
                 <input 
                    type="number"
                    value={profile.preferences.minSalary}
                    onChange={(e) => setProfile({...profile, preferences: {...profile.preferences, minSalary: parseInt(e.target.value)}})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                 />
             </div>
          </div>
        </div>

        {/* Right Column: Resume & Skills */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Resume & Skills</h3>
                <div className="flex gap-2">
                   <label className="text-xs flex items-center bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors cursor-pointer">
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
                       className="text-xs flex items-center bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
                   >
                       {isOptimizing ? <Loader2 className="w-3 h-3 mr-1 animate-spin"/> : <Sparkles className="w-3 h-3 mr-1"/>}
                       AI Extract
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
                    onClick={removeResumeFile}
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Skills (Comma separated)</label>
                    <input
                        type="text"
                        value={profile.skills.join(', ')}
                        onChange={handleSkillsChange}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="React, TypeScript, Node.js..."
                    />
                </div>
                
                <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Paste Resume Text</label>
                    <textarea
                        name="resumeText"
                        value={profile.resumeText}
                        onChange={handleChange}
                        className="flex-1 w-full min-h-[300px] p-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed"
                        placeholder="Paste the full text content of your resume here..."
                    />
                    <p className="text-xs text-slate-400 mt-2 text-right">{profile.resumeText.length} characters</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;