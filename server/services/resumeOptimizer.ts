import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';

const llm = process.env.API_KEY ? new ChatOllama({
    model: "gpt-oss:120b-cloud",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
}) : null;

export interface ResumeOptimizationResult {
    optimizedResume: string;
    improvements: {
        category: string;
        suggestions: string[];
        impact: 'high' | 'medium' | 'low';
    }[];
    atsScore: number;
    keywordOptimization: {
        missingKeywords: string[];
        overusedKeywords: string[];
        recommendedKeywords: string[];
    };
    structureAnalysis: {
        overallScore: number;
        sections: {
            name: string;
            score: number;
            issues: string[];
            recommendations: string[];
        }[];
    };
    contentEnhancement: {
        quantifiableAchievements: string[];
        impactStatements: string[];
        skillGaps: string[];
    };
    marketInsights: {
        industryTrends: string[];
        competitiveSkills: string[];
        salaryInsights: string;
    };
}

/**
 * Advanced resume optimization with comprehensive analysis
 */
export const optimizeResumeAdvanced = async (
    resumeText: string,
    targetJob?: string,
    industry?: string
): Promise<ResumeOptimizationResult> => {
    if (!llm) {
        return getMockOptimizationResult(resumeText);
    }

    try {
        // Comprehensive resume analysis prompt
        const analysisPrompt = `
Analyze this resume comprehensively for optimization. Consider the target job and industry if provided.

Resume Text:
${resumeText.slice(0, 5000)}

${targetJob ? `Target Job: ${targetJob}` : ''}
${industry ? `Industry: ${industry}` : ''}

Provide a detailed analysis covering:
1. ATS compatibility and keyword optimization
2. Content structure and organization
3. Impact and quantifiable achievements
4. Industry relevance and market positioning
5. Specific improvement recommendations

Return as JSON with the following structure:
{
  "atsScore": number (0-100),
  "keywordOptimization": {
    "missingKeywords": string[],
    "overusedKeywords": string[],
    "recommendedKeywords": string[]
  },
  "structureAnalysis": {
    "overallScore": number (0-100),
    "sections": [
      {
        "name": string,
        "score": number (0-100),
        "issues": string[],
        "recommendations": string[]
      }
    ]
  },
  "contentEnhancement": {
    "quantifiableAchievements": string[],
    "impactStatements": string[],
    "skillGaps": string[]
  },
  "marketInsights": {
    "industryTrends": string[],
    "competitiveSkills": string[],
    "salaryInsights": string
  },
  "improvements": [
    {
      "category": string,
      "suggestions": string[],
      "impact": "high" | "medium" | "low"
    }
  ]
}
`;

        const messages = [
            new SystemMessage("You are an expert resume optimization consultant with deep knowledge of ATS systems, recruitment best practices, and industry trends. Always respond with valid JSON."),
            new HumanMessage(analysisPrompt)
        ];

        const analysisResponse = await llm.invoke(messages);
        const analysis = JSON.parse(analysisResponse.content as string);

        // Generate optimized resume based on analysis
        const optimizationPrompt = `
Based on the analysis above, create an optimized version of the resume that addresses the identified issues and incorporates the recommendations.

Original Resume:
${resumeText.slice(0, 5000)}

Analysis Results:
${JSON.stringify(analysis, null, 2)}

Create an optimized resume that:
1. Improves ATS compatibility with better keyword integration
2. Enhances structure and readability
3. Strengthens impact statements and quantifiable achievements
4. Incorporates industry-relevant skills and trends
5. Maintains professional tone and formatting

Return the complete optimized resume text.
`;

        const optimizationMessages = [
            new SystemMessage("You are a professional resume writer specializing in ATS-optimized, impactful resumes. Return only the optimized resume text, no additional commentary."),
            new HumanMessage(optimizationPrompt)
        ];

        const optimizationResponse = await llm.invoke(optimizationMessages);
        const optimizedResume = optimizationResponse.content as string;

        return {
            optimizedResume,
            ...analysis
        };

    } catch (error) {
        console.error('Error in advanced resume optimization:', error);
        return getMockOptimizationResult(resumeText);
    }
};

/**
 * Get mock optimization result for demo purposes
 */
function getMockOptimizationResult(resumeText: string): ResumeOptimizationResult {
    return {
        optimizedResume: resumeText, // Return original for demo
        improvements: [
            {
                category: "ATS Optimization",
                suggestions: [
                    "Add more industry-specific keywords",
                    "Use standard section headers",
                    "Include quantifiable achievements"
                ],
                impact: "high"
            },
            {
                category: "Content Structure",
                suggestions: [
                    "Reorganize sections for better flow",
                    "Strengthen professional summary",
                    "Add skills section with relevant technologies"
                ],
                impact: "medium"
            }
        ],
        atsScore: 75,
        keywordOptimization: {
            missingKeywords: ["agile", "scrum", "react", "typescript"],
            overusedKeywords: [],
            recommendedKeywords: ["full-stack development", "api integration", "cloud computing"]
        },
        structureAnalysis: {
            overallScore: 78,
            sections: [
                {
                    name: "Professional Summary",
                    score: 85,
                    issues: [],
                    recommendations: ["Consider adding industry certifications"]
                },
                {
                    name: "Experience",
                    score: 75,
                    issues: ["Some achievements lack quantification"],
                    recommendations: ["Add metrics to demonstrate impact"]
                },
                {
                    name: "Skills",
                    score: 80,
                    issues: [],
                    recommendations: ["Group skills by category"]
                }
            ]
        },
        contentEnhancement: {
            quantifiableAchievements: [
                "Increased user engagement by 40%",
                "Reduced load times by 60%",
                "Managed team of 5 developers"
            ],
            impactStatements: [
                "Led digital transformation initiative",
                "Implemented CI/CD pipeline",
                "Mentored junior developers"
            ],
            skillGaps: ["Cloud architecture", "DevOps practices", "Advanced React patterns"]
        },
        marketInsights: {
            industryTrends: [
                "Increased demand for cloud-native applications",
                "Growing importance of AI/ML integration",
                "Focus on cybersecurity and data privacy"
            ],
            competitiveSkills: [
                "Kubernetes", "Docker", "AWS/Azure", "CI/CD", "TypeScript", "GraphQL"
            ],
            salaryInsights: "Market rate for similar roles: $120K-$180K annually, depending on location and experience"
        }
    };
}

/**
 * Analyze resume against specific job requirements
 */
export const analyzeJobFit = async (
    resumeText: string,
    jobDescription: string
): Promise<{
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    recommendations: string[];
    optimizedSuggestions: string[];
}> => {
    if (!llm) {
        return {
            matchScore: 75,
            matchedSkills: ["JavaScript", "React", "Node.js"],
            missingSkills: ["TypeScript", "AWS"],
            recommendations: ["Add TypeScript experience", "Highlight cloud experience"],
            optimizedSuggestions: ["Tailor resume keywords to match job posting"]
        };
    }

    try {
        const prompt = `
Analyze how well this resume matches the job description.

Resume:
${resumeText.slice(0, 3000)}

Job Description:
${jobDescription.slice(0, 3000)}

Provide analysis as JSON:
{
  "matchScore": number (0-100),
  "matchedSkills": string[],
  "missingSkills": string[],
  "recommendations": string[],
  "optimizedSuggestions": string[]
}
`;

        const messages = [
            new SystemMessage("You are a recruitment expert analyzing resume-job fit. Always respond with valid JSON."),
            new HumanMessage(prompt)
        ];

        const response = await llm.invoke(messages);
        return JSON.parse(response.content as string);

    } catch (error) {
        console.error('Error analyzing job fit:', error);
        return {
            matchScore: 75,
            matchedSkills: ["JavaScript", "React"],
            missingSkills: ["TypeScript", "AWS"],
            recommendations: ["Add relevant skills", "Customize for job"],
            optimizedSuggestions: ["Use job-specific keywords"]
        };
    }
};