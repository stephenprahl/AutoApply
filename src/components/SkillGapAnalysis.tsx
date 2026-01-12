import React, { useState, useEffect } from 'react';
import type { UserProfile, SkillGap } from '../types.ts';
import { analyzeSkillGap, getMarketTrends } from '../services/skillGapService.ts';
import { TrendingUp, AlertCircle, CheckCircle, Lightbulb, Loader2 } from 'lucide-react';

interface SkillGapAnalysisProps {
  profile: UserProfile;
}

const SkillGapAnalysis: React.FC<SkillGapAnalysisProps> = ({ profile }) => {
  const [skillGap, setSkillGap] = useState<SkillGap | null>(null);
  const [marketTrends, setMarketTrends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setIsLoading(true);
        const [gapData, trends] = await Promise.all([
          analyzeSkillGap(profile),
          getMarketTrends()
        ]);
        setSkillGap(gapData);
        setMarketTrends(trends);
      } catch (error) {
        console.error('Error loading skill analysis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysis();
  }, [profile]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
          <span className="text-slate-600">Analyzing skills...</span>
        </div>
      </div>
    );
  }

  if (!skillGap) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center py-12 text-slate-400">
          Unable to load skill analysis.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-indigo-600 mt-1" />
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">Skill Analysis</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{skillGap.analysis}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strong Skills */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-slate-800">Strong Skills</h3>
          </div>
          <div className="space-y-2">
            {skillGap.strong.length > 0 ? (
              skillGap.strong.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-700">{skill}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No strong skills identified</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-slate-800">Skills to Learn</h3>
          </div>
          <div className="space-y-2">
            {skillGap.missing.length > 0 ? (
              skillGap.missing.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-sm text-slate-700">{skill}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No missing skills identified</p>
            )}
          </div>
        </div>

        {/* Recommended Skills */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-slate-800">Next Steps</h3>
          </div>
          <div className="space-y-2">
            {skillGap.recommended.length > 0 ? (
              skillGap.recommended.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">{skill}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No recommendations available</p>
            )}
          </div>
        </div>
      </div>

      {/* Market Trends */}
      {marketTrends.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Market Trends 2024
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {marketTrends.map((trend, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                <span className="text-sm text-slate-700">{trend}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGapAnalysis;
