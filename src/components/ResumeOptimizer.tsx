import { AlertCircle, BarChart3, BookOpen, CheckCircle, Download, Eye, FileText, Lightbulb, Loader2, RefreshCw, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import React, { useState } from 'react';
import type { ResumeOptimizationResult } from '../../server/services/resumeOptimizer';
import { backendApi } from '../services/backendService';

interface ResumeOptimizerProps {
    resumeText: string;
    onOptimized?: (optimizedResume: string) => void;
    targetJob?: string;
    industry?: string;
}

const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({
    resumeText,
    onOptimized,
    targetJob,
    industry
}) => {
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationResult, setOptimizationResult] = useState<ResumeOptimizationResult | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'ats' | 'structure' | 'content' | 'market' | 'preview'>('overview');
    const [error, setError] = useState<string>('');

    const handleOptimize = async () => {
        if (!resumeText.trim()) {
            setError('Please provide resume text to optimize');
            return;
        }

        setIsOptimizing(true);
        setError('');

        try {
            const result = await backendApi.optimizeResumeAdvanced(resumeText, targetJob, industry);
            setOptimizationResult(result);
            setActiveTab('overview');
            onOptimized?.(result.optimizedResume);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to optimize resume');
        } finally {
            setIsOptimizing(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
        switch (impact) {
            case 'high': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-blue-600 bg-blue-50';
        }
    };

    if (!optimizationResult) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Advanced Resume Optimization</h3>
                    </div>
                    <button
                        onClick={handleOptimize}
                        disabled={isOptimizing || !resumeText.trim()}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isOptimizing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="h-4 w-4" />
                        )}
                        <span>{isOptimizing ? 'Optimizing...' : 'Optimize Resume'}</span>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">What we analyze:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• ATS compatibility & keyword optimization</li>
                                <li>• Content structure & readability</li>
                                <li>• Impact statements & achievements</li>
                                <li>• Industry relevance & market trends</li>
                            </ul>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Optimization features:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• AI-powered content enhancement</li>
                                <li>• Job-specific tailoring</li>
                                <li>• Market intelligence insights</li>
                                <li>• Comprehensive scoring & feedback</li>
                            </ul>
                        </div>
                    </div>

                    {targetJob && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Target className="h-5 w-5 text-blue-600" />
                                <span className="text-blue-700 font-medium">Target Job:</span>
                                <span className="text-blue-600">{targetJob}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Resume Optimization Results</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${isOptimizing ? 'animate-spin' : ''}`} />
                            <span>Re-optimize</span>
                        </button>
                        <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* Overall Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className={`text-3xl font-bold ${getScoreColor(optimizationResult.atsScore)}`}>
                            {optimizationResult.atsScore}
                        </div>
                        <div className="text-sm text-gray-600">ATS Score</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className={`text-3xl font-bold ${getScoreColor(optimizationResult.structureAnalysis.overallScore)}`}>
                            {optimizationResult.structureAnalysis.overallScore}
                        </div>
                        <div className="text-sm text-gray-600">Structure Score</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">
                            {optimizationResult.improvements.length}
                        </div>
                        <div className="text-sm text-gray-600">Improvements</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'ats', label: 'ATS Analysis', icon: Target },
                        { id: 'structure', label: 'Structure', icon: FileText },
                        { id: 'content', label: 'Content', icon: BookOpen },
                        { id: 'market', label: 'Market Insights', icon: TrendingUp },
                        { id: 'preview', label: 'Optimized Preview', icon: Eye }
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === id
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Improvements</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {optimizationResult.improvements.map((improvement: { category: string; suggestions: string[]; impact: 'high' | 'medium' | 'low' }, index: number) => (
                                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-medium text-gray-900">{improvement.category}</h5>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(improvement.impact)}`}>
                                                {improvement.impact} impact
                                            </span>
                                        </div>
                                        <ul className="space-y-2">
                                            {improvement.suggestions.map((suggestion: string, idx: number) => (
                                                <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span>{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ats' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">ATS Optimization</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <h5 className="font-medium text-red-900 mb-2">Missing Keywords</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {optimizationResult.keywordOptimization.missingKeywords.map((keyword: string, idx: number) => (
                                            <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h5 className="font-medium text-green-900 mb-2">Recommended Keywords</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {optimizationResult.keywordOptimization.recommendedKeywords.map((keyword: string, idx: number) => (
                                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <h5 className="font-medium text-yellow-900 mb-2">Overused Keywords</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {optimizationResult.keywordOptimization.overusedKeywords.map((keyword: string, idx: number) => (
                                            <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'structure' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Structure Analysis</h4>
                            <div className="space-y-4">
                                {optimizationResult.structureAnalysis.sections.map((section: { name: string; score: number; issues: string[]; recommendations: string[] }, index: number) => (
                                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-medium text-gray-900">{section.name}</h5>
                                            <span className={`px-2 py-1 text-sm font-medium rounded ${getScoreColor(section.score)}`}>
                                                {section.score}/100
                                            </span>
                                        </div>
                                        {section.issues.length > 0 && (
                                            <div className="mb-3">
                                                <h6 className="text-sm font-medium text-red-900 mb-2">Issues:</h6>
                                                <ul className="space-y-1">
                                                    {section.issues.map((issue: string, idx: number) => (
                                                        <li key={idx} className="flex items-start space-x-2 text-sm text-red-700">
                                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                            <span>{issue}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {section.recommendations.length > 0 && (
                                            <div>
                                                <h6 className="text-sm font-medium text-green-900 mb-2">Recommendations:</h6>
                                                <ul className="space-y-1">
                                                    {section.recommendations.map((rec: string, idx: number) => (
                                                        <li key={idx} className="flex items-start space-x-2 text-sm text-green-700">
                                                            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                            <span>{rec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Content Enhancement</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h5 className="font-medium text-blue-900 mb-3">Quantifiable Achievements</h5>
                                    <ul className="space-y-2">
                                        {optimizationResult.contentEnhancement.quantifiableAchievements.map((achievement: string, idx: number) => (
                                            <li key={idx} className="flex items-start space-x-2 text-sm text-blue-700">
                                                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <span>{achievement}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <h5 className="font-medium text-purple-900 mb-3">Impact Statements</h5>
                                    <ul className="space-y-2">
                                        {optimizationResult.contentEnhancement.impactStatements.map((statement: string, idx: number) => (
                                            <li key={idx} className="flex items-start space-x-2 text-sm text-purple-700">
                                                <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <span>{statement}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {optimizationResult.contentEnhancement.skillGaps.length > 0 && (
                                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <h5 className="font-medium text-yellow-900 mb-3">Skill Gaps Identified</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {optimizationResult.contentEnhancement.skillGaps.map((skill: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'market' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Market Intelligence</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h5 className="font-medium text-green-900 mb-3">Industry Trends</h5>
                                    <ul className="space-y-2">
                                        {optimizationResult.marketInsights.industryTrends.map((trend: string, idx: number) => (
                                            <li key={idx} className="flex items-start space-x-2 text-sm text-green-700">
                                                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <span>{trend}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h5 className="font-medium text-blue-900 mb-3">Competitive Skills</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {optimizationResult.marketInsights.competitiveSkills.map((skill: string, idx: number) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <h5 className="font-medium text-purple-900 mb-2">Salary Insights</h5>
                                <p className="text-purple-700">{optimizationResult.marketInsights.salaryInsights}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Optimized Resume Preview</h4>
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                                    {optimizationResult.optimizedResume}
                                </pre>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => navigator.clipboard.writeText(optimizationResult.optimizedResume)}
                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Copy to Clipboard
                            </button>
                            <button
                                onClick={() => onOptimized?.(optimizationResult.optimizedResume)}
                                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeOptimizer;