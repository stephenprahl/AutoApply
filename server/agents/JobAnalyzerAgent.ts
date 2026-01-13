import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import type { Job, SkillGap, UserProfile } from "../../src/types.js";

export interface JobAnalyzerAgentState {
    profile?: UserProfile;
    job?: Job;
    matchScore?: number;
    matchReason?: string;
    isMatch?: boolean;
    skillGap?: SkillGap;
    errors?: string[];
}

export class JobAnalyzerAgent {
    private llm: ChatOllama | null;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.API_KEY;
        if (!key) {
            this.llm = null as any; // Demo mode
        } else {
            try {
                this.llm = new ChatOllama({
                    model: "gpt-oss:120b-cloud",
                    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
                });
            } catch (error) {
                console.warn("Failed to initialize ChatOllama for JobAnalyzerAgent, falling back to demo mode:", error);
                this.llm = null as any;
            }
        }
    }

    async analyzeJobFit(profile: UserProfile, job: Job): Promise<{
        score: number;
        reason: string;
        isMatch: boolean;
        skillGap: SkillGap;
    }> {
        // Demo mode fallback
        if (!this.llm) {
            return {
                score: 75,
                reason: "Demo Mode: API Key missing. Estimated good fit based on basic criteria.",
                isMatch: true,
                skillGap: {
                    missing: ["Advanced TypeScript"],
                    strong: profile.skills.slice(0, 3),
                    recommended: ["System Design", "Cloud Architecture"],
                    analysis: "Basic skill gap analysis in demo mode"
                }
            };
        }

        const analysisPrompt = `
      Act as a senior technical recruiter with 10+ years of experience.

      Evaluate this candidate's fit for this specific job:

      CANDIDATE PROFILE:
      - Name: ${profile.name}
      - Title: ${profile.title}
      - Experience: ${profile.experience} years
      - Skills: ${profile.skills.join(', ')}
      - Resume Summary: ${profile.resumeText.slice(0, 1000)}...

      JOB REQUIREMENTS:
      - Title: ${job.title}
      - Company: ${job.company}
      - Description: ${job.description}
      - Required Skills/Tags: ${job.tags.join(', ')}

      ANALYSIS REQUIREMENTS:
      1. Calculate a match score (0-100) based on:
         - Skills alignment (40%)
         - Experience level match (30%)
         - Role/title compatibility (20%)
         - Industry/company fit (10%)

      2. Provide a detailed reason explaining the score

      3. Determine if this is a good match (score > 70)

      4. Analyze skill gaps:
         - Missing skills the candidate lacks
         - Strong skills the candidate has that match well
         - Recommended skills to develop

      Return as JSON with: score, reason, isMatch, skillGap (with missing, strong, recommended arrays, and analysis text)
    `;

        const messages = [
            new SystemMessage("You are an expert technical recruiter specializing in software engineering and tech roles."),
            new HumanMessage(analysisPrompt)
        ];

        const response = await this.llm.invoke(messages);
        const result = JSON.parse(response.content as string);

        return {
            score: result.score || 0,
            reason: result.reason || "Analysis failed",
            isMatch: result.isMatch || false,
            skillGap: result.skillGap || {
                missing: [],
                strong: [],
                recommended: [],
                analysis: "Skill gap analysis not available"
            }
        };
    }

    async process(state: JobAnalyzerAgentState): Promise<JobAnalyzerAgentState> {
        if (!state.profile || !state.job) {
            return {
                ...state,
                errors: [...(state.errors || []), "Profile and job data required for analysis"]
            };
        }

        try {
            const analysis = await this.analyzeJobFit(state.profile, state.job);
            return {
                ...state,
                matchScore: analysis.score,
                matchReason: analysis.reason,
                isMatch: analysis.isMatch,
                skillGap: analysis.skillGap,
                errors: state.errors?.filter(e => e !== "Profile and job data required for analysis")
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ...state,
                errors: [...(state.errors || []), `Job analysis failed: ${errorMessage}`]
            };
        }
    }
}