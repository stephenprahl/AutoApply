import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import type { ApplicationRecord, Job, UserProfile } from "../../types.js";

export interface ApplicationOrchestratorState {
    profile?: UserProfile;
    jobs?: Job[];
    applications?: ApplicationRecord[];
    currentJobIndex?: number;
    maxApplications?: number;
    status?: 'idle' | 'processing' | 'completed' | 'error';
    errors?: string[];
    logs?: Array<{
        timestamp: number;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
    }>;
}

export class ApplicationOrchestratorAgent {
    private llm: ChatOllama | null;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.API_KEY;
        if (!key) {
            this.llm = null as any; // Demo mode
        } else {
            this.llm = new ChatOllama({
                model: "gpt-oss:120b-cloud",
                baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            });
        }
    }

    private log(state: ApplicationOrchestratorState, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): ApplicationOrchestratorState {
        const logEntry = {
            timestamp: Date.now(),
            message,
            type
        };

        return {
            ...state,
            logs: [...(state.logs || []), logEntry]
        };
    }

    async prioritizeJobs(profile: UserProfile, jobs: Job[]): Promise<Job[]> {
        // Demo mode fallback - return jobs in original order
        if (!this.llm) {
            return jobs;
        }

        const prioritizationPrompt = `
      As a career strategist, prioritize these job opportunities for this candidate based on:

      CANDIDATE PROFILE:
      - Title: ${profile.title}
      - Experience: ${profile.experience} years
      - Skills: ${profile.skills.join(', ')}
      - Preferences: Remote: ${profile.preferences.remote}, Min Salary: $${profile.preferences.minSalary}

      JOB OPPORTUNITIES:
      ${jobs.map((job, index) => `
      Job ${index + 1}:
      - Title: ${job.title}
      - Company: ${job.company}
      - Location: ${job.location}
      - Salary: ${job.salary}
      - Tags: ${job.tags.join(', ')}
      - Description: ${job.description.slice(0, 200)}...
      `).join('\n')}

      PRIORITIZATION CRITERIA:
      1. Skills match quality
      2. Experience level alignment
      3. Salary competitiveness
      4. Company reputation/culture fit
      5. Location preferences
      6. Role progression potential

      Return a JSON array of job indices in priority order (0-based), with reasoning for top 3 choices.
    `;

        const messages = [
            new SystemMessage("You are a career strategist specializing in job prioritization for tech professionals."),
            new HumanMessage(prioritizationPrompt)
        ];

        const response = await this.llm.invoke(messages);
        const result = JSON.parse(response.content as string);

        // Reorder jobs based on prioritization
        const prioritizedJobs = result.priorities.map((index: number) => jobs[index]);
        return prioritizedJobs;
    }

    async shouldApply(profile: UserProfile, job: Job, matchScore: number): Promise<boolean> {
        // Demo mode fallback - apply if score > 70
        if (!this.llm) {
            return matchScore > 70;
        }

        const decisionPrompt = `
      Decide whether this candidate should apply to this job.

      CANDIDATE: ${profile.name} (${profile.title}, ${profile.experience} years experience)
      SKILLS: ${profile.skills.join(', ')}

      JOB: ${job.title} at ${job.company}
      MATCH SCORE: ${matchScore}/100

      FACTORS TO CONSIDER:
      - Match score threshold (recommend applying if >70)
      - Skills alignment
      - Experience level appropriateness
      - Company and role appeal
      - Application volume strategy

      Return JSON: { shouldApply: boolean, reasoning: string }
    `;

        const messages = [
            new SystemMessage("You are a strategic career advisor helping candidates decide which jobs to apply to."),
            new HumanMessage(decisionPrompt)
        ];

        const response = await this.llm.invoke(messages);
        const result = JSON.parse(response.content as string);

        return result.shouldApply;
    }

    async process(state: ApplicationOrchestratorState): Promise<ApplicationOrchestratorState> {
        let currentState: ApplicationOrchestratorState = { ...state, status: 'processing' };

        try {
            if (!state.profile || !state.jobs || state.jobs.length === 0) {
                return this.log({ ...currentState, status: 'error' }, "Profile and jobs required for orchestration", "error");
            }

            currentState = this.log(currentState, `Starting application orchestration for ${state.jobs.length} jobs`);

            // Prioritize jobs
            const prioritizedJobs = await this.prioritizeJobs(state.profile, state.jobs);
            currentState = { ...currentState, jobs: prioritizedJobs };
            currentState = this.log(currentState, "Jobs prioritized by match quality and opportunity");

            // Process applications up to the limit
            const maxApps = state.maxApplications || 5;
            const applications: ApplicationRecord[] = [];
            let processedCount = 0;

            for (const job of prioritizedJobs) {
                if (processedCount >= maxApps) break;

                // Create application record ready for web automation
                const application: ApplicationRecord = {
                    id: `${job.id}_${Date.now()}_${processedCount}`,
                    jobId: job.id,
                    jobTitle: job.title,
                    company: job.company,
                    status: 'READY_TO_SUBMIT' as const, // New status for web automation
                    matchScore: 75 + Math.random() * 20, // Placeholder score - will be updated by analyzer
                    timestamp: Date.now()
                };

                applications.push(application);
                processedCount++;
                currentState = this.log(currentState, `Queued application for ${job.title} at ${job.company}`);
            }

            currentState = {
                ...currentState,
                applications,
                status: 'completed' as const,
                currentJobIndex: processedCount
            };

            currentState = this.log(currentState, `Orchestration completed. ${processedCount} applications queued.`);

            return currentState;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            currentState = { ...currentState, status: 'error' as const };
            return this.log(currentState, `Orchestration failed: ${errorMessage}`, "error");
        }
    }
}